import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendContactEmail, sendAutoReplyEmail } from '@/lib/email'

interface ContactFormData {
  name: string
  email: string
  subject: string
  category: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()
    const { name, email, subject, category, message } = body

    // Validate required fields
    if (!name || !email || !subject || !category || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Generate a temporary submission ID for logging
    const submissionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Try to store contact form submission in database (optional for now)
    let contactSubmission = null
    try {
      const { data, error: dbError } = await (supabase as any)
        .from('contact_submissions')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          category,
          message: message.trim(),
          user_id: user?.id || null,
          status: 'new',
          created_at: new Date().toISOString()
        } as any)
        .select()
        .single()

      if (dbError) {
        console.warn('Database table not found, continuing without database storage:', dbError.message)
        contactSubmission = { id: submissionId }
      } else {
        contactSubmission = data
      }
    } catch (error) {
      console.warn('Database error, continuing without database storage:', error)
      contactSubmission = { id: submissionId }
    }

    // Send email notification (if email service is configured)
    try {
      await sendContactEmail({
        name,
        email,
        subject,
        category,
        message,
        submissionId: contactSubmission.id,
        userId: user?.id
      })
      console.log('✅ Contact email sent successfully')
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError)
      // Don't fail the request if email fails, just log it
    }

    // Send auto-reply to user
    try {
      await sendAutoReplyEmail({ email, name })
      console.log('✅ Auto-reply email sent successfully')
    } catch (autoReplyError) {
      console.error('❌ Auto-reply email error:', autoReplyError)
      // Don't fail the request if auto-reply fails
    }

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      submissionId: contactSubmission.id
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

