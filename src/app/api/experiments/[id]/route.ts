'use server'

import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('PATCH /api/experiments/[id]:', params.id, body);
    
    return NextResponse.json({
      id: params.id,
      status: body.action === 'end' ? 'completed' : 'paused'
    });
  } catch (error) {
    console.error('PATCH /api/experiments/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


