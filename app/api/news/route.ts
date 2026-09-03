import { buildNewsResponse } from '@/lib/news/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    const response = await buildNewsResponse(force);
    return Response.json(response, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Signal Desk could not build the story inbox.',
        detail: error instanceof Error ? error.message : 'Unknown server failure',
      },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
