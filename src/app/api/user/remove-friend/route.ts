import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export async function POST(req: Request) {
  try {
    const { friendUid } = await req.json();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const uid = session.value;

    if (!friendUid || typeof friendUid !== 'string') {
        return new NextResponse(JSON.stringify({ message: 'Invalid friend UID provided' }), { status: 400 });
    }

    const userDocRef = db.collection('users').doc(uid);

    // Remove friend from the user's friend list
    await userDocRef.update({
        friends: admin.firestore.FieldValue.arrayRemove(friendUid)
    });

    return new NextResponse(JSON.stringify({ message: 'Friend removed successfully' }), { status: 200 });

  } catch (error) {
    console.error('Remove friend error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return new NextResponse(JSON.stringify({ message: errorMessage }), { status: 500 });
  }
}