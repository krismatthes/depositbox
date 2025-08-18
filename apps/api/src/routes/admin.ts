import { FastifyPluginAsync } from 'fastify'
import { authenticateAdmin } from '../middleware/admin-auth'
import { z } from 'zod'

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Dashboard metrics endpoint
  fastify.get('/admin/dashboard/metrics', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      // Get comprehensive metrics for admin dashboard
      const [
        totalUsers,
        totalTenants,
        totalLandlords,
        totalNests,
        totalEscrows,
        activeEscrows,
        totalValue,
        recentUsers,
        recentNests,
        verificationStats,
        escrowStatusStats
      ] = await Promise.all([
        // User counts
        fastify.prisma.user.count(),
        fastify.prisma.user.count({ where: { role: 'TENANT' } }),
        fastify.prisma.user.count({ where: { role: 'LANDLORD' } }),
        
        // Nest and Escrow counts
        fastify.prisma.nestEscrow.count(),
        fastify.prisma.escrow.count(),
        fastify.prisma.escrow.count({ where: { status: 'ACTIVE' } }),
        
        // Total escrow value (sum of all escrow amounts)
        fastify.prisma.escrow.aggregate({
          _sum: { totalAmount: true }
        }),
        
        // Recent activity
        fastify.prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true
          }
        }),
        
        fastify.prisma.nestEscrow.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            address: true,
            deposit: true,
            status: true,
            createdAt: true,
            tenant: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            landlord: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        
        // Verification statistics
        fastify.prisma.user.groupBy({
          by: ['mitIdVerified', 'identityVerified', 'emailVerified'],
          _count: true
        }),
        
        // Escrow status distribution
        fastify.prisma.escrow.groupBy({
          by: ['status'],
          _count: true
        })
      ])

      const metrics = {
        users: {
          total: totalUsers,
          tenants: totalTenants,
          landlords: totalLandlords,
          admins: totalUsers - totalTenants - totalLandlords
        },
        nests: {
          total: totalNests
        },
        escrows: {
          total: totalEscrows,
          active: activeEscrows,
          totalValue: totalValue._sum.totalAmount || 0
        },
        recentActivity: {
          users: recentUsers,
          nests: recentNests
        },
        verification: verificationStats.reduce((acc, stat) => {
          const key = `mitId_${stat.mitIdVerified}_identity_${stat.identityVerified}_email_${stat.emailVerified}`
          acc[key] = stat._count
          return acc
        }, {} as Record<string, number>),
        escrowStatus: escrowStatusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count
          return acc
        }, {} as Record<string, number>)
      }

      reply.send(metrics)
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch admin dashboard metrics')
      reply.status(500).send({ error: 'Failed to fetch dashboard metrics' })
    }
  })

  // User management endpoints
  fastify.get('/admin/users', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const query = request.query as {
        page?: string
        limit?: string
        role?: 'TENANT' | 'LANDLORD' | 'ADMIN'
        search?: string
        verified?: string
      }

      const page = parseInt(query.page || '1')
      const limit = parseInt(query.limit || '25')
      const offset = (page - 1) * limit

      const where: any = {}
      
      if (query.role) {
        where.role = query.role
      }

      if (query.search) {
        where.OR = [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { email: { contains: query.search } }
        ]
      }

      if (query.verified !== undefined) {
        where.identityVerified = query.verified === 'true'
      }

      const [users, totalCount] = await Promise.all([
        fastify.prisma.user.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            identityVerified: true,
            mitIdVerified: true,
            createdAt: true,
            lastLoginAt: true,
            // Extended tenant fields
            cprNumber: true,
            monthlyIncome: true,
            employer: true,
            employmentType: true,
            profileCompleteness: true,
            // Relationship counts
            _count: {
              select: {
                createdNests: true,
                assignedNests: true,
                escrows: true
              }
            }
          }
        }),
        fastify.prisma.user.count({ where })
      ])

      reply.send({
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      })
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch users')
      reply.status(500).send({ error: 'Failed to fetch users' })
    }
  })

  // Get specific user details
  fastify.get('/admin/users/:id', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const user = await fastify.prisma.user.findUnique({
        where: { id },
        include: {
          createdNests: {
            select: {
              id: true,
              address: true,
              deposit: true,
              status: true,
              createdAt: true
            }
          },
          assignedNests: {
            select: {
              id: true,
              address: true,
              deposit: true,
              status: true,
              createdAt: true
            }
          },
          escrows: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true
            }
          },
          documents: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              createdAt: true
            }
          }
        }
      })

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      reply.send({ user })
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch user details')
      reply.status(500).send({ error: 'Failed to fetch user details' })
    }
  })

  // Update user (admin actions)
  const updateUserSchema = z.object({
    emailVerified: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
    identityVerified: z.boolean().optional(),
    role: z.enum(['TENANT', 'LANDLORD', 'ADMIN']).optional(),
    notes: z.string().optional()
  })

  fastify.put('/admin/users/:id', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const updates = updateUserSchema.parse(request.body)

      const user = await fastify.prisma.user.update({
        where: { id },
        data: updates,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          mitIdVerified: true
        }
      })

      // Log admin action
      fastify.log.info({
        adminId: request.user?.id,
        userId: id,
        action: 'user_updated',
        updates
      }, 'Admin updated user')

      reply.send({ user })
    } catch (error) {
      fastify.log.error(error, 'Failed to update user')
      reply.status(500).send({ error: 'Failed to update user' })
    }
  })

  // Delete/suspend user
  fastify.delete('/admin/users/:id', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const query = request.query as { action?: 'suspend' | 'delete' }

      if (query.action === 'suspend') {
        // Soft delete - just mark as suspended
        await fastify.prisma.user.update({
          where: { id },
          data: { 
            // Add suspended field to schema if needed
            // suspended: true,
            // suspendedAt: new Date()
          }
        })
      } else {
        // Hard delete - remove user completely (careful!)
        await fastify.prisma.user.delete({
          where: { id }
        })
      }

      // Log admin action
      fastify.log.info({
        adminId: request.user?.id,
        userId: id,
        action: query.action || 'delete'
      }, `Admin ${query.action || 'deleted'} user`)

      reply.send({ success: true })
    } catch (error) {
      fastify.log.error(error, 'Failed to delete/suspend user')
      reply.status(500).send({ error: 'Failed to delete/suspend user' })
    }
  })

  // Nest administration endpoints
  fastify.get('/admin/nests', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const query = request.query as {
        page?: string
        limit?: string
        status?: string
        search?: string
      }

      const page = parseInt(query.page || '1')
      const limit = parseInt(query.limit || '25')
      const offset = (page - 1) * limit

      const where: any = {}
      
      if (query.status) {
        where.status = query.status
      }

      if (query.search) {
        where.OR = [
          { address: { contains: query.search } },
          { tenant: { 
            OR: [
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { email: { contains: query.search } }
            ]
          }},
          { landlord: {
            OR: [
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { email: { contains: query.search } }
            ]
          }}
        ]
      }

      const [nests, totalCount] = await Promise.all([
        fastify.prisma.nestEscrow.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            landlord: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            escrow: {
              select: {
                id: true,
                status: true,
                totalAmount: true
              }
            }
          }
        }),
        fastify.prisma.nestEscrow.count({ where })
      ])

      reply.send({
        nests,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      })
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch nests')
      reply.status(500).send({ error: 'Failed to fetch nests' })
    }
  })

  // System logs and audit trail
  fastify.get('/admin/logs', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      // This would integrate with your logging system
      // For now, return a placeholder response
      reply.send({
        logs: [
          {
            id: '1',
            timestamp: new Date(),
            level: 'info',
            action: 'user_login',
            userId: 'user123',
            details: { email: 'user@example.com' }
          }
        ]
      })
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch logs')
      reply.status(500).send({ error: 'Failed to fetch logs' })
    }
  })
}

export default adminRoutes