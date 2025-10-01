import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const now = new Date()
    const londonTime = now.toLocaleString('en-GB', { timeZone: 'Europe/London' })
    
    // Test timezone conversion for 19:10 London time
    const reminderHour = 19
    const reminderMinute = 10
    
    // Create user's local time
    const userLocalTime = new Date()
    userLocalTime.setHours(reminderHour, reminderMinute, 0, 0)
    
    // Convert to UTC properly
    const reminderUtc = new Date(userLocalTime.getTime() - (userLocalTime.getTimezoneOffset() * 60000))
    
    // For London timezone, handle GMT/BST properly
    const isBST = now.getTimezoneOffset() < 0 // BST is UTC+1, GMT is UTC+0
    const offset = isBST ? 1 : 0
    reminderUtc.setUTCHours(reminderHour - offset, reminderMinute, 0, 0)
    
    return NextResponse.json({
      current_utc: now.toISOString(),
      current_london: londonTime,
      reminder_time: `${reminderHour}:${reminderMinute} London`,
      reminder_utc: reminderUtc.toISOString(),
      is_bst: isBST,
      offset: offset,
      current_hour: now.getUTCHours(),
      current_minute: now.getUTCMinutes(),
      reminder_hour: reminderUtc.getUTCHours(),
      reminder_minute: reminderUtc.getUTCMinutes(),
      time_diff_minutes: (reminderUtc.getTime() - now.getTime()) / (1000 * 60)
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
