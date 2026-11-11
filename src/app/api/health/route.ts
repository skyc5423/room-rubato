// Liveness only. No user data, credentials, dependency URLs or DB probes.
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json(
    { status: 'ok', service: 'room-rubato', check: 'liveness' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
