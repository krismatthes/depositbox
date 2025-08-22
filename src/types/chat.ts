export interface Conversation {
  id: string
  contract_id: string
  title: string
  is_open: boolean
  created_at: string
  updated_at: string
  last_message?: Message
  unread_count?: number
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  role: 'tenant' | 'landlord' | 'support'
  muted: boolean
  last_read_message_id?: string
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_role: 'tenant' | 'landlord' | 'support'
  type: 'text' | 'system' | 'payment_link' | 'lease_link'
  body: string
  status: 'sent' | 'delivered' | 'read'
  reply_to_message_id?: string
  reply_to_message?: Message
  created_at: string
  attachments: Attachment[]
  receipts: MessageReceipt[]
}

export interface MessageReceipt {
  id: string
  message_id: string
  recipient_id: string
  recipient_name: string
  delivered_at?: string
  read_at?: string
}

export interface Attachment {
  id: string
  message_id: string
  file_name: string
  mime_type: string
  size_bytes: number
  storage_url: string
  checksum: string
  created_at: string
}

export interface ChatNotificationSettings {
  email_enabled: boolean
  email_address: string
  push_enabled: boolean
  digest_enabled: boolean
  muted_conversations: string[]
}

export interface ConversationFilter {
  status: 'all' | 'open' | 'closed'
  contract_id?: string
  search?: string
}

export interface SendMessageData {
  type: 'text' | 'system' | 'payment_link' | 'lease_link'
  body: string
  reply_to_message_id?: string
  attachments?: File[]
}

export interface ConversationSummary {
  total_conversations: number
  unread_messages: number
  active_conversations: number
  closed_conversations: number
}