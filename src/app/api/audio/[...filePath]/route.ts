import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Define the type for the route context, containing the dynamic parameters.
type RouteContext = {
  params: {
    filePath: string[];
  };
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { params } = context;
    const filePath = params.filePath.join('/');
    const bucket = admin.storage().bucket(); // Get default bucket
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse('File not found', { status: 404 });
    }

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'audio/mpeg';
    
    // Get a readable stream from the file
    const stream = file.createReadStream();

    // Convert Node.js stream to a Web Stream for the Next.js edge runtime
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error(`[API/AUDIO] Error proxying audio file: ${errorMessage}`);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}