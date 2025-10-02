import { NextResponse } from 'next/server';
import { getTodayEntry } from '@/lib/db/mood';

export async function GET() {
  try {
    const entry = await getTodayEntry();
    
    return NextResponse.json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Error fetching today entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch today entry' },
      { status: 500 }
    );
  }
}
