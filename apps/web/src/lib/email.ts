'use server'

import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_cQDRut3y_2xV6XukbiVk8ZTEHeDS3HthN')

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

// Default sender email (using Resend's onboarding domain for testing)
const DEFAULT_FROM = 'BoligDeposit <onboarding@resend.dev>'

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text, from }: EmailOptions): Promise<boolean> {
  try {
    const response = await resend.emails.send({
      from: from || DEFAULT_FROM,
      to,
      subject,
      html: html || text,
      text
    })

    if (response.error) {
      console.error('Resend email error:', response.error)
      return false
    }

    console.log('Email sent successfully:', response.data?.id)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36)
}

/**
 * Create email verification email template
 */
export function createEmailVerificationTemplate(firstName: string, verificationUrl: string): EmailTemplate {
  const subject = 'Bekræft din email - BoligDeposit'
  
  const html = `
    <!DOCTYPE html>
    <html lang="da">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bekræft din email</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .content { 
          background: #f8fafc; 
          padding: 30px; 
          border-radius: 12px; 
          border: 1px solid #e2e8f0;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          margin: 20px 0;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          font-size: 12px; 
          color: #64748b; 
        }
        .security-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BoligDeposit</h1>
      </div>
      
      <div class="content">
        <h2>Hej ${firstName}!</h2>
        
        <p>Velkommen til BoligDeposit! 🏠</p>
        
        <p>For at komme i gang skal du bekræfte din email-adresse ved at klikke på knappen herunder:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Bekræft min email</a>
        </div>
        
        <div class="security-notice">
          <p><strong>🔒 Sikkerhedsinfo:</strong></p>
          <p>Dette link er gyldigt i 24 timer og kan kun bruges én gang. Hvis du ikke har oprettet en konto hos BoligDeposit, kan du ignorere denne email.</p>
        </div>
        
        <p>Hvis knappen ikke virker, kan du kopiere og indsætte dette link i din browser:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${verificationUrl}
        </p>
        
        <p>Med venlig hilsen,<br>
        BoligDeposit teamet</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} BoligDeposit ApS - Sikker depositum håndtering</p>
        <p>GDPR compliant • SSL sikret • Dansk virksomhed</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
Hej ${firstName}!

Velkommen til BoligDeposit!

For at komme i gang skal du bekræfte din email-adresse ved at besøge dette link:
${verificationUrl}

Dette link er gyldigt i 24 timer og kan kun bruges én gang.

Hvis du ikke har oprettet en konto hos BoligDeposit, kan du ignorere denne email.

Med venlig hilsen,
BoligDeposit teamet

© ${new Date().getFullYear()} BoligDeposit ApS - Sikker depositum håndtering
  `
  
  return { subject, html, text }
}

/**
 * Create password reset email template
 */
export function createPasswordResetTemplate(firstName: string, resetUrl: string): EmailTemplate {
  const subject = 'Nulstil din adgangskode - BoligDeposit'
  
  const html = `
    <!DOCTYPE html>
    <html lang="da">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nulstil adgangskode</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .content { 
          background: #f8fafc; 
          padding: 30px; 
          border-radius: 12px; 
          border: 1px solid #e2e8f0;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          margin: 20px 0;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          font-size: 12px; 
          color: #64748b; 
        }
        .security-notice {
          background: #fef2f2;
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BoligDeposit</h1>
      </div>
      
      <div class="content">
        <h2>Hej ${firstName}!</h2>
        
        <p>Vi har modtaget en anmodning om at nulstille adgangskoden til din BoligDeposit konto.</p>
        
        <p>Klik på knappen herunder for at nulstille din adgangskode:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Nulstil adgangskode</a>
        </div>
        
        <div class="security-notice">
          <p><strong>🔐 Vigtig sikkerhedsinfo:</strong></p>
          <p>Dette link er gyldigt i 1 time og kan kun bruges én gang. Hvis du ikke har anmodet om at nulstille din adgangskode, skal du ignorere denne email og kontakte os øjeblikkeligt.</p>
        </div>
        
        <p>Hvis knappen ikke virker, kan du kopiere og indsætte dette link i din browser:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${resetUrl}
        </p>
        
        <p>Med venlig hilsen,<br>
        BoligDeposit teamet</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} BoligDeposit ApS - Sikker depositum håndtering</p>
        <p>GDPR compliant • SSL sikret • Dansk virksomhed</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
Hej ${firstName}!

Vi har modtaget en anmodning om at nulstille adgangskoden til din BoligDeposit konto.

Besøg dette link for at nulstille din adgangskode:
${resetUrl}

Dette link er gyldigt i 1 time og kan kun bruges én gang.

Hvis du ikke har anmodet om at nulstille din adgangskode, skal du ignorere denne email og kontakte os øjeblikkeligt.

Med venlig hilsen,
BoligDeposit teamet

© ${new Date().getFullYear()} BoligDeposit ApS - Sikker depositum håndtering
  `
  
  return { subject, html, text }
}

/**
 * Create escrow notification email template
 */
export function createEscrowNotificationTemplate(
  firstName: string, 
  message: string, 
  escrowId: string,
  actionUrl?: string
): EmailTemplate {
  const subject = 'Opdatering vedrørende dit depositum - BoligDeposit'
  
  const html = `
    <!DOCTYPE html>
    <html lang="da">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Depositum opdatering</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .content { 
          background: #f8fafc; 
          padding: 30px; 
          border-radius: 12px; 
          border: 1px solid #e2e8f0;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          margin: 20px 0;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          font-size: 12px; 
          color: #64748b; 
        }
        .escrow-info {
          background: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🪺 BoligDeposit</h1>
      </div>
      
      <div class="content">
        <h2>Hej ${firstName}!</h2>
        
        <p>${message}</p>
        
        <div class="escrow-info">
          <p><strong>📋 Escrow ID:</strong> ${escrowId}</p>
        </div>
        
        ${actionUrl ? `
        <div style="text-align: center;">
          <a href="${actionUrl}" class="button">Se detaljer</a>
        </div>
        ` : ''}
        
        <p>Du kan altid logge ind på din BoligDeposit konto for at se status og detaljer om dine transaktioner.</p>
        
        <p>Med venlig hilsen,<br>
        BoligDeposit teamet</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} BoligDeposit ApS - Sikker depositum håndtering</p>
        <p>GDPR compliant • SSL sikret • Dansk virksomhed</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
Hej ${firstName}!

${message}

Escrow ID: ${escrowId}

${actionUrl ? `Se detaljer: ${actionUrl}` : ''}

Du kan altid logge ind på din BoligDeposit konto for at se status og detaljer om dine transaktioner.

Med venlig hilsen,
BoligDeposit teamet

© ${new Date().getFullYear()} BoligDeposit ApS - Sikker depositum håndtering
  `
  
  return { subject, html, text }
}

/**
 * Send email verification
 */
export async function sendEmailVerification(email: string, firstName: string, verificationToken: string): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`
  const template = createEmailVerificationTemplate(firstName, verificationUrl)
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`
  const template = createPasswordResetTemplate(firstName, resetUrl)
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

/**
 * Send escrow notification
 */
export async function sendEscrowNotification(
  email: string, 
  firstName: string, 
  message: string, 
  escrowId: string,
  actionUrl?: string
): Promise<boolean> {
  const template = createEscrowNotificationTemplate(firstName, message, escrowId, actionUrl)
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}