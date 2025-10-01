// Manual test for daily reminder
const testData = {
  userName: 'Test User',
  userEmail: 'your-email@example.com', // Replace with your actual email
  supplements: [
    { name: 'Vitamin D', dose: '2000 IU', timing: 'morning' },
    { name: 'Omega-3', dose: '1000mg', timing: 'with food' }
  ],
  protocols: [
    { name: 'Cold shower', frequency: 'daily' },
    { name: 'Intermittent fasting', frequency: '16:8' }
  ],
  movement: [
    { name: 'Morning walk', duration: '30 min' },
    { name: 'Strength training', duration: '45 min' }
  ],
  mindfulness: [
    { name: 'Meditation', duration: '10 min' },
    { name: 'Breathing exercises', duration: '5 min' }
  ]
}

console.log('Test data prepared:', JSON.stringify(testData, null, 2))
console.log('This would be sent as a daily reminder email')
