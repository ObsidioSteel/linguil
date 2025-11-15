import { NextResponse } from 'next/server';
import { getDailyWordData } from '@/lib/game/data-service-server';

// This route handler fetches the daily word data and provides it to the client.
// It is called by the GamePageClient component to get the game data.
export async function GET() {
  try {
    // Retrieve the daily word data using the server-side data service.
    const dailyWordData = await getDailyWordData();
    // If no data is found for the current day, return a 404 Not Found response.
    if (!dailyWordData) {
      return NextResponse.json({ error: 'No daily word found' }, { status: 404 });
    }
    // If the data is successfully fetched, return it as a JSON response.
    return NextResponse.json(dailyWordData);
  } catch {
    // If any unexpected errors occur, log them on the server and return a 500 Internal Server Error response.
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}