import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

if (!admin.apps.length) {
  admin.initializeApp();
}

// This function handles updating a user's display name.
export async function POST(req: Request) {
  try {
    const { newName } = await req.json();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const uid = session.value;

    if (!newName || typeof newName !== 'string' || !newName.trim()) {
        return new NextResponse(JSON.stringify({ message: 'Invalid name provided' }), { status: 400 });
    }

    const db = admin.firestore();
    const userPublicRef = db.collection('users_public').doc(uid);

    await userPublicRef.update({ displayName: newName });

    return new NextResponse(JSON.stringify({ message: 'Name updated successfully' }), { status: 200 });

  } catch (error) {
    console.error('Update name error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return new NextResponse(JSON.stringify({ message: errorMessage }), { status: 500 });
  }
}