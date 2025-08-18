import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'

const savedContractsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // Get all saved contracts for user
  fastify.get('/saved-contracts', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const contracts = await fastify.prisma.savedContract.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ contracts })
    } catch (error) {
      console.error('Error fetching saved contracts:', error)
      reply.status(500).send({ error: 'Failed to fetch saved contracts' })
    }
  })

  // Create new saved contract
  fastify.post('/saved-contracts', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { title, data, propertyAddress, tenantNames, monthlyRent, moveInDate } = request.body as any

      const contract = await fastify.prisma.savedContract.create({
        data: {
          title,
          data,
          propertyAddress,
          tenantNames,
          monthlyRent: parseFloat(monthlyRent) || 0,
          moveInDate: moveInDate ? new Date(moveInDate) : null,
          userId
        }
      })

      reply.send(contract)
    } catch (error) {
      console.error('Error creating saved contract:', error)
      reply.status(500).send({ error: 'Failed to save contract' })
    }
  })

  // Get single saved contract
  fastify.get('/saved-contracts/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as any

      const contract = await fastify.prisma.savedContract.findFirst({
        where: { 
          id,
          userId
        }
      })

      if (!contract) {
        return reply.status(404).send({ error: 'Saved contract not found' })
      }

      reply.send(contract)
    } catch (error) {
      console.error('Error fetching saved contract:', error)
      reply.status(500).send({ error: 'Failed to fetch saved contract' })
    }
  })

  // Delete saved contract
  fastify.delete('/saved-contracts/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as any

      const deleted = await fastify.prisma.savedContract.deleteMany({
        where: { 
          id,
          userId
        }
      })

      if (deleted.count === 0) {
        return reply.status(404).send({ error: 'Saved contract not found' })
      }

      reply.send({ message: 'Contract deleted successfully' })
    } catch (error) {
      console.error('Error deleting saved contract:', error)
      reply.status(500).send({ error: 'Failed to delete saved contract' })
    }
  })
}

export default savedContractsRoutes