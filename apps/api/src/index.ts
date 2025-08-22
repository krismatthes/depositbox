import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import escrowRoutes from './routes/escrow'
import webhookRoutes from './routes/webhook'
import propertiesRoutes from './routes/properties'
import invitationsRoutes from './routes/invitations'
import leaseContractRoutes from './routes/lease-contract'
import draftContractsRoutes from './routes/draft-contracts'
import savedContractsRoutes from './routes/saved-contracts'
import nestEscrowRoutes from './routes/nest-escrow'
import tenantProfileRoutes from './routes/tenant-profile'
import tenantInvitationRoutes from './routes/tenant-invitations'
import mitIdAuthRoutes from './routes/mitid-auth'
import adminRoutes from './routes/admin'
import faqRoutes from './routes/faq'
import twoFactorRoutes from './routes/two-factor'

const prisma = new PrismaClient()
const fastify = Fastify({ logger: true })

async function buildApp() {
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
  })

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret'
  })

  fastify.decorate('prisma', prisma)

  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(escrowRoutes, { prefix: '/api/escrow' })
  await fastify.register(webhookRoutes, { prefix: '/api/webhook' })
  await fastify.register(propertiesRoutes, { prefix: '/api' })
  await fastify.register(invitationsRoutes, { prefix: '/api' })
  await fastify.register(leaseContractRoutes, { prefix: '/api' })
  await fastify.register(draftContractsRoutes, { prefix: '/api' })
  await fastify.register(savedContractsRoutes, { prefix: '/api' })
  await fastify.register(nestEscrowRoutes, { prefix: '/api' })
  await fastify.register(tenantProfileRoutes, { prefix: '/api' })
  await fastify.register(tenantInvitationRoutes, { prefix: '/api/tenant/invitations' })
  await fastify.register(mitIdAuthRoutes, { prefix: '/api' })
  await fastify.register(adminRoutes, { prefix: '/api' })
  await fastify.register(faqRoutes)
  await fastify.register(twoFactorRoutes, { prefix: '/api' })

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  return fastify
}

async function start() {
  try {
    const app = await buildApp()
    const port = Number(process.env.PORT) || 3001
    
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server ready at http://localhost:${port}`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  start()
}

export { buildApp }