import { initializeStore, mutateUserState } from '@/lib/news/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { clusterId?: string; action?: string };
    if (!body.clusterId || !body.action) {
      return Response.json({ error: 'clusterId and action are required' }, { status: 400 });
    }
    await initializeStore();
    const state = await mutateUserState(body.clusterId, body.action);
    return Response.json({ state }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'State update failed' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
