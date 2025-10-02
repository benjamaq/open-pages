import { NextRequest, NextResponse } from 'next/server';
import { getMonthData } from '@/lib/db/mood';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month parameter is required' },
        { status: 400 }
      );
    }
    
    const data = await getMonthData(month);
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching month data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch month data' },
      { status: 500 }
    );
  }
}
