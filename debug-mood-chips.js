// Debug script to test mood chips data flow
// Run this in the browser console to test the complete flow

console.log('🔍 Starting mood chips debug test...');

// Test 1: Check current data in localStorage
console.log('=== TEST 1: Local Storage ===');
const localStorageKeys = Object.keys(localStorage);
console.log('LocalStorage keys:', localStorageKeys);

// Test 2: Check if we can access the CHIP_CATALOG
console.log('=== TEST 2: CHIP_CATALOG Access ===');
try {
  // Try to import CHIP_CATALOG (this might not work in console)
  console.log('CHIP_CATALOG import test - may not work in console');
} catch (e) {
  console.log('CHIP_CATALOG not accessible from console');
}

// Test 3: Check current daily entry data
console.log('=== TEST 3: Current Daily Entry ===');
fetch('/api/mood/today')
  .then(response => response.json())
  .then(data => {
    console.log('Current daily entry:', data);
    if (data.entry && data.entry.tags) {
      console.log('Current tags:', data.entry.tags);
      console.log('Tags type:', typeof data.entry.tags);
      console.log('Tags length:', data.entry.tags.length);
    }
  })
  .catch(error => {
    console.error('Error fetching daily entry:', error);
  });

// Test 4: Test saving some expressive mood chips
console.log('=== TEST 4: Test Save ===');
const testTags = ['on_top_world', 'solid_baseline', 'foggy']; // Mix of expressive mood chips
console.log('Testing with tags:', testTags);

const testPayload = {
  mood: 7,
  sleep_quality: 8,
  pain: 3,
  tags: testTags,
  journal: 'Test entry with expressive mood chips',
  symptoms: [],
  pain_locations: [],
  pain_types: [],
  custom_symptoms: []
};

fetch('/api/mood/today', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
  console.log('Save response:', data);
  
  // Test 5: Immediately fetch to see if it was saved
  console.log('=== TEST 5: Verify Save ===');
  return fetch('/api/mood/today');
})
.then(response => response.json())
.then(data => {
  console.log('Verification fetch:', data);
  if (data.entry && data.entry.tags) {
    console.log('Saved tags:', data.entry.tags);
    console.log('Expected tags:', testTags);
    console.log('Tags match:', JSON.stringify(data.entry.tags.sort()) === JSON.stringify(testTags.sort()));
  }
})
.catch(error => {
  console.error('Error in test:', error);
});

console.log('🔍 Debug test completed. Check the logs above for results.');
