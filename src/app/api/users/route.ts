import { NextResponse } from 'next/server';

// The former file-backed demo auth trusted unverified Google email addresses.
// Never enable it in any environment; accounts must use verified Supabase Auth.
function disabled() {
  return NextResponse.json({ error: 'Legacy authentication is disabled. Use Supabase Auth.' }, { status: 410 });
}
export const GET = disabled;
export const POST = disabled;
export const DELETE = disabled;
