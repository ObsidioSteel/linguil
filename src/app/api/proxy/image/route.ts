import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');

    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours.
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}