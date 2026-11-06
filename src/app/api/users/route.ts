import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL
  ? '/tmp/room-rubato-data'
  : path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface StoredUserRecord {
  userId: string;
  updatedAt: string;
  completedCount: number;
  state: unknown;
}

function readUsersDb(): Record<string, StoredUserRecord> {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as Record<string, StoredUserRecord>;
  } catch {
    return {};
  }
}

function writeUsersDb(db: Record<string, StoredUserRecord>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write users.json:', err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId')?.trim();
  const db = readUsersDb();

  if (userId) {
    const record = db[userId] ?? null;
    return NextResponse.json({
      user: record,
      usersList: Object.values(db).map((u) => ({
        userId: u.userId,
        updatedAt: u.updatedAt,
        completedCount: u.completedCount,
      })),
    });
  }

  return NextResponse.json({
    usersList: Object.values(db).map((u) => ({
      userId: u.userId,
      updatedAt: u.updatedAt,
      completedCount: u.completedCount,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId || '').trim();
    const state = body.state;

    if (!userId || !state) {
      return NextResponse.json(
        { error: 'userId and state are required' },
        { status: 400 }
      );
    }

    const db = readUsersDb();
    const completedCount =
      state && typeof state === 'object' && 'completedDomains' in state
        ? Object.keys((state as { completedDomains: Record<string, unknown> }).completedDomains || {}).length
        : 0;

    db[userId] = {
      userId,
      updatedAt: new Date().toISOString(),
      completedCount,
      state,
    };

    writeUsersDb(db);

    return NextResponse.json({
      ok: true,
      userId,
      usersList: Object.values(db).map((u) => ({
        userId: u.userId,
        updatedAt: u.updatedAt,
        completedCount: u.completedCount,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
