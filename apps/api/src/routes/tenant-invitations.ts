import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'

interface LandlordInvitationRequest {
  landlordName: string
  landlordEmail: string
  landlordPhone?: string
  personalMessage?: string
  propertyAddress?: string
}

const tenantInvitationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // Send invitation to landlord to create Nest together
  fastify.post('/tenant/invitations/landlord', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const data = request.body as LandlordInvitationRequest
      
      // Check if landlord already exists
      let landlordId = null
      const existingLandlord = await fastify.prisma.user.findUnique({
        where: { email: data.landlordEmail }
      })
      
      if (existingLandlord) {
        landlordId = existingLandlord.id
      } else {
        // Create placeholder landlord user
        const newLandlord = await fastify.prisma.user.create({
          data: {
            email: data.landlordEmail,
            firstName: data.landlordName.split(' ')[0] || data.landlordName,
            lastName: data.landlordName.split(' ').slice(1).join(' ') || '',
            phone: data.landlordPhone,
            password: '', // Will be set when they register
            role: 'LANDLORD'
          }
        })
        landlordId = newLandlord.id
      }
      
      // Create landlord invitation
      const invitation = await fastify.prisma.landlordInvitation.create({
        data: {
          tenantId: userId,
          landlordEmail: data.landlordEmail,
          landlordName: data.landlordName,
          landlordId: landlordId,
          
          subject: `Nest Depositum Invitation${data.propertyAddress ? ` - ${data.propertyAddress}` : ''}`,
          message: data.personalMessage || `Hej ${data.landlordName}, jeg vil gerne foreslå at vi bruger Nest til sikker håndtering af depositum for vores lejemål.`,
          propertyAddress: data.propertyAddress,
          
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        }
      })
      
      // TODO: Send email invitation to landlord with link to accept invitation and create Nest
      console.log(`Landlord invitation sent to ${data.landlordEmail}`)
      
      reply.send({ 
        success: true, 
        invitation,
        message: `Invitation sendt til ${data.landlordName}` 
      })
      
    } catch (error) {
      console.error('Error sending landlord invitation:', error)
      reply.status(500).send({ error: 'Failed to send invitation' })
    }
  })

  // Get tenant's sent invitations
  fastify.get('/tenant/invitations', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const invitations = await fastify.prisma.landlordInvitation.findMany({
        where: { 
          tenantId: userId
        },
        include: {
          nestEscrow: {
            select: { 
              id: true, 
              status: true, 
              totalAmount: true,
              propertyAddress: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ invitations })
    } catch (error) {
      console.error('Error fetching invitations:', error)
      reply.status(500).send({ error: 'Failed to fetch invitations' })
    }
  })

  // Cancel invitation
  fastify.delete('/tenant/invitations/:invitationId', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { invitationId } = request.params as { invitationId: string }

      // Verify ownership
      const invitation = await fastify.prisma.landlordInvitation.findFirst({
        where: {
          id: invitationId,
          tenantId: userId
        }
      })

      if (!invitation) {
        return reply.status(404).send({ error: 'Invitation not found' })
      }

      if (invitation.status !== 'PENDING') {
        return reply.status(400).send({ error: 'Only pending invitations can be cancelled' })
      }

      await fastify.prisma.landlordInvitation.update({
        where: { id: invitationId },
        data: { status: 'CANCELLED' }
      })

      reply.send({ message: 'Invitation cancelled successfully' })
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      reply.status(500).send({ error: 'Failed to cancel invitation' })
    }
  })
}

export default tenantInvitationRoutes