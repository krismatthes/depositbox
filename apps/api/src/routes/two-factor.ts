import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'
// Note: Run `npm install otpauth qrcode` to install these dependencies
// import { TOTP } from 'otpauth'
// import QRCode from 'qrcode'

interface SetupRequest {
  // Empty for initial setup request
}

interface VerifyRequest {
  token: string
  secret?: string // For setup verification
}

interface DisableRequest {
  token: string
}

const twoFactorRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateUser)

  // Setup 2FA - Generate secret and QR code
  fastify.post('/auth/2fa/setup', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return reply.status(404).send({ error: 'Bruger ikke fundet' })
      }

      if (user.twoFactorEnabled) {
        return reply.status(400).send({ error: '2FA er allerede aktiveret' })
      }

      // TODO: Uncomment when packages are installed
      /*
      // Generate a secret for the user
      const secret = new TOTP({
        issuer: 'Depositums Box',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      })

      const secretKey = secret.secret.base32

      // Generate QR code
      const qrCodeUrl = secret.toString()
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl)

      reply.send({
        secret: secretKey,
        qrCode: qrCodeDataUrl,
        manualEntryKey: secretKey,
        issuer: 'Depositums Box',
        accountName: user.email
      })
      */

      // Temporary response until packages are installed
      reply.send({
        message: 'Install otpauth and qrcode packages to enable 2FA setup',
        secret: 'TEMP_SECRET_PLACEHOLDER',
        qrCode: 'data:image/png;base64,placeholder',
        manualEntryKey: 'TEMP_SECRET_PLACEHOLDER',
        issuer: 'Depositums Box',
        accountName: user.email
      })
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      reply.status(500).send({ error: 'Fejl ved opsætning af 2FA' })
    }
  })

  // Verify and enable 2FA
  fastify.post('/auth/2fa/verify-setup', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { token, secret } = request.body as VerifyRequest

      if (!token || !secret) {
        return reply.status(400).send({ error: 'Token og secret er påkrævet' })
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return reply.status(404).send({ error: 'Bruger ikke fundet' })
      }

      if (user.twoFactorEnabled) {
        return reply.status(400).send({ error: '2FA er allerede aktiveret' })
      }

      // TODO: Uncomment when packages are installed
      /*
      // Verify the token
      const totp = new TOTP({
        issuer: 'Depositums Box',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      })

      const isValid = totp.validate({ token, window: 1 })

      if (!isValid) {
        return reply.status(400).send({ error: 'Ugyldig 2FA kode' })
      }
      */

      // Temporary validation - accept "123456" for testing
      if (token !== '123456') {
        return reply.status(400).send({ error: 'Ugyldig 2FA kode (brug 123456 til test)' })
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      )

      // Enable 2FA for user
      await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          twoFactorBackupCodes: JSON.stringify(backupCodes),
          twoFactorVerifiedAt: new Date()
        }
      })

      reply.send({
        success: true,
        message: '2FA er nu aktiveret',
        backupCodes: backupCodes
      })
    } catch (error) {
      console.error('Error verifying 2FA setup:', error)
      reply.status(500).send({ error: 'Fejl ved verifikation af 2FA' })
    }
  })

  // Verify 2FA token during login
  fastify.post('/auth/2fa/verify', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { token } = request.body as VerifyRequest

      if (!token) {
        return reply.status(400).send({ error: 'Token er påkrævet' })
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return reply.status(400).send({ error: '2FA er ikke aktiveret for denne bruger' })
      }

      // Check if it's a backup code
      if (user.twoFactorBackupCodes) {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes)
        if (backupCodes.includes(token.toUpperCase())) {
          // Remove used backup code
          const updatedCodes = backupCodes.filter((code: string) => code !== token.toUpperCase())
          await fastify.prisma.user.update({
            where: { id: userId },
            data: {
              twoFactorBackupCodes: JSON.stringify(updatedCodes)
            }
          })

          return reply.send({
            success: true,
            message: 'Backup kode accepteret',
            remainingBackupCodes: updatedCodes.length
          })
        }
      }

      // TODO: Uncomment when packages are installed
      /*
      // Verify TOTP token
      const totp = new TOTP({
        issuer: 'Depositums Box',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: user.twoFactorSecret
      })

      const isValid = totp.validate({ token, window: 1 })

      if (!isValid) {
        return reply.status(400).send({ error: 'Ugyldig 2FA kode' })
      }
      */

      // Temporary validation - accept "123456" for testing
      if (token !== '123456') {
        return reply.status(400).send({ error: 'Ugyldig 2FA kode (brug 123456 til test)' })
      }

      reply.send({
        success: true,
        message: '2FA verifikation succesfuld'
      })
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      reply.status(500).send({ error: 'Fejl ved verifikation af 2FA' })
    }
  })

  // Disable 2FA
  fastify.post('/auth/2fa/disable', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { token } = request.body as DisableRequest

      if (!token) {
        return reply.status(400).send({ error: 'Token er påkrævet for at deaktivere 2FA' })
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.twoFactorEnabled) {
        return reply.status(400).send({ error: '2FA er ikke aktiveret' })
      }

      // Verify token before disabling
      // TODO: Add token verification logic here

      // Temporary validation - accept "123456" for testing
      if (token !== '123456') {
        return reply.status(400).send({ error: 'Ugyldig 2FA kode (brug 123456 til test)' })
      }

      // Disable 2FA
      await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          twoFactorVerifiedAt: null
        }
      })

      reply.send({
        success: true,
        message: '2FA er nu deaktiveret'
      })
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      reply.status(500).send({ error: 'Fejl ved deaktivering af 2FA' })
    }
  })

  // Get 2FA status
  fastify.get('/auth/2fa/status', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          twoFactorVerifiedAt: true,
          twoFactorBackupCodes: true
        }
      })

      if (!user) {
        return reply.status(404).send({ error: 'Bruger ikke fundet' })
      }

      const backupCodesCount = user.twoFactorBackupCodes 
        ? JSON.parse(user.twoFactorBackupCodes).length 
        : 0

      reply.send({
        enabled: user.twoFactorEnabled,
        verifiedAt: user.twoFactorVerifiedAt,
        backupCodesRemaining: backupCodesCount
      })
    } catch (error) {
      console.error('Error getting 2FA status:', error)
      reply.status(500).send({ error: 'Fejl ved hentning af 2FA status' })
    }
  })

  // Generate new backup codes
  fastify.post('/auth/2fa/backup-codes', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.twoFactorEnabled) {
        return reply.status(400).send({ error: '2FA skal være aktiveret for at generere backup koder' })
      }

      // Generate new backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      )

      await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorBackupCodes: JSON.stringify(backupCodes)
        }
      })

      reply.send({
        backupCodes: backupCodes,
        message: 'Nye backup koder genereret. Gem disse sikkert!'
      })
    } catch (error) {
      console.error('Error generating backup codes:', error)
      reply.status(500).send({ error: 'Fejl ved generering af backup koder' })
    }
  })
}

export default twoFactorRoutes