// Chat utilities for creating and managing conversations
import { Conversation, ConversationParticipant, Message } from '@/types/chat'

export interface CreateConversationParams {
  contractId: string
  contractType: 'rent_agreement' | 'nest_escrow' | 'lease_contract' | 'roomie_agreement'
  propertyAddress: string
  tenantId: string
  tenantName: string
  tenantEmail: string
  landlordId: string
  landlordName: string
  landlordEmail: string
}

export function createConversationFromContract(params: CreateConversationParams): void {
  if (typeof window === 'undefined') return

  const {
    contractId,
    contractType,
    propertyAddress,
    tenantId,
    tenantName,
    tenantEmail,
    landlordId,
    landlordName,
    landlordEmail
  } = params

  // Check if conversation already exists for this contract
  const existingConversations = localStorage.getItem('chat_conversations') || '[]'
  const conversations = JSON.parse(existingConversations) as Conversation[]
  
  const existingConversation = conversations.find(conv => conv.contract_id === contractId)
  if (existingConversation) {
    console.log(`Conversation already exists for contract ${contractId}`)
    return
  }

  const now = new Date().toISOString()
  const conversationId = `conv-${contractId}-${Date.now()}`

  // Create conversation
  const conversation: Conversation = {
    id: conversationId,
    contract_id: contractId,
    title: `Kommunikation: ${propertyAddress}`,
    is_open: true,
    created_at: now,
    updated_at: now
  }

  // Create participants
  const participants: ConversationParticipant[] = [
    {
      conversation_id: conversationId,
      user_id: tenantId,
      role: 'tenant',
      muted: false,
      joined_at: now
    },
    {
      conversation_id: conversationId,
      user_id: landlordId,
      role: 'landlord',
      muted: false,
      joined_at: now
    }
  ]

  // Create welcome system message
  const welcomeMessage: Message = {
    id: `msg-welcome-${Date.now()}`,
    conversation_id: conversationId,
    sender_id: 'system',
    sender_name: 'System',
    sender_role: 'support',
    type: 'system',
    body: getWelcomeMessage(contractType, tenantName, landlordName, propertyAddress),
    status: 'read',
    created_at: now,
    attachments: [],
    receipts: []
  }

  // Save to localStorage
  try {
    // Save conversation
    conversations.push(conversation)
    localStorage.setItem('chat_conversations', JSON.stringify(conversations))

    // Save participants
    const existingParticipants = localStorage.getItem('chat_participants') || '[]'
    const allParticipants = JSON.parse(existingParticipants)
    allParticipants.push(...participants)
    localStorage.setItem('chat_participants', JSON.stringify(allParticipants))

    // Save welcome message
    const existingMessages = localStorage.getItem('chat_messages') || '[]'
    const allMessages = JSON.parse(existingMessages)
    allMessages.push(welcomeMessage)
    localStorage.setItem('chat_messages', JSON.stringify(allMessages))

    console.log(`✅ Chat conversation created for contract ${contractId}: ${conversationId}`)
  } catch (error) {
    console.error('Error creating chat conversation:', error)
  }
}

function getWelcomeMessage(
  contractType: string, 
  tenantName: string, 
  landlordName: string, 
  propertyAddress: string
): string {
  switch (contractType) {
    case 'rent_agreement':
      return `🏠 Velkommen til kommunikation om ${propertyAddress}!\n\nDenne samtale er oprettet mellem ${tenantName} (lejer) og ${landlordName} (udlejer) i forbindelse med jeres huslejeaftale.\n\nI kan nu kommunikere sikkert om alt vedrørende lejeforholdet. Alle beskeder dokumenteres automatisk.`
    
    case 'nest_escrow':
      return `🪺 NEST Escrow oprettet for ${propertyAddress}!\n\nDenne sikre samtale er mellem ${tenantName} (lejer) og ${landlordName} (udlejer).\n\nI kan følge status på jeres depositum-deponering og kommunikere sikkert om processen.`
    
    case 'lease_contract':
      return `📄 Lejekontrakt samtale for ${propertyAddress}\n\nKommunikation mellem ${tenantName} (lejer) og ${landlordName} (udlejer) vedrørende jeres lejekontrakt.\n\nI kan diskutere kontraktvilkår og dele dokumenter sikkert her.`
    
    case 'roomie_agreement':
      return `🏡 Roomie-aftale samtale for ${propertyAddress}\n\nSamtale mellem beboere om jeres roomie-aftale.\n\nBrug denne chat til at koordinere og diskutere alt om jeres fælles bolig.`
    
    default:
      return `💬 Samtale oprettet mellem ${tenantName} og ${landlordName} for ${propertyAddress}.\n\nI kan nu kommunikere sikkert om jeres aftale.`
  }
}

export function findConversationByContract(contractId: string): Conversation | null {
  if (typeof window === 'undefined') return null

  try {
    const savedConversations = localStorage.getItem('chat_conversations') || '[]'
    const conversations = JSON.parse(savedConversations) as Conversation[]
    return conversations.find(conv => conv.contract_id === contractId) || null
  } catch (error) {
    console.error('Error finding conversation:', error)
    return null
  }
}

export function getUserConversations(userId: string): Conversation[] {
  if (typeof window === 'undefined') return []

  try {
    const savedConversations = localStorage.getItem('chat_conversations') || '[]'
    const conversations = JSON.parse(savedConversations) as Conversation[]
    
    const savedParticipants = localStorage.getItem('chat_participants') || '[]'
    const participants = JSON.parse(savedParticipants) as ConversationParticipant[]
    
    // Filter conversations where user is a participant
    return conversations.filter(conv => 
      participants.some(p => p.conversation_id === conv.id && p.user_id === userId)
    )
  } catch (error) {
    console.error('Error getting user conversations:', error)
    return []
  }
}