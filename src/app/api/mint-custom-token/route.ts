import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase/firebase-admin';

export async function POST(req: Request) {
  await initializeFirebaseAdmin();
  const { uid } = await req.json();
  const customToken = await getAuth().createCustomToken(uid);
  return new Response(JSON.stringify({ customToken }), {
    headers: { 'Content-Type': 'application/json' },
  });
}