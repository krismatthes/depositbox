import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'

const tenantInvitationRoutes: FastifyPluginAsync = async (fastify) => {
  // Create new tenant invitation with token
  fastify.post('/create', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const {
        invitationType = 'TENANT',
        tenantEmail,
        tenantName,
        propertyAddress,
        message,
        nestEscrowId,
        contractId,
        depositAmount = 0,
        rentAmount = 0,
        prepaidAmount = 0,
        utilitiesAmount = 0,
        invitationData
      } = request.body as any

      // Validate required fields
      if (!tenantEmail || !propertyAddress) {
        return reply.status(400).send({ error: 'Manglende påkrævede felter: tenantEmail og propertyAddress' })
      }

      const totalAmount = depositAmount + rentAmount + prepaidAmount + utilitiesAmount

      // Create invitation in database
      const invitation = await fastify.prisma.tenantInvitation.create({
        data: {
          landlordId: userId,
          tenantEmail,
          tenantName: tenantName || '',
          propertyAddress,
          message,
          nestEscrowId,
          contractId,
          invitationType,
          invitationData: invitationData ? JSON.stringify(invitationData) : null,
          depositAmount,
          rentAmount,
          prepaidAmount,
          utilitiesAmount,
          totalAmount,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'PENDING'
        },
        include: {
          landlord: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3004'}/nest/invite/${invitation.token}`

      reply.status(201).send({
        invitation,
        invitationLink
      })
    } catch (error) {
      console.error('Error creating invitation:', error)
      reply.status(500).send({ error: 'Fejl ved oprettelse af invitation' })
    }
  })

  // Get invitation by token (public endpoint - no auth required)
  fastify.get('/token/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string }

      const invitation = await fastify.prisma.tenantInvitation.findUnique({
        where: { token },
        include: {
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          nestEscrow: true
        }
      })

      if (!invitation) {
        return reply.status(404).send({ error: 'Invitation ikke fundet' })
      }

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        return reply.status(410).send({ error: 'Invitation er udløbet' })
      }

      // Update viewed status if not already viewed
      if (!invitation.viewedAt) {
        await fastify.prisma.tenantInvitation.update({
          where: { token },
          data: { 
            viewedAt: new Date(),
            status: invitation.status === 'PENDING' ? 'VIEWED' : invitation.status
          }
        })
        invitation.viewedAt = new Date()
      }

      reply.send(invitation)
    } catch (error) {
      console.error('Error fetching invitation:', error)
      reply.status(500).send({ error: 'Fejl ved hentning af invitation' })
    }
  })

  // Accept invitation by token
  fastify.post('/token/:token/accept', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { token } = request.params as { token: string }

      const invitation = await fastify.prisma.tenantInvitation.findUnique({
        where: { token },
        include: {
          landlord: true,
          nestEscrow: true
        }
      })

      if (!invitation) {
        return reply.status(404).send({ error: 'Invitation ikke fundet' })
      }

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        return reply.status(410).send({ error: 'Invitation er udløbet' })
      }

      // Check if already accepted
      if (invitation.status === 'ACCEPTED') {
        return reply.status(400).send({ error: 'Invitation er allerede accepteret' })
      }

      // Update invitation status
      const updatedInvitation = await fastify.prisma.tenantInvitation.update({
        where: { token },
        data: {
          status: 'ACCEPTED',
          tenantId: userId,
          acceptedAt: new Date(),
          respondedAt: new Date()
        }
      })

      // If this is a NEST escrow invitation, update the escrow with tenant info
      if (invitation.nestEscrowId) {
        await fastify.prisma.nestEscrow.update({
          where: { id: invitation.nestEscrowId },
          data: {
            tenantId: userId,
            status: 'AGREED'
          }
        })

        // Create audit log
        await fastify.prisma.nestAuditLog.create({
          data: {
            escrowId: invitation.nestEscrowId,
            action: 'INVITATION_ACCEPTED',
            performedById: userId,
            performedByRole: 'TENANT',
            details: JSON.stringify({ 
              invitationId: invitation.id,
              acceptedAmount: invitation.totalAmount
            }),
            ipAddress: request.ip
          }
        })
      }

      reply.send({ 
        message: 'Invitation accepteret med succes',
        invitation: updatedInvitation
      })
    } catch (error) {
      console.error('Error accepting invitation:', error)
      reply.status(500).send({ error: 'Fejl ved accept af invitation' })
    }
  })

  // Get tenant invitations for current user
  fastify.get('/', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      const invitations = await fastify.prisma.tenantInvitation.findMany({
        where: {
          OR: [
            { tenantId: userId },
            { tenantEmail: user.email }
          ],
          status: 'PENDING'
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          nestEscrow: {
            select: { id: true, status: true, propertyType: true, address: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send(invitations)
    } catch (error) {
      console.error('Error fetching tenant invitations:', error)
      reply.status(500).send({ error: 'Failed to fetch invitations' })
    }
  })

  // Accept tenant invitation
  fastify.post('/:id/accept', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).id

      const invitation = await fastify.prisma.tenantInvitation.findUnique({
        where: { id },
        include: { nestEscrow: true, landlord: true }
      })

      if (!invitation) {
        return reply.status(404).send({ error: 'Invitation not found' })
      }

      if (invitation.status !== 'PENDING') {
        return reply.status(400).send({ error: 'Invitation already processed' })
      }

      if (new Date() > invitation.expiresAt) {
        return reply.status(400).send({ error: 'Invitation has expired' })
      }

      // Update invitation
      const updatedInvitation = await fastify.prisma.tenantInvitation.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          respondedAt: new Date(),
          tenantId: userId
        }
      })

      // Update escrow status to FUNDED (ready for payment)
      const updatedEscrow = await fastify.prisma.nestEscrow.update({
        where: { id: invitation.nestEscrowId },
        data: { 
          status: 'FUNDED',
          fundedAt: new Date()
        }
      })

      // Create audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId: invitation.nestEscrowId,
          action: 'INVITATION_ACCEPTED',
          performedById: userId,
          performedByRole: 'TENANT',
          details: JSON.stringify({ 
            invitationId: invitation.id,
            acceptedAmount: invitation.totalAmount
          }),
          ipAddress: request.ip
        }
      })

      reply.send({ 
        message: 'Invitation accepted successfully',
        invitation: updatedInvitation, 
        escrow: updatedEscrow 
      })
    } catch (error) {
      console.error('Error accepting invitation:', error)
      reply.status(500).send({ error: 'Failed to accept invitation' })
    }
  })

  // Reject tenant invitation
  fastify.post('/:id/reject', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).id

      const invitation = await fastify.prisma.tenantInvitation.findUnique({
        where: { id }
      })

      if (!invitation) {
        return reply.status(404).send({ error: 'Invitation not found' })
      }

      if (invitation.status !== 'PENDING') {
        return reply.status(400).send({ error: 'Invitation already processed' })
      }

      // Update invitation
      const updatedInvitation = await fastify.prisma.tenantInvitation.update({
        where: { id },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
          tenantId: userId
        }
      })

      // Update escrow status to CANCELLED
      await fastify.prisma.nestEscrow.update({
        where: { id: invitation.nestEscrowId },
        data: { 
          status: 'CLOSED',
          closedAt: new Date()
        }
      })

      // Create audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId: invitation.nestEscrowId,
          action: 'INVITATION_REJECTED',
          performedById: userId,
          performedByRole: 'TENANT',
          details: JSON.stringify({ 
            invitationId: invitation.id
          }),
          ipAddress: request.ip
        }
      })

      reply.send({ 
        message: 'Invitation rejected',
        invitation: updatedInvitation 
      })
    } catch (error) {
      console.error('Error rejecting invitation:', error)
      reply.status(500).send({ error: 'Failed to reject invitation' })
    }
  })
}

export default tenantInvitationRoutes