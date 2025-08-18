import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'

const draftContractsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // Get all draft contracts for user
  fastify.get('/draft-contracts', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const drafts = await fastify.prisma.draftContract.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      })

      reply.send({ contracts: drafts })
    } catch (error) {
      console.error('Error fetching draft contracts:', error)
      reply.status(500).send({ error: 'Failed to fetch draft contracts' })
    }
  })

  // Create new draft contract
  fastify.post('/draft-contracts', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { title, data } = request.body as any

      const draft = await fastify.prisma.draftContract.create({
        data: {
          title,
          data,
          userId
        }
      })

      reply.send(draft)
    } catch (error) {
      console.error('Error creating draft contract:', error)
      reply.status(500).send({ error: 'Failed to create draft contract' })
    }
  })

  // Update existing draft contract
  fastify.put('/draft-contracts/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as any
      const { title, data } = request.body as any

      // Only update fields that are provided
      const updateData: any = {
        updatedAt: new Date()
      }
      
      if (data !== undefined) updateData.data = data
      if (title !== undefined) updateData.title = title

      const draft = await fastify.prisma.draftContract.updateMany({
        where: { 
          id,
          userId // Ensure user can only update their own drafts
        },
        data: updateData
      })

      if (draft.count === 0) {
        return reply.status(404).send({ error: 'Draft contract not found' })
      }

      reply.send({ message: 'Draft updated successfully' })
    } catch (error) {
      console.error('Error updating draft contract:', error)
      reply.status(500).send({ error: 'Failed to update draft contract' })
    }
  })

  // Get single draft contract
  fastify.get('/draft-contracts/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as any

      const draft = await fastify.prisma.draftContract.findFirst({
        where: { 
          id,
          userId
        }
      })

      if (!draft) {
        return reply.status(404).send({ error: 'Draft contract not found' })
      }

      reply.send({ contract: draft })
    } catch (error) {
      console.error('Error fetching draft contract:', error)
      reply.status(500).send({ error: 'Failed to fetch draft contract' })
    }
  })

  // Delete draft contract
  fastify.delete('/draft-contracts/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { id } = request.params as any

      const deleted = await fastify.prisma.draftContract.deleteMany({
        where: { 
          id,
          userId
        }
      })

      if (deleted.count === 0) {
        return reply.status(404).send({ error: 'Draft contract not found' })
      }

      reply.send({ message: 'Draft deleted successfully' })
    } catch (error) {
      console.error('Error deleting draft contract:', error)
      reply.status(500).send({ error: 'Failed to delete draft contract' })
    }
  })
}

export default draftContractsRoutes