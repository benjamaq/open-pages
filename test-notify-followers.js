const fetch = require('node-fetch');

async function testNotifyFollowers() {
  try {
    console.log('🧪 Testing notify followers function...');
    
    const response = await fetch('http://localhost:3009/api/notify-followers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token' // You'll need to get a real token
      },
      body: JSON.stringify({
        message: 'Test message from notify followers test'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Notify followers test successful!');
    } else {
      console.log('❌ Notify followers test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testNotifyFollowers();
