'use server'

import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params
    console.log('PATCH /api/experiments/[id]:', id, body);
    
    return NextResponse.json({
      id,
      status: body.action === 'end' ? 'completed' : 'paused'
    });
  } catch (error) {
    console.error('PATCH /api/experiments/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


