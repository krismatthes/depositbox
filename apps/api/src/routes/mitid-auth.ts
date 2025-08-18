import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'

const mitIdAuthRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Verify MitID authentication and update user profile
  fastify.post('/auth/mitid/verify', {
    preHandler: [authenticateUser]
  }, async (request, reply) => {
    try {
      const { userInfo, accessToken, idToken } = request.body as {
        userInfo: {
          cprNumber: string
          fullName: string
          firstName: string
          lastName: string
          dateOfBirth: string
          verified: boolean
        }
        accessToken: string
        idToken: string
      }

      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' })
      }

      // Update user with MitID verification data
      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          cprNumber: userInfo.cprNumber,
          identityVerified: true,
          mitIdVerified: true,
          mitIdData: JSON.stringify({
            fullName: userInfo.fullName,
            dateOfBirth: userInfo.dateOfBirth,
            verifiedAt: new Date().toISOString(),
            accessToken: accessToken, // In production, store securely or don't store at all
            idToken: idToken
          }),
          // Update name fields if they were empty
          firstName: request.user.firstName || userInfo.firstName,
          lastName: request.user.lastName || userInfo.lastName
        }
      })

      // Log verification event
      fastify.log.info({
        userId,
        cprNumber: userInfo.cprNumber,
        action: 'mitid_verification_completed'
      }, 'User completed MitID verification')

      reply.send({
        success: true,
        message: 'MitID verification completed successfully',
        user: {
          id: updatedUser.id,
          identityVerified: updatedUser.identityVerified,
          mitIdVerified: updatedUser.mitIdVerified,
          cprNumber: updatedUser.cprNumber
        }
      })

    } catch (error) {
      fastify.log.error(error, 'MitID verification failed')
      reply.status(500).send({
        error: 'Failed to process MitID verification',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Get MitID verification status for current user
  fastify.get('/auth/mitid/status', {
    preHandler: [authenticateUser]
  }, async (request, reply) => {
    try {
      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' })
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          identityVerified: true,
          mitIdVerified: true,
          cprNumber: true,
          mitIdData: true
        }
      })

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      let mitIdInfo = null
      if (user.mitIdData) {
        try {
          const data = JSON.parse(user.mitIdData)
          mitIdInfo = {
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            verifiedAt: data.verifiedAt
          }
        } catch (e) {
          // Invalid JSON in mitIdData
          fastify.log.warn({ userId }, 'Invalid MitID data JSON')
        }
      }

      reply.send({
        verified: user.mitIdVerified || false,
        identityVerified: user.identityVerified || false,
        cprNumber: user.cprNumber,
        mitIdInfo
      })

    } catch (error) {
      fastify.log.error(error, 'Failed to get MitID status')
      reply.status(500).send({
        error: 'Failed to retrieve MitID verification status'
      })
    }
  })

  // Revoke MitID verification (for testing or user request)
  fastify.delete('/auth/mitid/revoke', {
    preHandler: [authenticateUser]
  }, async (request, reply) => {
    try {
      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' })
      }

      await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          mitIdVerified: false,
          identityVerified: false,
          mitIdData: null
          // Keep cprNumber for record-keeping unless explicitly requested to remove
        }
      })

      fastify.log.info({ userId }, 'MitID verification revoked')

      reply.send({
        success: true,
        message: 'MitID verification has been revoked'
      })

    } catch (error) {
      fastify.log.error(error, 'Failed to revoke MitID verification')
      reply.status(500).send({
        error: 'Failed to revoke MitID verification'
      })
    }
  })
}

export default mitIdAuthRoutes