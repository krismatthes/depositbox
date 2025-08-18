import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '../middleware/auth'

const prisma = new PrismaClient()

const invitationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // Create invitation from tenant to landlord
  fastify.post('/invitations/tenant-to-landlord', async (request, reply) => {
    const userId = request.user.userId
    const { landlordEmail, message, depositAmount, propertyInfo } = request.body as any

    try {
      // Find landlord by email
      const landlord = await prisma.user.findUnique({
        where: { email: landlordEmail }
      })

      if (!landlord) {
        reply.status(404).send({ error: 'Landlord not found with this email' })
        return
      }

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          type: 'TENANT_TO_LANDLORD',
          message: message || `Hej! Jeg vil gerne leje din bolig og er klar til at betale ${depositAmount} DKK i depositum via Housing Escrow.`,
          senderId: userId,
          receiverId: landlord.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      })

      // TODO: Send email notification to landlord

      reply.status(201).send({ 
        invitation,
        invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/${invitation.token}`
      })
    } catch (error) {
      console.error('Create tenant invitation error:', error)
      reply.status(500).send({ error: 'Failed to create invitation' })
    }
  })

  // Create invitation from landlord to tenant
  fastify.post('/invitations/landlord-to-tenant', async (request, reply) => {
    const userId = request.user.userId
    const { tenantEmail, propertyId, message } = request.body as any

    try {
      // Verify property belongs to landlord
      const property = await prisma.property.findFirst({
        where: { 
          id: propertyId,
          landlordId: userId 
        }
      })

      if (!property) {
        reply.status(404).send({ error: 'Property not found' })
        return
      }

      // Find or create tenant
      let tenant = await prisma.user.findUnique({
        where: { email: tenantEmail }
      })

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          type: 'LANDLORD_TO_TENANT',
          message: message || `Hej! Jeg vil gerne invitere dig til at se min bolig "${property.title}" og oprette en sikker depositum escrow.`,
          senderId: userId,
          receiverId: tenant?.id,
          propertyId: propertyId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      })

      // TODO: Send email notification to tenant

      reply.status(201).send({ 
        invitation,
        invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/${invitation.token}`
      })
    } catch (error) {
      console.error('Create landlord invitation error:', error)
      reply.status(500).send({ error: 'Failed to create invitation' })
    }
  })

  // Get invitation by token (public endpoint)
  fastify.get('/invitations/:token', async (request, reply) => {
    const { token } = request.params as { token: string }

    try {
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          sender: {
            select: { firstName: true, lastName: true, email: true }
          },
          receiver: {
            select: { firstName: true, lastName: true, email: true }
          },
          property: true
        }
      })

      if (!invitation) {
        reply.status(404).send({ error: 'Invitation not found' })
        return
      }

      if (invitation.expiresAt < new Date()) {
        reply.status(410).send({ error: 'Invitation has expired' })
        return
      }

      if (invitation.status !== 'PENDING') {
        reply.status(400).send({ error: 'Invitation is no longer pending' })
        return
      }

      reply.send({ invitation })
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch invitation' })
    }
  })

  // Accept invitation
  fastify.post('/invitations/:token/accept', async (request, reply) => {
    const userId = request.user.userId
    const { token } = request.params as { token: string }
    const { propertyData } = request.body as any // For tenant-to-landlord invitations

    try {
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          sender: true,
          property: true
        }
      })

      if (!invitation) {
        reply.status(404).send({ error: 'Invitation not found' })
        return
      }

      if (invitation.expiresAt < new Date()) {
        reply.status(410).send({ error: 'Invitation has expired' })
        return
      }

      if (invitation.status !== 'PENDING') {
        reply.status(400).send({ error: 'Invitation already processed' })
        return
      }

      let escrow;
      let property = invitation.property;

      if (invitation.type === 'TENANT_TO_LANDLORD') {
        // Landlord is accepting tenant's invitation
        // Create property first
        if (!property && propertyData) {
          property = await prisma.property.create({
            data: {
              title: propertyData.title,
              address: propertyData.address,
              description: propertyData.description,
              depositAmount: parseFloat(propertyData.depositAmount),
              currency: propertyData.currency || 'DKK',
              moveInDate: propertyData.moveInDate ? new Date(propertyData.moveInDate) : null,
              landlordId: userId,
              status: 'ACTIVE'
            }
          })
        }

        // Create escrow with tenant as buyer, landlord as seller
        escrow = await prisma.escrow.create({
          data: {
            amount: property!.depositAmount,
            currency: property!.currency,
            propertyId: property!.id,
            buyerId: invitation.senderId, // tenant
            sellerId: userId, // landlord
            payoutSetupRequired: true,
            plannedReleaseDate: property!.moveInDate
          }
        })
      } else {
        // Tenant is accepting landlord's invitation
        escrow = await prisma.escrow.create({
          data: {
            amount: property!.depositAmount,
            currency: property!.currency,
            propertyId: property!.id,
            buyerId: userId, // tenant
            sellerId: invitation.senderId, // landlord
            payoutSetupRequired: true,
            plannedReleaseDate: property!.moveInDate
          }
        })
      }

      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          receiverId: userId
        }
      })

      reply.send({ 
        success: true, 
        escrow,
        property
      })
    } catch (error) {
      console.error('Accept invitation error:', error)
      reply.status(500).send({ error: 'Failed to accept invitation' })
    }
  })

  // Get user's invitations
  fastify.get('/invitations', async (request, reply) => {
    const userId = request.user.userId

    try {
      const sentInvitations = await prisma.invitation.findMany({
        where: { senderId: userId },
        include: {
          receiver: {
            select: { firstName: true, lastName: true, email: true }
          },
          property: true
        },
        orderBy: { createdAt: 'desc' }
      })

      const receivedInvitations = await prisma.invitation.findMany({
        where: { receiverId: userId },
        include: {
          sender: {
            select: { firstName: true, lastName: true, email: true }
          },
          property: true
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ 
        sent: sentInvitations,
        received: receivedInvitations
      })
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch invitations' })
    }
  })
}

export default invitationsRoutes