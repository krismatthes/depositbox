import { FastifyPluginAsync } from 'fastify'
import { authenticateUser } from '../middleware/auth'

interface TenantProfileRequest {
  // Personal information
  cprNumber?: string
  dateOfBirth?: string
  nationality?: string
  currentAddress?: string
  previousAddresses?: string[]
  
  // Employment and income
  monthlyIncome?: number
  employer?: string
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'FREELANCE' | 'UNEMPLOYED' | 'STUDENT' | 'PENSIONER'
  employmentStartDate?: string
  
  // References and guarantees
  previousLandlords?: Array<{
    name: string
    email: string
    phone?: string
    address: string
    period: string
  }>
  personalReferences?: Array<{
    name: string
    email: string
    phone: string
    relation: string
  }>
  hasGuarantor?: boolean
  guarantorInfo?: {
    name: string
    email: string
    phone: string
    cprNumber?: string
    income: number
  }
  
  // Household information
  householdSize?: number
  hasPets?: boolean
  petInfo?: Array<{
    type: string
    breed?: string
    age?: number
    name: string
  }>
  isSmoker?: boolean
  
  // Profile preferences
  profilePublic?: boolean
  allowContactFromLandlords?: boolean
}

interface DocumentUploadRequest {
  type: 'ID_CARD' | 'PASSPORT' | 'PAYSLIP' | 'EMPLOYMENT_LETTER' | 'BANK_STATEMENT' | 'TAX_RETURN' | 'PREVIOUS_RENTAL_REFERENCE'
  title: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  fileHash: string
  expiresAt?: string
}

const tenantProfileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateUser)

  // Get tenant profile
  fastify.get('/tenant/profile', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const profile = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          
          // Extended profile fields
          cprNumber: true,
          dateOfBirth: true,
          nationality: true,
          currentAddress: true,
          previousAddresses: true,
          
          monthlyIncome: true,
          employer: true,
          employmentType: true,
          employmentStartDate: true,
          
          previousLandlords: true,
          personalReferences: true,
          hasGuarantor: true,
          guarantorInfo: true,
          
          householdSize: true,
          hasPets: true,
          petInfo: true,
          isSmoker: true,
          
          // Verification status
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          incomeVerified: true,
          creditChecked: true,
          creditScore: true,
          
          profilePublic: true,
          allowContactFromLandlords: true,
          profileCompleteness: true,
          
          lastLoginAt: true,
          profileUpdatedAt: true,
          createdAt: true,
          updatedAt: true,
          
          // Include documents
          documents: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!profile) {
        return reply.status(404).send({ error: 'Profile not found' })
      }

      reply.send({
        ...profile,
        previousAddresses: profile.previousAddresses ? JSON.parse(profile.previousAddresses) : [],
        previousLandlords: profile.previousLandlords ? JSON.parse(profile.previousLandlords) : [],
        personalReferences: profile.personalReferences ? JSON.parse(profile.personalReferences) : [],
        guarantorInfo: profile.guarantorInfo ? JSON.parse(profile.guarantorInfo) : null,
        petInfo: profile.petInfo ? JSON.parse(profile.petInfo) : []
      })
    } catch (error) {
      console.error('Error fetching tenant profile:', error)
      reply.status(500).send({ error: 'Failed to fetch profile' })
    }
  })

  // Update tenant profile
  fastify.put('/tenant/profile', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const updates = request.body as TenantProfileRequest

      // Calculate profile completeness
      const completeness = calculateProfileCompleteness(updates)

      const updatedProfile = await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          cprNumber: updates.cprNumber,
          dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined,
          nationality: updates.nationality,
          currentAddress: updates.currentAddress,
          previousAddresses: updates.previousAddresses ? JSON.stringify(updates.previousAddresses) : undefined,
          
          monthlyIncome: updates.monthlyIncome ? updates.monthlyIncome * 100 : undefined, // Convert to øre
          employer: updates.employer,
          employmentType: updates.employmentType,
          employmentStartDate: updates.employmentStartDate ? new Date(updates.employmentStartDate) : undefined,
          
          previousLandlords: updates.previousLandlords ? JSON.stringify(updates.previousLandlords) : undefined,
          personalReferences: updates.personalReferences ? JSON.stringify(updates.personalReferences) : undefined,
          hasGuarantor: updates.hasGuarantor,
          guarantorInfo: updates.guarantorInfo ? JSON.stringify(updates.guarantorInfo) : undefined,
          
          householdSize: updates.householdSize,
          hasPets: updates.hasPets,
          petInfo: updates.petInfo ? JSON.stringify(updates.petInfo) : undefined,
          isSmoker: updates.isSmoker,
          
          profilePublic: updates.profilePublic,
          allowContactFromLandlords: updates.allowContactFromLandlords,
          
          profileCompleteness: completeness,
          profileUpdatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profileCompleteness: true,
          profileUpdatedAt: true
        }
      })

      reply.send(updatedProfile)
    } catch (error) {
      console.error('Error updating tenant profile:', error)
      reply.status(500).send({ error: 'Failed to update profile' })
    }
  })

  // Upload document
  fastify.post('/tenant/documents', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const documentData = request.body as DocumentUploadRequest

      const document = await fastify.prisma.tenantDocument.create({
        data: {
          userId,
          type: documentData.type,
          title: documentData.title,
          description: documentData.description,
          fileName: documentData.fileName,
          filePath: documentData.filePath,
          fileSize: documentData.fileSize,
          mimeType: documentData.mimeType,
          fileHash: documentData.fileHash,
          expiresAt: documentData.expiresAt ? new Date(documentData.expiresAt) : null
        }
      })

      reply.send(document)
    } catch (error) {
      console.error('Error uploading document:', error)
      reply.status(500).send({ error: 'Failed to upload document' })
    }
  })

  // Get documents
  fastify.get('/tenant/documents', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const documents = await fastify.prisma.tenantDocument.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ documents })
    } catch (error) {
      console.error('Error fetching documents:', error)
      reply.status(500).send({ error: 'Failed to fetch documents' })
    }
  })

  // =============== NEST PROPOSALS ===============
  
  // Create Nest proposal (lejer-initieret)
  fastify.post('/tenant/nest/proposals', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const data = request.body as any
      
      // Create or find landlord user
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
            password: '', // Will be set when they activate
            role: 'LANDLORD'
          }
        })
        landlordId = newLandlord.id
      }
      
      // Calculate total amount in øre
      const totalAmount = (data.depositAmount + data.firstMonthAmount + data.prepaidAmount + data.utilitiesAmount) * 100
      
      // Create Nest escrow 
      const nestEscrow = await fastify.prisma.nestEscrow.create({
        data: {
          landlordId: landlordId!,
          tenantId: userId,
          type: 'DEPOSIT',
          status: 'DRAFT', // Initial status - awaiting landlord confirmation
          version: 1,
          
          depositAmount: data.depositAmount * 100,
          firstMonthAmount: data.firstMonthAmount * 100,
          prepaidAmount: data.prepaidAmount * 100,
          utilitiesAmount: data.utilitiesAmount * 100,
          totalAmount: totalAmount,
          
          propertyAddress: data.propertyAddress,
          propertyPostcode: data.propertyPostcode,
          propertyCity: data.propertyCity,
          propertyType: data.propertyType,
          
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          
          // Default deadline configuration
          claimWindowDays: 14,
          responseWindowDays: 5,
          autoReleaseDays: 21,
          settlementRounds: 2
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          }
        }
      })
      
      // Create landlord invitation
      const invitation = await fastify.prisma.landlordInvitation.create({
        data: {
          tenantId: userId,
          landlordEmail: data.landlordEmail,
          landlordName: data.landlordName,
          landlordId: landlordId,
          nestEscrowId: nestEscrow.id,
          
          subject: `Nest Depositum Forslag - ${data.propertyAddress}`,
          message: data.personalMessage || `Jeg vil gerne leje din bolig på ${data.propertyAddress} og foreslår et Nest depositum arrangement.`,
          propertyAddress: data.propertyAddress,
          
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        }
      })
      
      // Create audit log
      await fastify.prisma.nestAuditLog.create({
        data: {
          escrowId: nestEscrow.id,
          action: 'NEST_CREATED',
          performedById: userId,
          performedByRole: 'TENANT',
          details: JSON.stringify({ 
            landlordEmail: data.landlordEmail,
            propertyAddress: data.propertyAddress,
            totalAmount: totalAmount 
          }),
          ipAddress: request.ip
        }
      })
      
      // TODO: Send email notification to landlord
      console.log(`Nest depositum created and landlord invited: ${data.landlordEmail}`)
      
      reply.send({ 
        success: true, 
        nestEscrow, 
        invitation,
        message: 'Nest depositum oprettet - udlejer skal godkende' 
      })
      
    } catch (error) {
      console.error('Error creating nest proposal:', error)
      reply.status(500).send({ error: 'Failed to create nest proposal' })
    }
  })

  // Get tenant's nest deposita
  fastify.get('/tenant/nest/proposals', async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const proposals = await fastify.prisma.nestEscrow.findMany({
        where: { 
          tenantId: userId
          // Get all Nest deposita for this tenant regardless of status
        },
        include: {
          landlord: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      reply.send({ proposals })
    } catch (error) {
      console.error('Error fetching nest deposita:', error)
      reply.status(500).send({ error: 'Failed to fetch nest deposita' })
    }
  })

  // Delete document
  fastify.delete('/tenant/documents/:documentId', async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const { documentId } = request.params as { documentId: string }

      // Verify ownership
      const document = await fastify.prisma.tenantDocument.findFirst({
        where: {
          id: documentId,
          userId
        }
      })

      if (!document) {
        return reply.status(404).send({ error: 'Document not found' })
      }

      await fastify.prisma.tenantDocument.delete({
        where: { id: documentId }
      })

      // TODO: Delete actual file from storage

      reply.send({ message: 'Document deleted successfully' })
    } catch (error) {
      console.error('Error deleting document:', error)
      reply.status(500).send({ error: 'Failed to delete document' })
    }
  })
}

// Helper function to calculate profile completeness
function calculateProfileCompleteness(profile: any): number {
  const fields = [
    'firstName', 'lastName', 'email', 'phone', // Basic info (4 points each)
    'cprNumber', 'dateOfBirth', 'nationality', 'currentAddress', // Identity (3 points each)
    'monthlyIncome', 'employer', 'employmentType', // Employment (4 points each)
    'householdSize', 'hasPets', 'isSmoker' // Household (2 points each)
  ]
  
  const weights = {
    firstName: 4, lastName: 4, email: 4, phone: 4,
    cprNumber: 3, dateOfBirth: 3, nationality: 3, currentAddress: 3,
    monthlyIncome: 4, employer: 4, employmentType: 4,
    householdSize: 2, hasPets: 2, isSmoker: 2
  }
  
  let totalScore = 0
  let maxScore = 0
  
  for (const field of fields) {
    maxScore += weights[field as keyof typeof weights]
    if (profile[field] !== undefined && profile[field] !== null && profile[field] !== '') {
      totalScore += weights[field as keyof typeof weights]
    }
  }
  
  return Math.round((totalScore / maxScore) * 100)
}

export default tenantProfileRoutes