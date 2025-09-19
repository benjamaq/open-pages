import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint for upload functionality
export async function POST(request: NextRequest) {
  console.log('Test upload API called')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    
    console.log('File received:', file?.name, 'Size:', file?.size, 'Type:', type)
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Return a mock URL for testing - use a real image URL for testing
    const mockUrl = `https://api.dicebear.com/7.x/initials/svg?seed=TestUser-${Date.now()}&backgroundColor=000000&textColor=ffffff`
    
    return NextResponse.json({ 
      url: mockUrl,
      path: `test/${file.name}`,
      success: true,
      message: 'Test upload successful (mock mode)'
    })
    
  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({ error: 'Test upload failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test upload API is working',
    timestamp: new Date().toISOString()
  })
}
