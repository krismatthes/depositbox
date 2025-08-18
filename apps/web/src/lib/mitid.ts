// MitID integration service
// This is a simplified implementation for demonstration purposes
// In production, you would need to integrate with the actual MitID OIDC endpoints

export interface MitIDUser {
  cprNumber: string
  fullName: string
  firstName: string
  lastName: string
  dateOfBirth: string
  verified: boolean
}

export interface MitIDConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  baseUrl: string
  scope: string[]
}

// MitID test environment configuration
export const mitIdConfig: MitIDConfig = {
  clientId: process.env.NEXT_PUBLIC_MITID_CLIENT_ID || 'demo-client',
  clientSecret: process.env.MITID_CLIENT_SECRET || 'demo-secret',
  redirectUri: process.env.NEXT_PUBLIC_MITID_REDIRECT_URI || 'http://localhost:3000/auth/mitid/callback',
  baseUrl: process.env.MITID_BASE_URL || 'https://preprod.mitid.dk', // Test environment
  scope: ['openid', 'profile', 'mitid']
}

export class MitIDService {
  private config: MitIDConfig

  constructor(config: MitIDConfig = mitIdConfig) {
    this.config = config
  }

  // Generate MitID authorization URL
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope.join(' '),
      state: state || this.generateState()
    })

    return `${this.config.baseUrl}/connect/authorize?${params.toString()}`
  }

  // Generate random state for CSRF protection
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, state?: string): Promise<{
    accessToken: string
    idToken: string
    refreshToken?: string
  }> {
    const tokenEndpoint = `${this.config.baseUrl}/connect/token`
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri
    })

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      })

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`)
      }

      const tokens = await response.json()
      return {
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token
      }
    } catch (error) {
      console.error('MitID token exchange error:', error)
      throw new Error('Failed to exchange authorization code for tokens')
    }
  }

  // Decode and verify ID token to get user information
  async verifyAndDecodeIdToken(idToken: string): Promise<MitIDUser> {
    try {
      // In production, you should properly verify the JWT signature
      // This is a simplified version for demonstration
      const payload = this.decodeJWT(idToken)
      
      return {
        cprNumber: payload.cpr || payload.sub,
        fullName: payload.name,
        firstName: payload.given_name,
        lastName: payload.family_name,
        dateOfBirth: payload.birthdate,
        verified: true
      }
    } catch (error) {
      console.error('ID token verification failed:', error)
      throw new Error('Invalid ID token')
    }
  }

  // Simple JWT decoder (in production, use a proper JWT library with signature verification)
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      throw new Error('Invalid JWT format')
    }
  }

  // Get user info from MitID userinfo endpoint
  async getUserInfo(accessToken: string): Promise<MitIDUser> {
    try {
      const response = await fetch(`${this.config.baseUrl}/connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`)
      }

      const userInfo = await response.json()
      
      return {
        cprNumber: userInfo.cpr || userInfo.sub,
        fullName: userInfo.name,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        dateOfBirth: userInfo.birthdate,
        verified: true
      }
    } catch (error) {
      console.error('MitID user info error:', error)
      throw new Error('Failed to retrieve user information')
    }
  }
}

// Singleton instance
export const mitIdService = new MitIDService()

// React hook for MitID authentication
export const useMitID = () => {
  const initiateAuth = () => {
    const state = sessionStorage.getItem('mitid_state') || mitIdService.generateState()
    sessionStorage.setItem('mitid_state', state)
    
    const authUrl = mitIdService.generateAuthUrl(state)
    window.location.href = authUrl
  }

  const handleCallback = async (code: string, state: string) => {
    const storedState = sessionStorage.getItem('mitid_state')
    if (state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack')
    }

    try {
      const tokens = await mitIdService.exchangeCodeForTokens(code, state)
      const userInfo = await mitIdService.verifyAndDecodeIdToken(tokens.idToken)
      
      // Clear stored state
      sessionStorage.removeItem('mitid_state')
      
      return { tokens, userInfo }
    } catch (error) {
      console.error('MitID callback handling failed:', error)
      throw error
    }
  }

  return {
    initiateAuth,
    handleCallback
  }
}