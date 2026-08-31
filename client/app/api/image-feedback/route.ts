import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/image-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Feedback request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
