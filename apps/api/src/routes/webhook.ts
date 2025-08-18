import { FastifyPluginAsync } from 'fastify'
import { PayproffService } from '../services/payproff'
// enum EscrowStatus replaced with string type for SQLite compatibility
type EscrowStatus = 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED'
const EscrowStatus = {
  CREATED: 'CREATED' as const,
  FUNDED: 'FUNDED' as const,
  RELEASED: 'RELEASED' as const,
  CANCELLED: 'CANCELLED' as const
}

interface PayproffWebhookPayload {
  transactionId: string
  status: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED'
  amount: number
  currency: string
  timestamp: string
}

const webhookRoutes: FastifyPluginAsync = async function (fastify) {
  const payproffService = new PayproffService()

  fastify.post('/payproff', async (request, reply) => {
    try {
      const signature = request.headers['x-payproff-signature'] as string
      const payload = JSON.stringify(request.body)

      if (!payproffService.verifyWebhookSignature(payload, signature || '')) {
        return reply.status(401).send({ error: 'Invalid webhook signature' })
      }

      const webhookData = request.body as PayproffWebhookPayload

      const escrow = await fastify.prisma.escrow.findFirst({
        where: { payproffTransactionId: webhookData.transactionId }
      })

      if (!escrow) {
        return reply.status(404).send({ error: 'Escrow not found' })
      }

      let status: string
      let updatedFields: any = {
        status: webhookData.status,
        updatedAt: new Date()
      }

      switch (webhookData.status) {
        case 'FUNDED':
          status = 'FUNDED'
          updatedFields.fundedAt = new Date()
          break
        case 'RELEASED':
          status = 'RELEASED'
          updatedFields.releasedAt = new Date()
          break
        case 'CANCELLED':
          status = 'CANCELLED'
          break
        default:
          status = 'CREATED'
      }

      updatedFields.status = status

      await fastify.prisma.escrow.update({
        where: { id: escrow.id },
        data: updatedFields
      })

      fastify.log.info(`Escrow ${escrow.id} status updated to ${status}`)

      return reply.send({ success: true })
    } catch (error) {
      fastify.log.error('Webhook processing error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default webhookRoutes