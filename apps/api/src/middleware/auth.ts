import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify() as any
    // Extract user ID from JWT payload and attach to request
    if (!payload.userId) {
      return reply.status(401).send({ error: 'Invalid token payload' })
    }
    request.user = { id: payload.userId }
  } catch (err) {
    console.error('JWT verification error:', err)
    reply.status(401).send({ error: 'Unauthorized' })
  }
}