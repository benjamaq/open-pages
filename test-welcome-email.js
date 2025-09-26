const fetch = require('node-fetch');

async function testWelcomeEmail() {
  try {
    console.log('🧪 Testing welcome email...');
    
    const response = await fetch('http://localhost:3009/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'welcome',
        email: 'test@example.com', // Replace with your email
        ownerName: 'Test Owner'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Welcome email test successful!');
    } else {
      console.log('❌ Welcome email test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWelcomeEmail();
