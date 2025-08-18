import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../middleware/auth'
import { PayproffService } from '../services/payproff'
// enum EscrowStatus replaced with string type for SQLite compatibility
type EscrowStatus = 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED'
const EscrowStatus = {
  CREATED: 'CREATED' as const,
  FUNDED: 'FUNDED' as const,
  RELEASED: 'RELEASED' as const,
  CANCELLED: 'CANCELLED' as const
}

const createEscrowSchema = z.object({
  amount: z.number().positive(),
  propertyId: z.string().min(1),
  tenantEmail: z.string().email()
})

const escrowRoutes: FastifyPluginAsync = async function (fastify) {
  const payproffService = new PayproffService()

  fastify.addHook('preHandler', authenticateUser)

  fastify.post('/', async (request, reply) => {
    try {
      const body = createEscrowSchema.parse(request.body)
      const landlordId = (request.user as any).userId

      // Landlord creates the escrow request (they are the "seller" who will receive the deposit)
      const landlord = await fastify.prisma.user.findUnique({
        where: { id: landlordId }
      })

      if (!landlord || landlord.role !== 'LANDLORD') {
        return reply.status(403).send({ error: 'Only landlords can create deposit requests' })
      }

      // Get the property to make sure landlord owns it
      const property = await fastify.prisma.property.findFirst({
        where: { 
          id: body.propertyId,
          landlordId: landlordId 
        }
      })

      if (!property) {
        return reply.status(404).send({ error: 'Property not found or not owned by you' })
      }

      // Find the tenant who will pay the deposit
      const tenant = await fastify.prisma.user.findUnique({
        where: { email: body.tenantEmail }
      })

      if (!tenant) {
        return reply.status(404).send({ error: 'Tenant not found' })
      }

      const escrow = await fastify.prisma.escrow.create({
        data: {
          amount: body.amount,
          propertyId: property.id,
          propertyAddress: property.address,
          buyerId: tenant.id,  // Tenant pays the deposit
          sellerId: landlord.id,  // Landlord receives the deposit
          status: EscrowStatus.CREATED
        },
        include: {
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          seller: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          property: {
            select: { address: true }
          }
        }
      })

      const payproffResponse = await payproffService.createEscrow({
        amount: Number(escrow.amount),
        currency: escrow.currency,
        buyerEmail: tenant.email,  // Tenant pays
        sellerEmail: landlord.email,  // Landlord receives
        description: `Deposit for ${property.address}`,
        reference: escrow.id
      })

      const updatedEscrow = await fastify.prisma.escrow.update({
        where: { id: escrow.id },
        data: {
          payproffTransactionId: payproffResponse.transactionId,
          payproffHostedUrl: payproffResponse.hostedUrl
        },
        include: {
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          seller: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          property: {
            select: { address: true }
          }
        }
      })

      return reply.send(updatedEscrow)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors })
      }
      fastify.log.error('Create escrow error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.get('/', async (request, reply) => {
    try {
      const userId = (request.user as any).userId

      const escrows = await fastify.prisma.escrow.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        include: {
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          seller: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          property: {
            select: { address: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return reply.send(escrows)
    } catch (error) {
      fastify.log.error('Get escrows error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).userId

      const escrow = await fastify.prisma.escrow.findFirst({
        where: {
          id,
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        include: {
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          seller: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          property: {
            select: { address: true }
          }
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Escrow not found' })
      }

      return reply.send(escrow)
    } catch (error) {
      fastify.log.error('Get escrow error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.post('/:id/release', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).userId

      const escrow = await fastify.prisma.escrow.findFirst({
        where: {
          id,
          sellerId: userId,
          status: EscrowStatus.FUNDED
        }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Escrow not found or not eligible for release' })
      }

      if (!escrow.payproffTransactionId) {
        return reply.status(400).send({ error: 'No PayProff transaction found' })
      }

      await payproffService.releaseEscrow(escrow.payproffTransactionId)

      const updatedEscrow = await fastify.prisma.escrow.update({
        where: { id: escrow.id },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date()
        },
        include: {
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          seller: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          property: {
            select: { address: true }
          }
        }
      })

      return reply.send(updatedEscrow)
    } catch (error) {
      fastify.log.error('Release escrow error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default escrowRoutes