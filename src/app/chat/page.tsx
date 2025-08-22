'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Conversation, Message, ConversationFilter } from '@/types/chat'
import { validateUserAccess, validateConversationAccess, canSendMessage, sanitizeInput } from '@/lib/security'
import { getUserConversations } from '@/lib/chatUtils'

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ConversationFilter>({
    status: 'all'
  })
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!validateUserAccess(user)) {
      router.push('/login')
      return
    }
    loadConversations()
  }, [user, router])

  const loadConversations = () => {
    if (typeof window !== 'undefined' && user) {
      try {
        // Load conversations
        const savedConversations = localStorage.getItem('chat_conversations') || '[]'
        let allConversations = JSON.parse(savedConversations) as Conversation[]
        
        // Load participants to filter by user
        const savedParticipants = localStorage.getItem('chat_participants') || '[]'
        const participants = JSON.parse(savedParticipants)
        
        // Filter conversations where user is a participant
        const userConversations = allConversations.filter(conv => 
          participants.some((p: any) => p.conversation_id === conv.id && p.user_id === user.id)
        )

        // Create dummy data if no conversations exist (for demo purposes)
        if (userConversations.length === 0) {
          console.log('No real conversations found, creating dummy data for demo')
          createDummyConversations()
          return
        }

        // Load messages and calculate unread counts
        const savedMessages = localStorage.getItem('chat_messages') || '[]'
        const allMessages = JSON.parse(savedMessages) as Message[]
        
        const conversationsWithCounts = userConversations.map(conv => {
          const convMessages = allMessages.filter(msg => msg.conversation_id === conv.id)
          const lastMessage = convMessages.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          
          // Calculate unread messages
          const participant = participants.find((p: any) => 
            p.conversation_id === conv.id && p.user_id === user.id
          )
          const lastReadId = participant?.last_read_message_id
          const unreadCount = lastReadId ? 
            convMessages.filter(msg => msg.sender_id !== user.id && msg.created_at > lastReadId).length :
            convMessages.filter(msg => msg.sender_id !== user.id).length

          return {
            ...conv,
            last_message: lastMessage,
            unread_count: unreadCount
          }
        })

        setConversations(conversationsWithCounts)
      } catch (error) {
        console.error('Error loading conversations:', error)
      }
    }
    setLoading(false)
  }

  const createDummyConversations = () => {
    if (!user) return

    const now = new Date()
    const dummyConversations: Conversation[] = []
    const dummyParticipants: any[] = []
    const dummyMessages: Message[] = []

    // Create 2 dummy conversations based on user role
    for (let i = 0; i < 2; i++) {
      const conversationId = `conv-${Date.now()}-${i}`
      const contractId = `contract-${i + 1}`
      
      const conversation: Conversation = {
        id: conversationId,
        contract_id: contractId,
        title: `Kommunikation: ${i === 0 ? 'Eksempel Vej 123' : 'Test Gade 456'}`,
        is_open: true,
        created_at: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }

      dummyConversations.push(conversation)

      // Add participants
      dummyParticipants.push({
        conversation_id: conversationId,
        user_id: user.id,
        role: user.role?.toLowerCase(),
        muted: false,
        joined_at: conversation.created_at
      })

      // Add counterpart participant
      const counterpartId = `dummy-${user.role === 'TENANT' ? 'landlord' : 'tenant'}-${i}`
      dummyParticipants.push({
        conversation_id: conversationId,
        user_id: counterpartId,
        role: user.role === 'TENANT' ? 'landlord' : 'tenant',
        muted: false,
        joined_at: conversation.created_at
      })

      // Add some dummy messages
      const messages = [
        {
          id: `msg-${Date.now()}-${i}-1`,
          conversation_id: conversationId,
          sender_id: user.role === 'TENANT' ? counterpartId : user.id,
          sender_name: user.role === 'TENANT' ? 'Peter Larsen' : `${user.firstName} ${user.lastName}`,
          sender_role: (user.role === 'TENANT' ? 'landlord' : 'tenant') as 'tenant' | 'landlord',
          type: 'text' as const,
          body: user.role === 'TENANT' ? 
            'Hej! Velkommen til din nye bolig. Lad mig vide hvis du har spørgsmål.' :
            'Tak for beskeden. Jeg har et spørgsmål om vedligeholdelse.',
          status: 'read' as const,
          created_at: new Date(now.getTime() - (i + 1) * 12 * 60 * 60 * 1000).toISOString(),
          attachments: [],
          receipts: []
        },
        {
          id: `msg-${Date.now()}-${i}-2`,
          conversation_id: conversationId,
          sender_id: user.role === 'TENANT' ? user.id : counterpartId,
          sender_name: user.role === 'TENANT' ? `${user.firstName} ${user.lastName}` : 'Anna Nielsen',
          sender_role: user.role?.toLowerCase() as 'tenant' | 'landlord',
          type: 'text' as const,
          body: user.role === 'TENANT' ? 
            'Tak! Jeg har et spørgsmål om varmeforbrug. Hvor kan jeg se min måler?' :
            'Perfekt! Alt fungerer fint indtil videre.',
          status: i === 0 ? 'sent' as const : 'read' as const,
          created_at: new Date(now.getTime() - (i * 6 + 2) * 60 * 60 * 1000).toISOString(),
          attachments: [],
          receipts: []
        }
      ]

      dummyMessages.push(...messages)
    }

    // Save dummy data
    localStorage.setItem('chat_conversations', JSON.stringify(dummyConversations))
    localStorage.setItem('chat_participants', JSON.stringify(dummyParticipants))
    localStorage.setItem('chat_messages', JSON.stringify(dummyMessages))

    // Reload conversations
    loadConversations()
  }


  const selectConversation = (conversation: Conversation) => {
    // Security check: Verify user has access to this conversation
    if (!user || !validateConversationAccess(conversation.id, user.id)) {
      alert('Du har ikke adgang til denne samtale.')
      return
    }

    setSelectedConversation(conversation)
    loadMessages(conversation.id)
    markConversationAsRead(conversation.id)
  }

  const loadMessages = (conversationId: string) => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('chat_messages') || '[]'
      const allMessages = JSON.parse(savedMessages) as Message[]
      const convMessages = allMessages
        .filter(msg => msg.conversation_id === conversationId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      
      setMessages(convMessages)
    }
  }

  const markConversationAsRead = (conversationId: string) => {
    if (typeof window !== 'undefined' && user) {
      const savedParticipants = localStorage.getItem('chat_participants') || '[]'
      const participants = JSON.parse(savedParticipants)
      
      // Find latest message in conversation
      const savedMessages = localStorage.getItem('chat_messages') || '[]'
      const allMessages = JSON.parse(savedMessages) as Message[]
      const convMessages = allMessages.filter(msg => msg.conversation_id === conversationId)
      const latestMessage = convMessages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      if (latestMessage) {
        const updatedParticipants = participants.map((p: any) => 
          p.conversation_id === conversationId && p.user_id === user.id
            ? { ...p, last_read_message_id: latestMessage.id }
            : p
        )
        localStorage.setItem('chat_participants', JSON.stringify(updatedParticipants))
        
        // Reload conversations to update unread counts
        loadConversations()
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return

    // Security checks
    if (!validateConversationAccess(selectedConversation.id, user.id)) {
      alert('Du har ikke adgang til denne samtale.')
      return
    }

    const rateLimitCheck = canSendMessage(user.id)
    if (!rateLimitCheck.allowed) {
      alert(rateLimitCheck.reason)
      return
    }

    setSending(true)

    try {
      const messageId = `msg-${Date.now()}`
      const now = new Date().toISOString()

      // Find counterpart
      const savedParticipants = localStorage.getItem('chat_participants') || '[]'
      const participants = JSON.parse(savedParticipants)
      const counterpart = participants.find((p: any) => 
        p.conversation_id === selectedConversation.id && p.user_id !== user.id
      )

      const newMsg: Message = {
        id: messageId,
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        sender_name: `${user.firstName} ${user.lastName}`,
        sender_role: user.role?.toLowerCase() as 'tenant' | 'landlord',
        type: 'text',
        body: sanitizeInput(newMessage),
        status: 'sent',
        created_at: now,
        attachments: [],
        receipts: []
      }

      // Add message to localStorage
      const savedMessages = localStorage.getItem('chat_messages') || '[]'
      const allMessages = JSON.parse(savedMessages)
      allMessages.push(newMsg)
      localStorage.setItem('chat_messages', JSON.stringify(allMessages))

      // Update conversation updated_at
      const savedConversations = localStorage.getItem('chat_conversations') || '[]'
      const allConversations = JSON.parse(savedConversations)
      const updatedConversations = allConversations.map((conv: Conversation) =>
        conv.id === selectedConversation.id 
          ? { ...conv, updated_at: now }
          : conv
      )
      localStorage.setItem('chat_conversations', JSON.stringify(updatedConversations))

      // Update messages state
      setMessages(prev => [...prev, newMsg])
      setNewMessage('')

      // Reload conversations to update last message
      loadConversations()

      // Simulate delivery after a short delay
      setTimeout(() => {
        const deliveredMsg = { ...newMsg, status: 'delivered' as const }
        const updatedMessages = allMessages.map((msg: Message) =>
          msg.id === messageId ? deliveredMsg : msg
        )
        localStorage.setItem('chat_messages', JSON.stringify(updatedMessages))
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? deliveredMsg : msg
        ))
      }, 1000)

      // Simulate read receipt after another delay (if it's a real conversation)
      setTimeout(() => {
        const readMsg = { ...newMsg, status: 'read' as const }
        const savedMsgs = localStorage.getItem('chat_messages') || '[]'
        const allMsgs = JSON.parse(savedMsgs)
        const updatedMsgs = allMsgs.map((msg: Message) =>
          msg.id === messageId ? readMsg : msg
        )
        localStorage.setItem('chat_messages', JSON.stringify(updatedMsgs))
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? readMsg : msg
        ))
      }, 3000)

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const closeConversation = () => {
    if (!selectedConversation || !user) return

    const savedConversations = localStorage.getItem('chat_conversations') || '[]'
    const allConversations = JSON.parse(savedConversations)
    const updatedConversations = allConversations.map((conv: Conversation) =>
      conv.id === selectedConversation.id 
        ? { ...conv, is_open: false, updated_at: new Date().toISOString() }
        : conv
    )
    localStorage.setItem('chat_conversations', JSON.stringify(updatedConversations))

    // Add system message
    const systemMsg: Message = {
      id: `sys-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: 'system',
      sender_name: 'System',
      sender_role: 'support',
      type: 'system',
      body: `Samtale lukket af ${user.firstName} ${user.lastName}`,
      status: 'read',
      created_at: new Date().toISOString(),
      attachments: [],
      receipts: []
    }

    const savedMessages = localStorage.getItem('chat_messages') || '[]'
    const allMessages = JSON.parse(savedMessages)
    allMessages.push(systemMsg)
    localStorage.setItem('chat_messages', JSON.stringify(allMessages))

    setMessages(prev => [...prev, systemMsg])
    setSelectedConversation(prev => prev ? { ...prev, is_open: false } : null)
    loadConversations()
  }

  const reopenConversation = () => {
    if (!selectedConversation || !user) return

    const savedConversations = localStorage.getItem('chat_conversations') || '[]'
    const allConversations = JSON.parse(savedConversations)
    const updatedConversations = allConversations.map((conv: Conversation) =>
      conv.id === selectedConversation.id 
        ? { ...conv, is_open: true, updated_at: new Date().toISOString() }
        : conv
    )
    localStorage.setItem('chat_conversations', JSON.stringify(updatedConversations))

    // Add system message
    const systemMsg: Message = {
      id: `sys-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: 'system',
      sender_name: 'System',
      sender_role: 'support',
      type: 'system',
      body: `Samtale genåbnet af ${user.firstName} ${user.lastName}`,
      status: 'read',
      created_at: new Date().toISOString(),
      attachments: [],
      receipts: []
    }

    const savedMessages = localStorage.getItem('chat_messages') || '[]'
    const allMessages = JSON.parse(savedMessages)
    allMessages.push(systemMsg)
    localStorage.setItem('chat_messages', JSON.stringify(allMessages))

    setMessages(prev => [...prev, systemMsg])
    setSelectedConversation(prev => prev ? { ...prev, is_open: true } : null)
    loadConversations()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'I går'
    } else if (diffDays < 7) {
      return `${diffDays} dage siden`
    } else {
      return date.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Kommunikation</h1>
                <p className="text-slate-600 mt-1">
                  Besked udveksling mellem {user?.role === 'TENANT' ? 'dig og dine udlejere' : 'dig og dine lejere'}
                </p>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Samtaler</h2>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-slate-600">Ingen samtaler endnu</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => selectConversation(conversation)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-slate-800 truncate">
                            {conversation.title}
                          </h3>
                          {conversation.unread_count && conversation.unread_count > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <div className="flex justify-between items-end">
                            <p className="text-sm text-slate-600 truncate">
                              <span className="font-medium">{conversation.last_message.sender_name}:</span>{' '}
                              {conversation.last_message.body}
                            </p>
                            <span className="text-xs text-slate-500 ml-2">
                              {formatTime(conversation.last_message.created_at)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center mt-2">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            conversation.is_open ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-xs text-slate-500">
                            {conversation.is_open ? 'Åben' : 'Lukket'}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Message View */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-[600px] flex flex-col">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{selectedConversation.title}</h3>
                        <p className="text-green-100 text-sm">
                          {selectedConversation.is_open ? 'Aktiv samtale' : 'Lukket samtale'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {selectedConversation.is_open ? (
                          <button 
                            onClick={closeConversation}
                            className="text-green-100 hover:text-white p-2 rounded"
                            title="Luk samtale"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                        ) : (
                          <button 
                            onClick={reopenConversation}
                            className="text-green-100 hover:text-white p-2 rounded"
                            title="Genåbn samtale"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-500 mt-8">
                        <p>Ingen beskeder i denne samtale endnu.</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        message.type === 'system' ? (
                          <div key={message.id} className="flex justify-center my-4">
                            <div className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                              {message.body}
                            </div>
                          </div>
                        ) : (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs opacity-75">{message.sender_name}</span>
                                <span className="text-xs opacity-50">
                                  {new Date(message.created_at).toLocaleTimeString('da-DK', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm">{message.body}</p>
                              {message.sender_id === user?.id && (
                                <div className="flex justify-end mt-1">
                                  <div className="flex items-center gap-1 text-xs opacity-75">
                                    {message.status === 'sent' && <span>✓</span>}
                                    {message.status === 'delivered' && <span>✓✓</span>}
                                    {message.status === 'read' && <span className="text-blue-300">✓✓</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  {selectedConversation.is_open ? (
                    <div className="p-6 border-t border-slate-200">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Skriv din besked..."
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={sending}
                        />
                        <button 
                          onClick={sendMessage}
                          disabled={sending || !newMessage.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          {sending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              Sender...
                            </>
                          ) : (
                            'Send'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-t border-slate-200 bg-slate-50">
                      <div className="text-center text-slate-500">
                        <p className="mb-4">Denne samtale er lukket.</p>
                        <button 
                          onClick={reopenConversation}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Genåbn samtale
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-[600px] flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p>Vælg en samtale for at se beskeder</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}