import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'

interface NestEscrowRequest {
  contractId?: string
  landlordId: string
  tenantId: string
  depositAmount: number
  firstMonthAmount?: number
  utilitiesAmount?: number
  releaseConditions?: any
}

interface SimpleNestEscrowRequest {
  landlordId: string
  tenantId?: string
  tenantName: string
  tenantEmail: string
  
  propertyAddress: string
  propertyPostcode: string
  propertyCity: string
  propertyType: string
  
  depositAmount: number
  firstMonthAmount: number
  prepaidAmount: number
  utilitiesAmount: number
  
  startDate: string
  endDate?: string
  
  releaseConditions: {
    depositReleaseType: 'LEASE_END' | 'SPECIFIC_DATE' | 'MANUAL' | 'MOVE_IN_PLUS_5'
    depositReleaseDate?: string
    firstMonthReleaseType: 'START_DATE' | 'SPECIFIC_DATE' | 'MANUAL'
    firstMonthReleaseDate?: string
  }
}

interface ReleaseRuleRequest {
  type: 'AUTOMATIC' | 'MANUAL'
  triggerType: string
  triggerDate?: string
  amount?: number
  percentage?: number
  requiresNotification?: boolean
  notificationDaysBefore?: number
  allowObjection?: boolean
  objectionPeriodDays?: number
}

interface TransactionRequest {
  type: 'DEPOSIT' | 'RELEASE' | 'REFUND' | 'DEDUCTION'
  amount: number
  reason?: string
  scheduledDate?: string
}

interface ApprovalRequest {
  status: 'APPROVED' | 'REJECTED'
  comment?: string
}

const nestEscrowRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // =============== CRUD OPERATIONER ===============

  // Opret ny Nest escrow
  fastify.post('/nest/escrows', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const {
        contractId,
        landlordId,
        tenantId,
        depositAmount,
        firstMonthAmount = 0,
        utilitiesAmount = 0,
        releaseConditions
      } = request.body as NestEscrowRequest

      // Verificer at brugeren er enten landlord eller tenant
      if (userId !== landlordId && userId !== tenantId) {
        return reply.status(403).send({ error: 'Du kan kun oprette escrow hvor du er part' })
      }

      const totalAmount = depositAmount + firstMonthAmount + utilitiesAmount

      const escrow = await fastify.prisma.nestEscrow.create({
        data: {
          contractId,
          landlordId,
          tenantId,
          depositAmount,
          firstMonthAmount,
          utilitiesAmount,
          totalAmount,
          status: 'PENDING'
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      })

      // Opret audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId: escrow.id,
          action: 'CREATED',
          performedById: userId,
          performedByRole: userId === landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify({ totalAmount, depositAmount, firstMonthAmount, utilitiesAmount }),
          ipAddress: request.ip
        }
      })

      reply.send(escrow)
    } catch (error) {
      console.error('Error creating nest escrow:', error)
      reply.status(500).send({ error: 'Failed to create nest escrow' })
    }
  })

  // Opret ny Nest escrow - simplified flow
  fastify.post('/nest/escrows/simple', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const data = request.body as SimpleNestEscrowRequest

      // Verificer at brugeren er landlord
      if (userId !== data.landlordId) {
        return reply.status(403).send({ error: 'Du kan kun oprette escrow som udlejer' })
      }

      let tenantId = data.tenantId

      // Hvis tenant ikke eksisterer, create or invite
      if (!tenantId) {
        try {
          // Check if user already exists
          const existingUser = await fastify.prisma.user.findUnique({
            where: { email: data.tenantEmail }
          })

          if (existingUser) {
            tenantId = existingUser.id
          } else {
            // Create tenant user with minimal info
            const newTenant = await fastify.prisma.user.create({
              data: {
                email: data.tenantEmail,
                firstName: data.tenantName.split(' ')[0] || data.tenantName,
                lastName: data.tenantName.split(' ').slice(1).join(' ') || '',
                password: '', // Will be set when they activate account
                role: 'TENANT'
              }
            })
            tenantId = newTenant.id

            // TODO: Create invitation system for new tenants
            console.log(`New tenant created: ${data.tenantEmail}, invitation system needs to be implemented`)
          }
        } catch (error) {
          console.error('Error creating/finding tenant:', error)
          return reply.status(400).send({ error: 'Fejl ved oprettelse af lejer bruger' })
        }
      }

      const totalAmount = data.depositAmount + data.firstMonthAmount + data.prepaidAmount + data.utilitiesAmount

      // Create the escrow with new state machine
      const escrow = await fastify.prisma.nestEscrow.create({
        data: {
          landlordId: data.landlordId,
          tenantId: tenantId!,
          type: 'DEPOSIT',
          status: 'DRAFT', // Start in DRAFT state
          version: 1,
          depositAmount: data.depositAmount,
          firstMonthAmount: data.firstMonthAmount,
          prepaidAmount: data.prepaidAmount,
          utilitiesAmount: data.utilitiesAmount,
          totalAmount,
          propertyAddress: data.propertyAddress,
          propertyPostcode: data.propertyPostcode,
          propertyCity: data.propertyCity,
          propertyType: data.propertyType,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          // Deadline configuration from spec
          claimWindowDays: 14,
          responseWindowDays: 5,
          autoReleaseDays: 21,
          settlementRounds: 2
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      })

      // Create automatic release rules based on the release conditions
      const releaseRules = []

      // Deposit release rule
      if (data.releaseConditions.depositReleaseType === 'LEASE_END') {
        releaseRules.push({
          escrowId: escrow.id,
          type: 'AUTOMATIC' as const,
          triggerType: 'LEASE_END',
          amount: data.depositAmount,
          requiresNotification: true,
          notificationDaysBefore: 7,
          allowObjection: true,
          objectionPeriodDays: 14
        })
      } else if (data.releaseConditions.depositReleaseType === 'MOVE_IN_PLUS_5') {
        // Calculate 5 days after move-in date
        const moveInPlusFive = new Date(data.startDate)
        moveInPlusFive.setDate(moveInPlusFive.getDate() + 5)
        releaseRules.push({
          escrowId: escrow.id,
          type: 'AUTOMATIC' as const,
          triggerType: 'MOVE_IN_PLUS_5',
          triggerDate: moveInPlusFive,
          amount: data.depositAmount,
          requiresNotification: false,
          allowObjection: true,
          objectionPeriodDays: 5
        })
      } else if (data.releaseConditions.depositReleaseType === 'SPECIFIC_DATE' && data.releaseConditions.depositReleaseDate) {
        releaseRules.push({
          escrowId: escrow.id,
          type: 'AUTOMATIC' as const,
          triggerType: 'SPECIFIC_DATE',
          triggerDate: new Date(data.releaseConditions.depositReleaseDate),
          amount: data.depositAmount,
          requiresNotification: true,
          notificationDaysBefore: 7,
          allowObjection: true,
          objectionPeriodDays: 14
        })
      }

      // First month release rule (if amount > 0)
      if (data.firstMonthAmount > 0) {
        if (data.releaseConditions.firstMonthReleaseType === 'START_DATE') {
          releaseRules.push({
            escrowId: escrow.id,
            type: 'AUTOMATIC' as const,
            triggerType: 'START_DATE',
            triggerDate: new Date(data.startDate),
            amount: data.firstMonthAmount,
            requiresNotification: false,
            allowObjection: false
          })
        } else if (data.releaseConditions.firstMonthReleaseType === 'SPECIFIC_DATE' && data.releaseConditions.firstMonthReleaseDate) {
          releaseRules.push({
            escrowId: escrow.id,
            type: 'AUTOMATIC' as const,
            triggerType: 'SPECIFIC_DATE',
            triggerDate: new Date(data.releaseConditions.firstMonthReleaseDate),
            amount: data.firstMonthAmount,
            requiresNotification: false,
            allowObjection: false
          })
        }
      }

      // Prepaid rent release rule (if amount > 0)
      if (data.prepaidAmount > 0) {
        releaseRules.push({
          escrowId: escrow.id,
          type: 'AUTOMATIC' as const,
          triggerType: 'START_DATE',
          triggerDate: new Date(data.startDate),
          amount: data.prepaidAmount,
          requiresNotification: false,
          allowObjection: false
        })
      }

      // Create release rules
      if (releaseRules.length > 0) {
        await fastify.prisma.nestReleaseRule.createMany({
          data: releaseRules
        })
      }

      // Create audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId: escrow.id,
          action: 'CREATED',
          performedById: userId,
          performedByRole: 'LANDLORD',
          details: JSON.stringify({ 
            method: 'simple',
            totalAmount, 
            propertyAddress: data.propertyAddress,
            tenantEmail: data.tenantEmail 
          }),
          ipAddress: request.ip
        }
      })

      reply.send(escrow)
    } catch (error) {
      console.error('Error creating simple nest escrow:', error)
      reply.status(500).send({ error: 'Failed to create nest escrow' })
    }
  })

  // Approve escrow terms (DRAFT -> AGREED)
  fastify.post('/nest/escrows/:id/approve', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      if (escrow.status !== 'DRAFT') {
        return reply.status(400).send({ error: 'Kun escrow i DRAFT status kan godkendes' })
      }

      // Create contract version with current terms
      await fastify.prisma.nestContract.create({
        data: {
          escrowId,
          version: escrow.version,
          status: 'AGREED',
          terms: JSON.stringify({
            depositAmount: escrow.depositAmount,
            firstMonthAmount: escrow.firstMonthAmount,
            prepaidAmount: escrow.prepaidAmount,
            totalAmount: escrow.totalAmount,
            propertyAddress: escrow.propertyAddress,
            startDate: escrow.startDate,
            endDate: escrow.endDate,
            claimWindowDays: escrow.claimWindowDays,
            responseWindowDays: escrow.responseWindowDays,
            autoReleaseDays: escrow.autoReleaseDays,
            settlementRounds: escrow.settlementRounds
          }),
          hash: 'SHA256_PLACEHOLDER', // TODO: Implement proper hashing
          [userId === escrow.landlordId ? 'landlordSignedAt' : 'tenantSignedAt']: new Date()
        }
      })

      // Check if both parties have signed
      const contract = await fastify.prisma.nestContract.findFirst({
        where: { escrowId, version: escrow.version }
      })

      let updatedEscrow
      if (contract?.landlordSignedAt && contract?.tenantSignedAt) {
        // Both parties signed -> move to AGREED
        updatedEscrow = await fastify.prisma.nestEscrow.update({
          where: { id: escrowId },
          data: {
            status: 'AGREED',
            agreedAt: new Date()
          }
        })
      } else {
        // Still waiting for other party
        updatedEscrow = escrow
      }

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: userId === escrow.landlordId ? 'LANDLORD_APPROVED' : 'TENANT_APPROVED',
          performedById: userId,
          performedByRole: userId === escrow.landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify({ version: escrow.version }),
          ipAddress: request.ip
        }
      })

      reply.send(updatedEscrow)
    } catch (error) {
      console.error('Error approving escrow:', error)
      reply.status(500).send({ error: 'Failed to approve escrow' })
    }
  })

  // Fund escrow (AGREED -> FUNDED -> ACTIVE)
  fastify.post('/nest/escrows/:id/fund', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      const { paymentReference } = request.body as { paymentReference?: string }
      
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          tenantId: userId // Only tenant can fund
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found eller du har ikke tilladelse' })
      }

      if (escrow.status !== 'AGREED') {
        return reply.status(400).send({ error: 'Escrow skal være AGREED før funding' })
      }

      // Create deposit transaction
      await fastify.prisma.nestTransaction.create({
        data: {
          escrowId,
          type: 'DEPOSIT',
          amount: escrow.totalAmount,
          initiatedById: userId,
          reason: 'Escrow funding',
          status: 'COMPLETED', // In real implementation, this would be PENDING until payment confirmed
          paymentReference,
          executedAt: new Date()
        }
      })

      // Update escrow to FUNDED and then immediately to ACTIVE
      const updatedEscrow = await fastify.prisma.nestEscrow.update({
        where: { id: escrowId },
        data: {
          status: 'ACTIVE',
          fundedAt: new Date(),
          activatedAt: new Date()
        }
      })

      // Create initial deadlines based on configuration
      if (escrow.startDate) {
        // Create deadline for automatic claim window start after move-out
        await fastify.prisma.nestDeadline.create({
          data: {
            escrowId,
            type: 'CLAIM_WINDOW',
            description: `Kravfrist starter ${escrow.claimWindowDays} dage efter fraflytning`,
            deadline: new Date(escrow.endDate || escrow.startDate), // Placeholder
            autoAction: 'START_CLAIM_WINDOW',
            autoActionData: JSON.stringify({ windowDays: escrow.claimWindowDays })
          }
        })
      }

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: 'FUNDED',
          performedById: userId,
          performedByRole: 'TENANT',
          details: JSON.stringify({ amount: escrow.totalAmount, paymentReference }),
          ipAddress: request.ip
        }
      })

      reply.send(updatedEscrow)
    } catch (error) {
      console.error('Error funding escrow:', error)
      reply.status(500).send({ error: 'Failed to fund escrow' })
    }
  })

  // Hent brugerens escrows
  fastify.get('/nest/escrows', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const escrows = await fastify.prisma.nestEscrow.findMany({
        where: {
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          releaseRules: {
            where: { status: 'ACTIVE' },
            orderBy: { triggerDate: 'asc' }
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: {
              transactions: true,
              approvals: { where: { status: 'PENDING' } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ escrows })
    } catch (error) {
      console.error('Error fetching nest escrows:', error)
      reply.status(500).send({ error: 'Failed to fetch nest escrows' })
    }
  })

  // Hent enkelt escrow med detaljer
  fastify.get('/nest/escrows/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as { id: string }

      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          releaseRules: {
            include: {
              approvals: {
                include: {
                  approver: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          transactions: {
            include: {
              initiatedBy: {
                select: { id: true, firstName: true, lastName: true, email: true }
              },
              approvals: {
                include: {
                  approver: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          auditLogs: {
            include: {
              performedBy: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          disputes: {
            include: {
              initiatedBy: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      reply.send(escrow)
    } catch (error) {
      console.error('Error fetching nest escrow details:', error)
      reply.status(500).send({ error: 'Failed to fetch nest escrow details' })
    }
  })

  // Opdater escrow (kun for grundlæggende felter)
  fastify.put('/nest/escrows/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as { id: string }
      const updates = request.body as Partial<NestEscrowRequest>

      // Find escrow og verificer adgang
      const existingEscrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!existingEscrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      // Kun tillad opdateringer hvis status er PENDING
      if (existingEscrow.status !== 'PENDING') {
        return reply.status(400).send({ error: 'Kan kun opdatere escrow i PENDING status' })
      }

      // Beregn nyt total hvis beløb opdateres
      const newTotalAmount = (updates.depositAmount || existingEscrow.depositAmount) +
                            (updates.firstMonthAmount || existingEscrow.firstMonthAmount) +
                            (updates.utilitiesAmount || existingEscrow.utilitiesAmount)

      const updatedEscrow = await fastify.prisma.nestEscrow.update({
        where: { id },
        data: {
          ...updates,
          totalAmount: newTotalAmount,
          updatedAt: new Date()
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      })

      // Opret audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId: id,
          action: 'MODIFIED',
          performedById: userId,
          performedByRole: userId === existingEscrow.landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify({ updates, newTotalAmount }),
          ipAddress: request.ip
        }
      })

      reply.send(updatedEscrow)
    } catch (error) {
      console.error('Error updating nest escrow:', error)
      reply.status(500).send({ error: 'Failed to update nest escrow' })
    }
  })

  // Slet escrow (kun hvis ingen penge er deponeret)
  fastify.delete('/nest/escrows/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as { id: string }

      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        },
        include: {
          transactions: {
            where: { status: 'COMPLETED' }
          }
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      // Tjek om der er fuldførte transaktioner
      if (escrow.transactions.length > 0) {
        return reply.status(400).send({ error: 'Kan ikke slette escrow med fuldførte transaktioner' })
      }

      // Slet alle relaterede records (cascade delete skulle klare det, men for at være sikker)
      await fastify.prisma.nestEscrow.delete({
        where: { id }
      })

      reply.send({ message: 'Nest escrow deleted successfully' })
    } catch (error) {
      console.error('Error deleting nest escrow:', error)
      reply.status(500).send({ error: 'Failed to delete nest escrow' })
    }
  })

  // =============== FRIGIVELSESREGLER ===============

  // Opret frigivelsesregel
  fastify.post('/nest/escrows/:id/release-rules', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      const ruleData = request.body as ReleaseRuleRequest

      // Verificer adgang til escrow
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      const releaseRule = await fastify.prisma.nestReleaseRule.create({
        data: {
          escrowId,
          type: ruleData.type,
          triggerType: ruleData.triggerType,
          triggerDate: ruleData.triggerDate ? new Date(ruleData.triggerDate) : null,
          amount: ruleData.amount || null,
          percentage: ruleData.percentage || null,
          requiresNotification: ruleData.requiresNotification ?? true,
          notificationDaysBefore: ruleData.notificationDaysBefore ?? 7,
          allowObjection: ruleData.allowObjection ?? true,
          objectionPeriodDays: ruleData.objectionPeriodDays ?? 14
        }
      })

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: 'RELEASE_RULE_CREATED',
          performedById: userId,
          performedByRole: userId === escrow.landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify(ruleData),
          ipAddress: request.ip
        }
      })

      reply.send(releaseRule)
    } catch (error) {
      console.error('Error creating release rule:', error)
      reply.status(500).send({ error: 'Failed to create release rule' })
    }
  })

  // Opdater frigivelsesregel
  fastify.put('/nest/escrows/:id/release-rules/:ruleId', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId, ruleId } = request.params as { id: string, ruleId: string }
      const updates = request.body as Partial<ReleaseRuleRequest>

      // Verificer adgang
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      const releaseRule = await fastify.prisma.nestReleaseRule.findFirst({
        where: { id: ruleId, escrowId }
      })

      if (!releaseRule) {
        return reply.status(404).send({ error: 'Release rule not found' })
      }

      // Kan kun opdatere aktive regler
      if (releaseRule.status !== 'ACTIVE') {
        return reply.status(400).send({ error: 'Kan kun opdatere aktive frigivelsesregler' })
      }

      const updatedRule = await fastify.prisma.nestReleaseRule.update({
        where: { id: ruleId },
        data: {
          ...updates,
          triggerDate: updates.triggerDate ? new Date(updates.triggerDate) : releaseRule.triggerDate
        }
      })

      reply.send(updatedRule)
    } catch (error) {
      console.error('Error updating release rule:', error)
      reply.status(500).send({ error: 'Failed to update release rule' })
    }
  })

  // Slet frigivelsesregel
  fastify.delete('/nest/escrows/:id/release-rules/:ruleId', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId, ruleId } = request.params as { id: string, ruleId: string }

      // Verificer adgang
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      await fastify.prisma.nestReleaseRule.delete({
        where: { id: ruleId, escrowId }
      })

      reply.send({ message: 'Release rule deleted successfully' })
    } catch (error) {
      console.error('Error deleting release rule:', error)
      reply.status(500).send({ error: 'Failed to delete release rule' })
    }
  })

  // =============== TRANSAKTIONER ===============

  // Indskyd penge (depositum)
  fastify.post('/nest/escrows/:id/deposit', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      const { amount, paymentReference } = request.body as { amount: number, paymentReference?: string }

      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          tenantId: userId // Kun lejer kan indsætte penge
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found eller du har ikke tilladelse' })
      }

      const transaction = await fastify.prisma.nestTransaction.create({
        data: {
          escrowId,
          type: 'DEPOSIT',
          amount,
          initiatedById: userId,
          reason: 'Depositum indbetaling',
          status: 'PENDING',
          paymentReference
        }
      })

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: 'DEPOSIT_INITIATED',
          performedById: userId,
          performedByRole: 'TENANT',
          details: JSON.stringify({ amount, paymentReference }),
          ipAddress: request.ip
        }
      })

      reply.send(transaction)
    } catch (error) {
      console.error('Error creating deposit:', error)
      reply.status(500).send({ error: 'Failed to create deposit' })
    }
  })

  // Request release (ACTIVE -> RELEASE_PENDING)
  fastify.post('/nest/escrows/:id/request-release', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      const { reason } = request.body as { reason?: string }
      
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      if (escrow.status !== 'ACTIVE') {
        return reply.status(400).send({ error: 'Kun aktive escrows kan anmode om frigivelse' })
      }

      // Update escrow to RELEASE_PENDING
      const updatedEscrow = await fastify.prisma.nestEscrow.update({
        where: { id: escrowId },
        data: {
          status: 'RELEASE_PENDING',
          releasePendingAt: new Date(),
          moveOutDate: new Date() // Set move-out date to now
        }
      })

      // Create deadline for claim window
      await fastify.prisma.nestDeadline.create({
        data: {
          escrowId,
          type: 'CLAIM_WINDOW',
          description: `Kravfrist udløber om ${escrow.claimWindowDays} dage`,
          deadline: new Date(Date.now() + escrow.claimWindowDays * 24 * 60 * 60 * 1000),
          autoAction: 'AUTO_RELEASE',
          autoActionData: JSON.stringify({ 
            releaseAmount: escrow.depositAmount,
            releaseType: 'FULL_RELEASE'
          })
        }
      })

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: 'RELEASE_REQUESTED',
          performedById: userId,
          performedByRole: userId === escrow.landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify({ reason: reason || 'Standard frigivelsesanmodning' }),
          ipAddress: request.ip
        }
      })

      reply.send(updatedEscrow)
    } catch (error) {
      console.error('Error requesting release:', error)
      reply.status(500).send({ error: 'Failed to request release' })
    }
  })

  // Anmod om frigivelse (legacy endpoint - keep for backward compatibility)
  fastify.post('/nest/escrows/:id/release', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      const transactionData = request.body as TransactionRequest

      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      const transaction = await fastify.prisma.nestTransaction.create({
        data: {
          escrowId,
          type: transactionData.type,
          amount: transactionData.amount,
          initiatedById: userId,
          reason: transactionData.reason || 'Manuel frigivelse',
          status: 'PENDING',
          scheduledDate: transactionData.scheduledDate ? new Date(transactionData.scheduledDate) : null
        }
      })

      // Opret påkrævet godkendelse (den anden part skal godkende)
      const approverRole = userId === escrow.landlordId ? 'TENANT' : 'LANDLORD'
      const approverId = userId === escrow.landlordId ? escrow.tenantId : escrow.landlordId

      await fastify.prisma.nestApproval.create({
        data: {
          escrowId,
          transactionId: transaction.id,
          approverId,
          approverRole,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 dage
        }
      })

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: 'RELEASE_REQUESTED',
          performedById: userId,
          performedByRole: userId === escrow.landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify(transactionData),
          ipAddress: request.ip
        }
      })

      reply.send(transaction)
    } catch (error) {
      console.error('Error requesting release:', error)
      reply.status(500).send({ error: 'Failed to request release' })
    }
  })

  // =============== GODKENDELSER ===============

  // Godkend/afvis transaktion
  fastify.post('/nest/escrows/:id/approve/:approvalId', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId, approvalId } = request.params as { id: string, approvalId: string }
      const { status, comment } = request.body as ApprovalRequest

      const approval = await fastify.prisma.nestApproval.findFirst({
        where: {
          id: approvalId,
          escrowId,
          approverId: userId,
          status: 'PENDING'
        },
        include: {
          transaction: true,
          escrow: true
        }
      })

      if (!approval) {
        return reply.status(404).send({ error: 'Approval not found eller allerede behandlet' })
      }

      // Opdater godkendelse
      const updatedApproval = await fastify.prisma.nestApproval.update({
        where: { id: approvalId },
        data: {
          status,
          responseAt: new Date(),
          comment
        }
      })

      // Hvis godkendt og det er en transaktion, marker som klar til udførelse
      if (status === 'APPROVED' && approval.transaction) {
        await fastify.prisma.nestTransaction.update({
          where: { id: approval.transaction.id },
          data: { status: 'PROCESSING' }
        })
      }

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          performedById: userId,
          performedByRole: approval.approverRole,
          details: JSON.stringify({ approvalId, comment }),
          ipAddress: request.ip
        }
      })

      reply.send(updatedApproval)
    } catch (error) {
      console.error('Error processing approval:', error)
      reply.status(500).send({ error: 'Failed to process approval' })
    }
  })

  // Hent ventende godkendelser for bruger
  fastify.get('/nest/approvals/pending', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const pendingApprovals = await fastify.prisma.nestApproval.findMany({
        where: {
          approverId: userId,
          status: 'PENDING',
          deadline: { gt: new Date() }
        },
        include: {
          escrow: {
            include: {
              landlord: {
                select: { id: true, firstName: true, lastName: true, email: true }
              },
              tenant: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          },
          transaction: true,
          releaseRule: true
        },
        orderBy: { deadline: 'asc' }
      })

      reply.send({ approvals: pendingApprovals })
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
      reply.status(500).send({ error: 'Failed to fetch pending approvals' })
    }
  })

  // =============== CLAIMS SYSTEM ===============

  // Create a claim (during RELEASE_PENDING phase)
  fastify.post('/nest/escrows/:id/claims', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      const { type, amount, description } = request.body as { 
        type: 'DEDUCTION' | 'REFUND' | 'DISPUTE', 
        amount: number, 
        description: string 
      }
      
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      if (escrow.status !== 'RELEASE_PENDING') {
        return reply.status(400).send({ error: 'Kan kun oprette krav under frigivelsesperioden' })
      }

      // Calculate response deadline
      const responseDeadline = new Date(Date.now() + escrow.responseWindowDays * 24 * 60 * 60 * 1000)

      const claim = await fastify.prisma.nestClaim.create({
        data: {
          escrowId,
          claimantId: userId,
          type,
          amount,
          description,
          responseDeadline
        }
      })

      // Update escrow status to DISPUTED if it's a dispute
      if (type === 'DISPUTE') {
        await fastify.prisma.nestEscrow.update({
          where: { id: escrowId },
          data: { 
            status: 'DISPUTED',
            disputedAt: new Date()
          }
        })
      }

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: 'CLAIM_CREATED',
          performedById: userId,
          performedByRole: userId === escrow.landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify({ type, amount, description }),
          ipAddress: request.ip
        }
      })

      reply.send(claim)
    } catch (error) {
      console.error('Error creating claim:', error)
      reply.status(500).send({ error: 'Failed to create claim' })
    }
  })

  // Respond to a claim
  fastify.post('/nest/escrows/:id/claims/:claimId/respond', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId, claimId } = request.params as { id: string, claimId: string }
      const { action, amount, comment } = request.body as { 
        action: 'ACCEPT' | 'REJECT' | 'COUNTER_OFFER', 
        amount?: number, 
        comment?: string 
      }
      
      const claim = await fastify.prisma.nestClaim.findFirst({
        where: {
          id: claimId,
          escrowId,
          status: 'PENDING'
        },
        include: {
          escrow: true
        }
      })

      if (!claim) {
        return reply.status(404).send({ error: 'Claim not found eller allerede behandlet' })
      }

      // Verify user is the other party (not the claimant)
      const escrow = claim.escrow
      const isLandlord = userId === escrow.landlordId
      const isTenant = userId === escrow.tenantId
      const isClaimant = userId === claim.claimantId

      if (!isLandlord && !isTenant) {
        return reply.status(403).send({ error: 'Du har ikke tilladelse til at svare på dette krav' })
      }

      if (isClaimant) {
        return reply.status(400).send({ error: 'Du kan ikke svare på dit eget krav' })
      }

      // Create claim response
      const response = await fastify.prisma.nestClaimResponse.create({
        data: {
          claimId,
          responderId: userId,
          action,
          amount: action === 'COUNTER_OFFER' ? amount : null,
          comment
        }
      })

      // Update claim status based on response
      let newClaimStatus = claim.status
      if (action === 'ACCEPT') {
        newClaimStatus = 'ACCEPTED'
      } else if (action === 'REJECT') {
        newClaimStatus = 'REJECTED'
      } else if (action === 'COUNTER_OFFER') {
        newClaimStatus = 'COUNTER_OFFERED'
      }

      await fastify.prisma.nestClaim.update({
        where: { id: claimId },
        data: {
          status: newClaimStatus,
          respondedAt: new Date(),
          responseAction: action
        }
      })

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: `CLAIM_${action}`,
          performedById: userId,
          performedByRole: isLandlord ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify({ claimId, action, amount, comment }),
          ipAddress: request.ip
        }
      })

      reply.send(response)
    } catch (error) {
      console.error('Error responding to claim:', error)
      reply.status(500).send({ error: 'Failed to respond to claim' })
    }
  })

  // Get claims for an escrow
  fastify.get('/nest/escrows/:id/claims', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }

      // Verify access to escrow
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      const claims = await fastify.prisma.nestClaim.findMany({
        where: { escrowId },
        include: {
          claimant: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          responses: {
            include: {
              responder: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          evidence: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ claims })
    } catch (error) {
      console.error('Error fetching claims:', error)
      reply.status(500).send({ error: 'Failed to fetch claims' })
    }
  })

  // =============== TVISTIGHEDER ===============

  // Opret tvist
  fastify.post('/nest/escrows/:id/dispute', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }
      const { reason, amount } = request.body as { reason: string, amount?: number }

      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      const dispute = await fastify.prisma.nestDispute.create({
        data: {
          escrowId,
          initiatedById: userId,
          reason,
          amount: amount || null,
          status: 'OPEN'
        }
      })

      // Opdater escrow status
      await fastify.prisma.nestEscrow.update({
        where: { id: escrowId },
        data: { status: 'DISPUTED' }
      })

      // Audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId,
          action: 'DISPUTE_INITIATED',
          performedById: userId,
          performedByRole: userId === escrow.landlordId ? 'LANDLORD' : 'TENANT',
          details: JSON.stringify({ reason, amount }),
          ipAddress: request.ip
        }
      })

      reply.send(dispute)
    } catch (error) {
      console.error('Error creating dispute:', error)
      reply.status(500).send({ error: 'Failed to create dispute' })
    }
  })

  // =============== DEADLINE MANAGEMENT ===============

  // Process expired deadlines (can be called by cron job or manually)
  fastify.post('/nest/deadlines/process', async (request, reply) => {
    try {
      // Find all expired deadlines that haven't been triggered yet
      const expiredDeadlines = await fastify.prisma.nestDeadline.findMany({
        where: {
          status: 'ACTIVE',
          deadline: { lte: new Date() },
          triggeredAt: null
        },
        include: {
          escrow: true
        }
      })

      const processedDeadlines = []

      for (const deadline of expiredDeadlines) {
        try {
          if (deadline.autoAction === 'AUTO_RELEASE') {
            const actionData = JSON.parse(deadline.autoActionData || '{}')
            
            // Auto-release deposit if no claims were made
            await fastify.prisma.nestEscrow.update({
              where: { id: deadline.escrowId },
              data: {
                status: 'RELEASED',
                releasedAt: new Date()
              }
            })

            // Create release transaction
            await fastify.prisma.nestTransaction.create({
              data: {
                escrowId: deadline.escrowId,
                type: 'RELEASE',
                amount: actionData.releaseAmount || deadline.escrow.depositAmount,
                initiatedById: deadline.escrow.tenantId, // Release to tenant
                reason: 'Automatisk frigivelse - ingen krav rejst',
                status: 'COMPLETED',
                executedAt: new Date()
              }
            })

            // Audit log
            await fastify.prisma.nestAuditLog.create({
              data: {
                escrowId: deadline.escrowId,
                action: 'AUTO_RELEASED',
                performedById: deadline.escrow.tenantId,
                performedByRole: 'SYSTEM',
                details: JSON.stringify({
                  reason: 'Automatic release - no claims made within deadline',
                  amount: actionData.releaseAmount || deadline.escrow.depositAmount
                }),
                ipAddress: request.ip
              }
            })
          }

          // Mark deadline as triggered
          await fastify.prisma.nestDeadline.update({
            where: { id: deadline.id },
            data: {
              status: 'COMPLETED',
              triggeredAt: new Date()
            }
          })

          processedDeadlines.push({
            id: deadline.id,
            escrowId: deadline.escrowId,
            action: deadline.autoAction,
            status: 'processed'
          })

        } catch (error) {
          console.error(`Error processing deadline ${deadline.id}:`, error)
          processedDeadlines.push({
            id: deadline.id,
            escrowId: deadline.escrowId,
            action: deadline.autoAction,
            status: 'error',
            error: error.message
          })
        }
      }

      reply.send({
        message: `Processed ${processedDeadlines.length} expired deadlines`,
        processed: processedDeadlines
      })
    } catch (error) {
      console.error('Error processing deadlines:', error)
      reply.status(500).send({ error: 'Failed to process deadlines' })
    }
  })

  // Get active deadlines for an escrow
  fastify.get('/nest/escrows/:id/deadlines', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }

      // Verify access to escrow
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      const deadlines = await fastify.prisma.nestDeadline.findMany({
        where: { escrowId },
        orderBy: { deadline: 'asc' }
      })

      reply.send({ deadlines })
    } catch (error) {
      console.error('Error fetching deadlines:', error)
      reply.status(500).send({ error: 'Failed to fetch deadlines' })
    }
  })

  // =============== RAPPORTER ===============

  // Hent audit log for escrow
  fastify.get('/nest/escrows/:id/audit-log', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }

      // Verificer adgang
      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      const auditLogs = await fastify.prisma.nestAuditLog.findMany({
        where: { escrowId },
        include: {
          performedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ auditLogs })
    } catch (error) {
      console.error('Error fetching audit log:', error)
      reply.status(500).send({ error: 'Failed to fetch audit log' })
    }
  })

  // Generer escrow statement
  fastify.get('/nest/escrows/:id/statement', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id: escrowId } = request.params as { id: string }

      const escrow = await fastify.prisma.nestEscrow.findFirst({
        where: {
          id: escrowId,
          OR: [
            { landlordId: userId },
            { tenantId: userId }
          ]
        },
        include: {
          landlord: true,
          tenant: true,
          transactions: {
            where: { status: 'COMPLETED' },
            orderBy: { executedAt: 'asc' }
          }
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Nest escrow not found' })
      }

      // Beregn saldoer
      const deposits = escrow.transactions
        .filter(t => t.type === 'DEPOSIT')
        .reduce((sum, t) => sum + t.amount, 0)

      const releases = escrow.transactions
        .filter(t => ['RELEASE', 'REFUND'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0)

      const deductions = escrow.transactions
        .filter(t => t.type === 'DEDUCTION')
        .reduce((sum, t) => sum + t.amount, 0)

      const currentBalance = deposits - releases - deductions

      const statement = {
        escrow: {
          id: escrow.id,
          status: escrow.status,
          createdAt: escrow.createdAt
        },
        parties: {
          landlord: `${escrow.landlord.firstName} ${escrow.landlord.lastName}`,
          tenant: `${escrow.tenant.firstName} ${escrow.tenant.lastName}`
        },
        amounts: {
          totalDeposited: deposits,
          totalReleased: releases,
          totalDeductions: deductions,
          currentBalance
        },
        transactions: escrow.transactions,
        generatedAt: new Date()
      }

      reply.send(statement)
    } catch (error) {
      console.error('Error generating statement:', error)
      reply.status(500).send({ error: 'Failed to generate statement' })
    }
  })
}

export default nestEscrowRoutes