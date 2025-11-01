import { Resend } from 'resend'

// Initialize Resend client lazily
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface DailyReminderData {
  userName: string
  userEmail: string
  supplements: Array<{
    name: string
    dose?: string
    timing?: string
  }>
  protocols: Array<{
    name: string
    frequency?: string
  }>
  movement: Array<{
    name: string
    duration?: string
  }>
  mindfulness: Array<{
    name: string
    duration?: string
  }>
  profileUrl: string
  unsubscribeUrl: string
}

export interface MissedItemsData {
  userName: string
  userEmail: string
  missedItems: Array<{
    name: string
    type: 'supplement' | 'protocol' | 'movement' | 'mindfulness'
    lastCompleted?: string
  }>
  profileUrl: string
  unsubscribeUrl: string
}

export interface WeeklySummaryData {
  userName: string
  userEmail: string
  weekStart: string
  weekEnd: string
  stats: {
    totalItems: number
    completedItems: number
    completionRate: number
    streakDays: number
    newItemsAdded: number
  }
  topCategories: Array<{
    category: string
    count: number
    completionRate: number
  }>
  recentActivity: Array<{
    date: string
    action: string
    itemName: string
    category: string
  }>
  profileUrl: string
  unsubscribeUrl: string
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Debug: Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return { success: false, error: 'RESEND_API_KEY environment variable is not configured' }
    }

    const resendClient = getResendClient()
    
    const computedDomainFrom = process.env.RESEND_DOMAIN ? `BioStackr <noreply@${process.env.RESEND_DOMAIN}>` : undefined
    const fromAddress = data.from || process.env.RESEND_FROM || computedDomainFrom || 'Biostackr <notifications@biostackr.io>'
    const replyTo = data.replyTo
    console.log('Sending email to:', data.to)
    console.log('From:', fromAddress)
    if (replyTo) console.log('Reply-To:', replyTo)
    console.log('Subject:', data.subject)
    
    const result = await resendClient.emails.send({
      from: fromAddress,
      to: data.to,
      subject: data.subject,
      html: data.html,
      // Resend SDK expects `reply_to`, not `replyTo`
      ...(replyTo ? { reply_to: replyTo } : {})
    })

    console.log('Resend API response:', result)

    if (result.error) {
      console.error('Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendDailyReminder(data: DailyReminderData): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = generateDailyReminderHTML(data)
  
  return sendEmail({
    to: data.userEmail,
    subject: `Your Daily Biostackr Reminder - ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })}`,
    html
  })
}

export async function sendMissedItemsReminder(data: MissedItemsData): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = generateMissedItemsHTML(data)
  
  return sendEmail({
    to: data.userEmail,
    subject: `Don't forget your Biostackr routine - ${data.missedItems.length} items pending`,
    html
  })
}

export async function sendNewFollowerNotification(ownerEmail: string, ownerName: string, totalFollowers: number): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = generateNewFollowerHTML({ ownerName, totalFollowers })
  
  return sendEmail({
    to: ownerEmail,
    subject: 'You have a new follower on Biostackr 🎉',
    html,
    from: 'Biostackr <notifications@biostackr.io>'
  })
}

export async function sendWeeklySummary(data: WeeklySummaryData): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = generateWeeklySummaryHTML(data)
  
  return sendEmail({
    to: data.userEmail,
    subject: `Your Biostackr Weekly Summary - ${data.weekStart} to ${data.weekEnd}`,
    html
  })
}

export async function sendWelcomeEmail(followerEmail: string, ownerName: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = generateWelcomeEmailHTML(ownerName)
  
  return sendEmail({
    to: followerEmail,
    subject: `Welcome to BioStackr! You're now following ${ownerName}'s stack`,
    html,
    from: 'Biostackr <notifications@biostackr.io>'
  })
}

