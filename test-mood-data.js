// Simple test script to add mood data
// Run this in the browser console on the dashboard page

async function addTestMoodData() {
  try {
    const response = await fetch('/api/mood/today', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mood: 8,
        sleep_quality: 9,
        pain: 8,
        tags: ['high-energy', 'well-rested'],
        journal: 'Feeling great today!'
      })
    });

    const result = await response.json();
    console.log('Mood data saved:', result);
    
    if (result.success) {
      console.log('✅ Test mood data added successfully!');
      // Reload the page to see the changes
      window.location.reload();
    } else {
      console.error('❌ Failed to save mood data:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
addTestMoodData();
