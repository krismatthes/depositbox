import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticateUser } from '../middleware/auth'
import crypto from 'crypto'

// Import email service
let sendEmailVerification: any = null
let sendPasswordResetEmail: any = null

// Dynamic imports for email service
async function getEmailService() {
  if (!sendEmailVerification) {
    try {
      const emailModule = await import('../../../web/src/lib/email.js')
      sendEmailVerification = emailModule.sendEmailVerification
      sendPasswordResetEmail = emailModule.sendPasswordResetEmail
    } catch (error) {
      console.warn('Email service not available:', error.message)
    }
  }
}

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

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8, 'Adgangskode skal være mindst 8 tegn')
    .regex(/[A-Z]/, 'Adgangskode skal indeholde mindst ét stort bogstav')
    .regex(/[a-z]/, 'Adgangskode skal indeholde mindst ét lille bogstav')
    .regex(/\d/, 'Adgangskode skal indeholde mindst ét tal'),
})

const verifyEmailSchema = z.object({
  token: z.string().min(1)
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
      
      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex')
      const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      const user = await fastify.prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          role: body.role || 'USER',
          emailVerificationToken,
          emailVerificationExpiry,
          emailVerified: false
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          emailVerified: true,
          createdAt: true
        }
      })
      
      // Try to send verification email
      await getEmailService()
      if (sendEmailVerification) {
        try {
          await sendEmailVerification(body.email, body.firstName, emailVerificationToken)
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError)
          // Continue with registration even if email fails
        }
      }
      
      const token = fastify.jwt.sign({ userId: user.id })
      
      return reply.send({ 
        user, 
        token,
        message: 'Konto oprettet! Check din email for at bekræfte din adresse.'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors })
      }
      console.error('Registration error:', error)
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

  // Email verification
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const body = verifyEmailSchema.parse(request.body)
      
      const user = await fastify.prisma.user.findFirst({
        where: {
          emailVerificationToken: body.token,
          emailVerificationExpiry: {
            gte: new Date()
          }
        }
      })
      
      if (!user) {
        return reply.status(400).send({ error: 'Ugyldigt eller udløbet verifikationstoken' })
      }
      
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null
        }
      })
      
      return reply.send({ message: 'Email bekræftet!' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors })
      }
      console.error('Email verification error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Resend email verification
  fastify.post('/resend-verification', { preHandler: authenticateUser }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }
      
      if (user.emailVerified) {
        return reply.status(400).send({ error: 'Email allerede bekræftet' })
      }
      
      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex')
      const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          emailVerificationToken,
          emailVerificationExpiry
        }
      })
      
      // Send verification email
      await getEmailService()
      if (sendEmailVerification) {
        try {
          await sendEmailVerification(user.email, user.firstName, emailVerificationToken)
          return reply.send({ message: 'Verifikationsemail sendt!' })
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError)
          return reply.status(500).send({ error: 'Failed to send verification email' })
        }
      } else {
        return reply.status(500).send({ error: 'Email service not available' })
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Forgot password
  fastify.post('/forgot-password', async (request, reply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body)
      
      const user = await fastify.prisma.user.findUnique({
        where: { email: body.email }
      })
      
      if (!user) {
        // Don't reveal if user exists or not
        return reply.send({ message: 'Hvis emailadressen eksisterer, vil du modtage en email med instruktioner.' })
      }
      
      // Generate password reset token
      const passwordResetToken = crypto.randomBytes(32).toString('hex')
      const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken,
          passwordResetExpiry
        }
      })
      
      // Send password reset email
      await getEmailService()
      if (sendPasswordResetEmail) {
        try {
          await sendPasswordResetEmail(user.email, user.firstName, passwordResetToken)
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError)
          // Don't fail the request if email fails
        }
      }
      
      return reply.send({ message: 'Hvis emailadressen eksisterer, vil du modtage en email med instruktioner.' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors })
      }
      console.error('Forgot password error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Reset password
  fastify.post('/reset-password', async (request, reply) => {
    try {
      const body = resetPasswordSchema.parse(request.body)
      
      const user = await fastify.prisma.user.findFirst({
        where: {
          passwordResetToken: body.token,
          passwordResetExpiry: {
            gte: new Date()
          }
        }
      })
      
      if (!user) {
        return reply.status(400).send({ error: 'Ugyldigt eller udløbet nulstillingstoken' })
      }
      
      const hashedPassword = await bcrypt.hash(body.password, 10)
      
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null
        }
      })
      
      return reply.send({ message: 'Adgangskode nulstillet!' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors })
      }
      console.error('Reset password error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default authRoutes