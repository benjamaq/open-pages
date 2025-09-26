const { sendWelcomeEmail } = require('./src/lib/email/resend.ts')

async function testWelcomeEmail() {
  try {
    console.log('🧪 Testing welcome email...')
    
    const result = await sendWelcomeEmail('ben09@mac.com', 'Test User')
    
    console.log('📧 Welcome email result:', result)
    
    if (result.success) {
      console.log('✅ Welcome email sent successfully!')
    } else {
      console.log('❌ Welcome email failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Error testing welcome email:', error)
  }
}

testWelcomeEmail()