export async function sendDay2TipsEmail(params: { userEmail: string; userName: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = generateDay2TipsHTML({ userName: params.userName })
  const fromAddress = process.env.RESEND_FROM || 'Biostackr <notifications@biostackr.io>'
  const replyTo = process.env.REPLY_TO_EMAIL || process.env.SUPPORT_EMAIL || undefined
  return sendEmail({
    to: params.userEmail,
    subject: 'Day 2: You’re doing great — tips to unlock insights faster',
    html,
    from: fromAddress,
    ...(replyTo ? { replyTo } : {})
  })
}

function generateDay2TipsHTML({ userName }: { userName: string }) {
  const safeName = (userName || '').trim() || 'there'
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
    <div style="text-align:center; margin-bottom: 16px;">
      <div style="font-size: 24px; font-weight: 700;">Hi ${safeName} 👋</div>
      <div style="font-size: 16px; color:#4b5563; margin-top:8px;">Thanks for joining BioStackr — it means a lot.</div>
      <div style="font-size: 14px; color:#6b7280; margin-top:6px;">I built this for my mum, so everything here is about finding what actually helps — with kindness and rigor.</div>
      <div style="font-size: 16px; color:#374151; margin-top:10px;">You’re doing great. Here are a few tips to unlock insights faster.</div>
    </div>

        <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:16px;">
          <div style="font-weight:600; margin-bottom:6px;">What works:</div>
          <ul style="margin:0 0 0 18px; padding:0; color:#374151;">
            <li>Check in daily (pain, mood, sleep)</li>
            <li>Select 2–3 lifestyle tags (e.g., caffeine, exercise, supplements)</li>
            <li>Add quick notes or symptoms when relevant</li>
          </ul>
        </div>

        <div style="margin: 18px 0;">
          <div style="font-weight:700; margin-bottom:8px;">Real examples</div>
          <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; padding:12px; margin-bottom:10px;">
            <div style="font-weight:600">Jenny</div>
            <div style="font-size:14px; color:#374151;">Checked in for 5 days and found that late caffeine pushed her pain up by ~3 points the next day.</div>
          </div>
          <div style="background:#ecfeff; border:1px solid #a5f3fc; border-radius:10px; padding:12px; margin-bottom:10px;">
            <div style="font-weight:600">Mike</div>
            <div style="font-size:14px; color:#374151;">Tracked for 7 days and saw that getting 7–8/10 sleep quality lifted his mood from 4 → 6 most days.</div>
          </div>
          <div style="background:#fef9c3; border:1px solid #fde68a; border-radius:10px; padding:12px;">
            <div style="font-weight:600">Priya</div>
            <div style="font-size:14px; color:#374151;">Logged symptoms for a week and spotted that fast food days correlated with more brain fog the next morning.</div>
          </div>
        </div>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px;">
          <div style="font-weight:700;">Pro tip</div>
          <div style="font-size:14px; color:#065f46;">The more you track (especially lifestyle tags), the faster Elli can surface confident patterns. Even quick, 10-second check-ins help a lot.</div>
        </div>

        <div style="text-align:center; margin-top:20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dash" style="display:inline-block; background:#111827; color:#fff; padding:10px 16px; border-radius:10px; text-decoration:none; font-weight:600;">Open your dashboard</a>
        </div>

        <div style="margin-top:24px; font-size:12px; color:#6b7280; text-align:center;">You’re receiving this because you created a Biostackr account. Manage notifications in settings.</div>
      </div>
    </div>
  `
}

function generateDailyReminderHTML(data: DailyReminderData): string {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Daily Biostackr Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; margin-bottom: 24px; }
        .section { margin-bottom: 32px; }
        .section h2 { color: #2d3748; font-size: 20px; margin-bottom: 16px; }
        .item-list { background: #f7fafc; border-radius: 8px; padding: 16px; }
        .item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .item:last-child { border-bottom: none; }
        .item-name { font-weight: 600; color: #2d3748; }
        .item-details { font-size: 14px; color: #718096; }
        .cta { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; }
        .footer a { color: #667eea; text-decoration: none; }
        .empty-state { text-align: center; color: #718096; font-style: italic; padding: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Biostackr</h1>
          <p>Your Daily Health Reminder</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            ${(require('@/lib/utils/greetings').getGreeting())}, ${data.userName}!<br>
            Here's your health routine for <strong>${today}</strong>
          </div>

          ${data.supplements.length > 0 ? `
          <div class="section">
            <h2>
              Supplements (${data.supplements.length})
            </h2>
            <div class="item-list">
              ${data.supplements.map(item => `
                <div class="item">
                  <div>
                    <div class="item-name">${item.name}</div>
                    ${item.dose ? `<div class="item-details">${item.dose}${item.timing ? ` • ${item.timing}` : ''}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${data.protocols.length > 0 ? `
          <div class="section">
            <h2>
              Protocols (${data.protocols.length})
            </h2>
            <div class="item-list">
              ${data.protocols.map(item => `
                <div class="item">
                  <div>
                    <div class="item-name">${item.name}</div>
                    ${item.frequency ? `<div class="item-details">${item.frequency}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${data.movement.length > 0 ? `
          <div class="section">
            <h2>
              Movement (${data.movement.length})
            </h2>
            <div class="item-list">
              ${data.movement.map(item => `
                <div class="item">
                  <div>
                    <div class="item-name">${item.name}</div>
                    ${item.duration ? `<div class="item-details">${item.duration}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${data.mindfulness.length > 0 ? `
          <div class="section">
            <h2>
              Mindfulness (${data.mindfulness.length})
            </h2>
            <div class="item-list">
              ${data.mindfulness.map(item => `
                <div class="item">
                  <div>
                    <div class="item-name">${item.name}</div>
                    ${item.duration ? `<div class="item-details">${item.duration}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${data.supplements.length === 0 && data.protocols.length === 0 && data.movement.length === 0 && data.mindfulness.length === 0 ? `
            <div class="empty-state">
              No items scheduled for today. Visit your dashboard to add some!
            </div>
          ` : ''}

          <div class="cta">
            <a href="${data.profileUrl}" class="cta-button">
              Open Dashboard →
            </a>
          </div>
        </div>

        <div class="footer">
          <p>
            Sent by <strong>Biostackr</strong> • 
            <a href="${data.unsubscribeUrl}">Unsubscribe</a>
          </p>
          <p style="margin-top: 16px; font-size: 12px;">
            This email was sent to ${data.userEmail}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateNewFollowerHTML({ ownerName, totalFollowers }: { ownerName: string; totalFollowers: number }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You have a new follower - Biostackr</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; margin-bottom: 24px; }
        .stats-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; }
        .stats-number { font-size: 32px; font-weight: 700; color: #059669; margin-bottom: 8px; }
        .stats-label { color: #065f46; font-weight: 500; }
        .cta { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; }
        .footer a { color: #059669; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 New Follower!</h1>
          <p>Someone just followed your stack</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hi ${ownerName},<br><br>
            Great news! Someone just started following your health stack on Biostackr.
          </div>

          <div class="stats-box">
            <div class="stats-number">${totalFollowers}</div>
            <div class="stats-label">Total Followers</div>
          </div>

          <p style="color: #4a5568; margin-bottom: 24px;">
            Your followers will receive weekly email updates when you make changes to your public supplements, protocols, and routines. Keep sharing your health journey!
          </p>

          <div class="cta">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dash/followers" class="cta-button">
              View Followers →
            </a>
          </div>
        </div>

        <div class="footer">
          <p>
            Sent by <strong>Biostackr</strong> • 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dash/settings">Manage Settings</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateMissedItemsHTML(data: MissedItemsData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Biostackr Reminder - Items Pending</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; margin-bottom: 24px; }
        .missed-items { background: #fef5e7; border: 1px solid #f6ad55; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .missed-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fed7aa; }
        .missed-item:last-child { border-bottom: none; }
        .item-name { font-weight: 600; color: #2d3748; }
        .item-type { font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
        .item-last { font-size: 14px; color: #718096; }
        .cta { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: #f5576c; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; }
        .footer a { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Gentle Reminder</h1>
          <p>You have ${data.missedItems.length} pending items</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hi ${data.userName},<br>
            Don't forget about these items in your health routine:
          </div>

          <div class="missed-items">
            ${data.missedItems.map(item => `
              <div class="missed-item">
                <div>
                  <div class="item-name">${item.name}</div>
                  <div class="item-type">${item.type}</div>
                </div>
                ${item.lastCompleted ? `<div class="item-last">Last: ${item.lastCompleted}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="cta">
            <a href="${data.profileUrl}" class="cta-button">
              Complete Now →
            </a>
          </div>
        </div>

        <div class="footer">
          <p>
            Sent by <strong>Biostackr</strong> • 
            <a href="${data.unsubscribeUrl}">Unsubscribe</a>
          </p>
          <p style="margin-top: 16px; font-size: 12px;">
            This email was sent to ${data.userEmail}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateWeeklySummaryHTML(data: WeeklySummaryData): string {
  const completionPercentage = Math.round(data.stats.completionRate)
  const streakText = data.stats.streakDays === 1 ? 'day' : 'days'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Biostackr Weekly Summary</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; margin-bottom: 24px; }
        .week-range { background: #f7fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; color: #4a5568; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #f7fafc; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: 700; color: #2d3748; margin-bottom: 8px; }
        .stat-label { color: #718096; font-weight: 500; font-size: 14px; }
        .completion-rate { color: #059669; }
        .streak { color: #d69e2e; }
        .new-items { color: #667eea; }
        .section { margin-bottom: 32px; }
        .section h2 { color: #2d3748; font-size: 20px; margin-bottom: 16px; display: flex; align-items: center; }
        .section-icon { width: 24px; height: 24px; margin-right: 12px; }
        .category-list { background: #f7fafc; border-radius: 8px; padding: 16px; }
        .category-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .category-item:last-child { border-bottom: none; }
        .category-name { font-weight: 600; color: #2d3748; }
        .category-stats { font-size: 14px; color: #718096; }
        .activity-list { background: #f7fafc; border-radius: 8px; padding: 16px; }
        .activity-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .activity-item:last-child { border-bottom: none; }
        .activity-action { font-weight: 600; color: #2d3748; }
        .activity-details { font-size: 14px; color: #718096; }
        .cta { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; }
        .footer a { color: #667eea; text-decoration: none; }
        .empty-state { text-align: center; color: #718096; font-style: italic; padding: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Weekly Summary</h1>
          <p>Your Biostackr progress this week</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hi ${data.userName}! 👋<br>
            Here's how you did this week:
          </div>

          <div class="week-range">
            <strong>${data.weekStart}</strong> to <strong>${data.weekEnd}</strong>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number completion-rate">${completionPercentage}%</div>
              <div class="stat-label">Completion Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-number streak">${data.stats.streakDays}</div>
              <div class="stat-label">Day Streak</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.stats.completedItems}</div>
              <div class="stat-label">Items Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number new-items">${data.stats.newItemsAdded}</div>
              <div class="stat-label">New Items Added</div>
            </div>
          </div>

          ${data.topCategories.length > 0 ? `
          <div class="section">
            <h2>
              Top Categories
            </h2>
            <div class="category-list">
              ${data.topCategories.map(category => `
                <div class="category-item">
                  <div>
                    <div class="category-name">${category.category}</div>
                    <div class="category-stats">${category.count} items • ${Math.round(category.completionRate)}% completion</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${data.recentActivity.length > 0 ? `
          <div class="section">
            <h2>
              Recent Activity
            </h2>
            <div class="activity-list">
              ${data.recentActivity.map(activity => `
                <div class="activity-item">
                  <div>
                    <div class="activity-action">${activity.action}</div>
                    <div class="activity-details">${activity.itemName} • ${activity.category}</div>
                  </div>
                  <div class="activity-details">${activity.date}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="cta">
            <a href="${data.profileUrl}" class="cta-button">
              View Full Dashboard →
            </a>
          </div>
        </div>

        <div class="footer">
          <p>
            Sent by <strong>Biostackr</strong> • 
            <a href="${data.unsubscribeUrl}">Unsubscribe</a>
          </p>
          <p style="margin-top: 16px; font-size: 12px;">
            This email was sent to ${data.userEmail}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateWelcomeEmailHTML(ownerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to BioStackr!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #1a202c 0%, #4c1d95 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; margin-bottom: 24px; color: #2d3748; }
        .welcome-box { background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
        .expectations { background: #f7fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .expectations h3 { color: #1a202c; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; }
        .expectations ul { color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6; }
        .cta { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: #1a202c; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s; }
        .cta-button:hover { background: #2d3748; transform: translateY(-1px); }
        .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; }
        .footer a { color: #4c1d95; text-decoration: none; font-weight: 500; }
        .brand-highlight { color: #4c1d95; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BioStackr!</h1>
          <p>Thanks for following ${ownerName}'s health stack</p>
        </div>
        
        <div class="content">
          <div class="welcome-box">
            <h2 style="color: #1a202c; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
              You're all set!
            </h2>
            <p style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6;">
              You'll now receive weekly updates when ${ownerName} makes changes to their public health stack. 
              Stay informed about their latest supplements, protocols, and wellness practices.
            </p>
          </div>

          <div class="expectations">
            <h3>What to expect:</h3>
            <ul>
              <li>Weekly digest emails with stack updates</li>
              <li>Notifications when new items are added</li>
              <li>Insights into their wellness journey</li>
              <li>Easy unsubscribe option in every email</li>
            </ul>
          </div>

          <div class="cta">
            <a href="https://www.biostackr.io" class="cta-button">
              Create Your Own Stack
            </a>
          </div>
        </div>

        <div class="footer">
          <p>
            This email was sent because you followed ${ownerName}'s stack on BioStackr.
          </p>
          <p style="margin-top: 16px; font-size: 12px;">
            <a href="https://www.biostackr.io/unsubscribe">Unsubscribe</a> | 
            <a href="https://www.biostackr.io">BioStackr</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export { getResendClient as default }
