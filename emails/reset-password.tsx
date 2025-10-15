import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Section, Text } from '@react-email/components'
import * as React from 'react'

interface ResetPasswordEmailProps {
  resetUrl: string
  userName?: string
  expiresInMinutes?: number
  supportEmail?: string
  logoUrl?: string
}

const DEFAULT_LOGO =
  'https://img.freepik.com/premium-vector/flat-blue-verified-social-media-account-icon-approved-profile-sign-symbol-tick-rounded-corners_659151-3810.jpg?w=1060'

const ResetPasswordEmail = ({
  resetUrl,
  userName,
  expiresInMinutes = 30,
  supportEmail = 'ntuanloc205@gmail.com',
  logoUrl = DEFAULT_LOGO,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} width="70" height="70" alt="NTL" style={logo} />

        <Text style={eyebrow}>Password reset requested</Text>
        <Heading style={title}>{userName ? `Hi ${userName},` : 'Hi,'} reset your password</Heading>

        <Text style={paragraph}>
          We received a request to reset the password for your account. Click the button below to choose a new password.
          This link will expire in {expiresInMinutes} minutes.
        </Text>

        <Section style={ctaSection}>
          <Button href={resetUrl} style={button}>
            Reset password
          </Button>
        </Section>

        <Text style={small}>If the button doesn’t work, copy and paste this URL into your browser:</Text>
        <Text style={codeLike}>
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>
        </Text>

        <Hr style={divider} />

        <Text style={muted}>
          Didn’t request this? You can safely ignore this email—your password won’t change. For help, contact{' '}
          <Link href={`mailto:${supportEmail}`} style={link}>
            {supportEmail}
          </Link>
          .
        </Text>
      </Container>

      <Text style={footer}>Securely powered by NTL.</Text>
    </Body>
  </Html>
)

ResetPasswordEmail.PreviewProps = {
  resetUrl: 'https://your-app.com/reset?token=abc123',
  userName: 'Johan',
  expiresInMinutes: 30,
} as ResetPasswordEmailProps

export default ResetPasswordEmail

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '5px',
  boxShadow: '0 5px 10px rgba(20,50,70,.2)',
  marginTop: '20px',
  maxWidth: '420px',
  margin: '0 auto',
  padding: '40px 24px',
}

const logo = { margin: '0 auto' }

const eyebrow = {
  color: '#0a85ea',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '8px 0',
}

const title = {
  color: '#000',
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '26px',
  textAlign: 'center' as const,
  margin: '8px 0 16px',
}

const paragraph = {
  color: '#444',
  fontSize: '15px',
  lineHeight: '23px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}

const ctaSection = { textAlign: 'center' as const, margin: '12px 0 16px' }

const button = {
  display: 'inline-block',
  padding: '12px 18px',
  borderRadius: '6px',
  backgroundColor: '#0a85ea',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
}

const small = {
  color: '#666',
  fontSize: '13px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '8px 0 6px',
}

const codeLike = {
  background: 'rgba(0,0,0,.05)',
  borderRadius: '4px',
  padding: '8px',
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const link = { color: '#0a85ea', textDecoration: 'underline' }

const divider = { borderColor: '#eee', margin: '18px 0' }

const muted = {
  color: '#777',
  fontSize: '12px',
  lineHeight: '19px',
  textAlign: 'center' as const,
  margin: 0,
}

const footer = {
  color: '#000',
  fontSize: '12px',
  fontWeight: 800,
  lineHeight: '23px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
  textTransform: 'uppercase' as const,
}
