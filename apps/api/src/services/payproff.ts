interface PayproffConfig {
  apiUrl: string
  apiKey: string
}

export interface CreateEscrowRequest {
  amount: number
  currency: string
  buyerEmail: string
  sellerEmail: string
  description: string
  reference: string
}

export interface PayproffEscrowResponse {
  transactionId: string
  hostedUrl: string
  status: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED'
}

export class PayproffService {
  private config: PayproffConfig

  constructor() {
    this.config = {
      apiUrl: process.env.PAYPROFF_API_URL || 'https://api.payproff.com',
      apiKey: process.env.PAYPROFF_API_KEY || 'test-key'
    }
  }

  async createEscrow(request: CreateEscrowRequest): Promise<PayproffEscrowResponse> {
    const mockResponse: PayproffEscrowResponse = {
      transactionId: `pp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      hostedUrl: `${this.config.apiUrl}/checkout/${Date.now()}`,
      status: 'CREATED'
    }

    await new Promise(resolve => setTimeout(resolve, 100))
    
    return mockResponse
  }

  async getEscrowStatus(transactionId: string): Promise<PayproffEscrowResponse> {
    const mockResponse: PayproffEscrowResponse = {
      transactionId,
      hostedUrl: `${this.config.apiUrl}/checkout/${transactionId}`,
      status: 'CREATED'
    }

    await new Promise(resolve => setTimeout(resolve, 50))
    
    return mockResponse
  }

  async releaseEscrow(transactionId: string): Promise<PayproffEscrowResponse> {
    const mockResponse: PayproffEscrowResponse = {
      transactionId,
      hostedUrl: `${this.config.apiUrl}/checkout/${transactionId}`,
      status: 'RELEASED'
    }

    await new Promise(resolve => setTimeout(resolve, 100))
    
    return mockResponse
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = `sha256=${Buffer.from(payload + (process.env.PAYPROFF_WEBHOOK_SECRET || 'test-secret')).toString('base64')}`
    return signature === expectedSignature
  }
}