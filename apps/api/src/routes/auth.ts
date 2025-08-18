import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticateUser } from '../middleware/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Adgangskode skal være mindst 8 tegn')
    .regex(/[A-Z]/, 'Adgangskode skal indeholde mindst ét stort bogstav')
    .regex(/[a-z]/, 'Adgangskode skal indeholde mindst ét lille bogstav')
    .regex(/\d/, 'Adgangskode skal indeholde mindst ét tal'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['LANDLORD', 'TENANT']).optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const authRoutes: FastifyPluginAsync = async function (fastify) {
  fastify.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body)
      
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email: body.email }
      })
      
      if (existingUser) {
        return reply.status(400).send({ error: 'User already exists' })
      }
      
      const hashedPassword = await bcrypt.hash(body.password, 10)
      
      const user = await fastify.prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          role: body.role || 'USER'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true
        }
      })
      
      const token = fastify.jwt.sign({ userId: user.id })
      
      return reply.send({ user, token })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors })
      }
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)
      
      const user = await fastify.prisma.user.findUnique({
        where: { email: body.email }
      })
      
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }
      
      const isValidPassword = await bcrypt.compare(body.password, user.password)
      
      if (!isValidPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }
      
      const token = fastify.jwt.sign({ userId: user.id })
      
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
      
      return reply.send({ user: userResponse, token })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors })
      }
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Get user profile (protected route)
  fastify.get('/profile', { preHandler: authenticateUser }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true
        }
      })

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      return reply.send({ user })
    } catch (error) {
      console.error('Profile fetch error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Search users (for Nest escrow tenant selection)
  fastify.get('/search-users', { preHandler: authenticateUser }, async (request, reply) => {
    try {
      const { q } = request.query as { q: string }
      
      if (!q || q.length < 2) {
        return reply.send({ users: [] })
      }

      const users = await fastify.prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        },
        take: 10
      })

      reply.send({ users })
    } catch (error) {
      console.error('Error searching users:', error)
      reply.status(500).send({ error: 'Failed to search users' })
    }
  })
}

export default authRoutes