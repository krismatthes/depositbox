import { FastifyInstance } from 'fastify'
import { authenticateAdmin } from '../middleware/admin-auth'

export default async function faqRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  // Public routes - get published FAQs
  fastify.get('/api/faq', async (request, reply) => {
    try {
      const faqs = await prisma.fAQ.findMany({
        where: { published: true },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          question: true,
          answer: true,
          category: true,
          order: true
        }
      })

      return reply.send(faqs)
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      return reply.status(500).send({ error: 'Failed to fetch FAQs' })
    }
  })

  // Admin routes - full CRUD
  fastify.get('/api/admin/faq', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const faqs = await prisma.fAQ.findMany({
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ]
      })

      return reply.send(faqs)
    } catch (error) {
      console.error('Error fetching admin FAQs:', error)
      return reply.status(500).send({ error: 'Failed to fetch FAQs' })
    }
  })

  fastify.post('/api/admin/faq', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const { question, answer, category, order, published } = request.body as any

      if (!question || !answer) {
        return reply.status(400).send({ error: 'Question and answer are required' })
      }

      const faq = await prisma.fAQ.create({
        data: {
          question,
          answer,
          category: category || null,
          order: order || 0,
          published: published !== undefined ? published : true
        }
      })

      return reply.status(201).send(faq)
    } catch (error) {
      console.error('Error creating FAQ:', error)
      return reply.status(500).send({ error: 'Failed to create FAQ' })
    }
  })

  fastify.put('/api/admin/faq/:id', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { question, answer, category, order, published } = request.body as any

      if (!question || !answer) {
        return reply.status(400).send({ error: 'Question and answer are required' })
      }

      const faq = await prisma.fAQ.update({
        where: { id },
        data: {
          question,
          answer,
          category: category || null,
          order: order || 0,
          published: published !== undefined ? published : true
        }
      })

      return reply.send(faq)
    } catch (error) {
      console.error('Error updating FAQ:', error)
      return reply.status(500).send({ error: 'Failed to update FAQ' })
    }
  })

  fastify.delete('/api/admin/faq/:id', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await prisma.fAQ.delete({
        where: { id }
      })

      return reply.status(204).send()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      return reply.status(500).send({ error: 'Failed to delete FAQ' })
    }
  })

  // Reorder FAQs
  fastify.put('/api/admin/faq/reorder', {
    preHandler: [authenticateAdmin]
  }, async (request, reply) => {
    try {
      const { faqIds } = request.body as { faqIds: string[] }

      if (!Array.isArray(faqIds)) {
        return reply.status(400).send({ error: 'faqIds must be an array' })
      }

      // Update order for each FAQ
      const updates = faqIds.map((id, index) => 
        prisma.fAQ.update({
          where: { id },
          data: { order: index }
        })
      )

      await Promise.all(updates)

      return reply.send({ success: true })
    } catch (error) {
      console.error('Error reordering FAQs:', error)
      return reply.status(500).send({ error: 'Failed to reorder FAQs' })
    }
  })
}