import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '../middleware/auth'

const prisma = new PrismaClient()

const propertiesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // Get all properties for a user
  fastify.get('/properties', async (request, reply) => {
    const userId = (request.user as any).id
    
    try {
      const properties = await prisma.property.findMany({
        where: { landlordId: userId },
        include: {
          escrows: {
            include: {
              buyer: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          invitations: {
            where: { status: 'PENDING' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ properties })
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch properties' })
    }
  })

  // Create a new property
  fastify.post('/properties', async (request, reply) => {
    const userId = (request.user as any).id
    const { address, propertyType, size, monthlyRent, depositAmount, prepaidRent, currency, moveInDate } = request.body as any

    if (!userId) {
      return reply.status(401).send({ error: 'User not authenticated' })
    }

    try {
      const property = await prisma.property.create({
        data: {
          address,
          propertyType: propertyType || 'APARTMENT',
          size: size ? parseInt(size) : 50,
          monthlyRent: parseFloat(monthlyRent),
          depositAmount: parseFloat(depositAmount),
          prepaidRent: prepaidRent ? parseFloat(prepaidRent) : 0,
          currency: currency || 'DKK',
          moveInDate: moveInDate ? new Date(moveInDate) : null,
          landlordId: userId,
          status: 'ACTIVE'
        }
      })

      reply.status(201).send({ property })
    } catch (error) {
      console.error('Create property error:', error)
      reply.status(500).send({ error: 'Failed to create property' })
    }
  })

  // Get single property
  fastify.get('/properties/:id', async (request, reply) => {
    const userId = (request.user as any).id
    const { id } = request.params as { id: string }

    try {
      const property = await prisma.property.findFirst({
        where: { 
          id,
          landlordId: userId 
        },
        include: {
          landlord: {
            select: { firstName: true, lastName: true, email: true, phone: true }
          },
          escrows: {
            include: {
              buyer: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          invitations: true
        }
      })

      if (!property) {
        reply.status(404).send({ error: 'Property not found' })
        return
      }

      reply.send({ property })
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch property' })
    }
  })

  // Update property
  fastify.put('/properties/:id', async (request, reply) => {
    const userId = (request.user as any).id
    const { id } = request.params as { id: string }
    const { address, propertyType, size, monthlyRent, depositAmount, prepaidRent, currency, moveInDate, status } = request.body as any

    try {
      const property = await prisma.property.updateMany({
        where: { 
          id,
          landlordId: userId 
        },
        data: {
          address,
          propertyType,
          size: size ? parseInt(size) : undefined,
          monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
          depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
          prepaidRent: prepaidRent ? parseFloat(prepaidRent) : undefined,
          currency,
          moveInDate: moveInDate ? new Date(moveInDate) : undefined,
          status
        }
      })

      if (property.count === 0) {
        reply.status(404).send({ error: 'Property not found' })
        return
      }

      reply.send({ success: true })
    } catch (error) {
      reply.status(500).send({ error: 'Failed to update property' })
    }
  })

  // Delete property
  fastify.delete('/properties/:id', async (request, reply) => {
    const userId = (request.user as any).id
    const { id } = request.params as { id: string }

    try {
      const property = await prisma.property.deleteMany({
        where: { 
          id,
          landlordId: userId 
        }
      })

      if (property.count === 0) {
        reply.status(404).send({ error: 'Property not found' })
        return
      }

      reply.send({ success: true })
    } catch (error) {
      reply.status(500).send({ error: 'Failed to delete property' })
    }
  })
}

export default propertiesRoutes