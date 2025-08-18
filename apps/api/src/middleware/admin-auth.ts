import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    // First verify the user is authenticated
    const payload = await request.jwtVerify() as any
    if (!payload.userId) {
      return reply.status(401).send({ error: 'Invalid token payload' })
    }

    // Fetch user from database to verify admin role
    const user = await request.server.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    })

    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' })
    }

    // Attach user to request
    request.user = user
  } catch (err) {
    console.error('Admin JWT verification error:', err)
    reply.status(401).send({ error: 'Unauthorized' })
  }
}

export async function authenticateSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    // First run admin authentication
    await authenticateAdmin(request, reply)
    
    // Additional super admin checks can be added here if needed
    // For now, ADMIN role is sufficient for all admin operations
  } catch (err) {
    console.error('Super admin verification error:', err)
    reply.status(401).send({ error: 'Super admin access required' })
  }
}