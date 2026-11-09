import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = process.env.VERCEL
  ? '/tmp/room-rubato-data'
  : path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface StoredUserRecord {
  userId: string;
  pinHash?: string;
  updatedAt: string;
  completedCount: number;
  state: unknown;
}

function hashPin(pin: string): string {
  return crypto
    .createHash('sha256')
    .update(`${pin.trim()}:room-rubato-v2-salt`)
    .digest('hex');
}

/**
 * 개인정보(이메일, 전화번호, 주민번호 등) 입력 자동 감지 및 차단
 */
function validateSafePseudonym(userId: string): string | null {
  if (!userId || userId.length < 2 || userId.length > 20) {
    return '별칭은 2~20자 이내로 입력해 주세요.';
  }
  if (userId === '게스트') {
    return '기본 게스트 모드는 브라우저에만 저장됩니다. 나만의 별칭을 입력해 주세요.';
  }
  // 이메일 패턴 차단
  if (/@|\.(com|net|kr|org|io|co)\b/i.test(userId)) {
    return '개인정보 보호를 위해 이메일 주소는 별칭으로 사용할 수 없습니다.';
  }
  // 전화번호 / 생년월일 / 연속 숫자 6자리 이상 차단
  const digitsOnly = userId.replace(/\D/g, '');
  if (
    digitsOnly.length >= 6 ||
    /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/.test(userId)
  ) {
    return '개인정보 보호를 위해 전화번호나 생년월일이 포함된 별칭은 사용할 수 없습니다.';
  }
  return null;
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
  const pin = searchParams.get('pin')?.trim() || '';

  if (!userId || userId === '게스트') {
    return NextResponse.json({ user: null });
  }

  const piiError = validateSafePseudonym(userId);
  if (piiError) {
    return NextResponse.json({ error: piiError }, { status: 400 });
  }

  const db = readUsersDb();
  const record = db[userId] ?? null;

  if (!record) {
    return NextResponse.json({ user: null, isNewUser: true });
  }

  // 기존 저장된 방에 PIN 해시가 설정되어 있는 경우 PIN 일치 여부 검증
  if (record.pinHash) {
    if (!pin || hashPin(pin) !== record.pinHash) {
      return NextResponse.json(
        {
          error:
            '이미 사용 중인 별칭이거나 PIN 번호(4자리)가 일치하지 않습니다.',
          requiresPin: true,
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({
    user: {
      userId: record.userId,
      updatedAt: record.updatedAt,
      completedCount: record.completedCount,
      state: record.state,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    if (rawText.length > 250_000) {
      return NextResponse.json(
        { error: '데이터 크기가 허용 범위를 초과했습니다.' },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawText);
    const userId = String(body.userId || '').trim();
    const pin = String(body.pin || '').trim();
    const state = body.state;

    if (!userId || userId === '게스트' || !state) {
      return NextResponse.json({ ok: true, localOnly: true });
    }

    const piiError = validateSafePseudonym(userId);
    if (piiError) {
      return NextResponse.json({ error: piiError }, { status: 400 });
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN 번호는 숫자 4자리로 입력해 주세요.' },
        { status: 400 }
      );
    }

    const db = readUsersDb();
    const existing = db[userId];

    if (existing?.pinHash) {
      if (!pin || hashPin(pin) !== existing.pinHash) {
        return NextResponse.json(
          {
            error:
              '이미 사용 중인 별칭이거나 PIN 번호(4자리)가 일치하지 않습니다.',
          },
          { status: 403 }
        );
      }
    }

    const completedCount =
      state && typeof state === 'object' && 'completedDomains' in state
        ? Object.keys(
            (state as { completedDomains: Record<string, unknown> })
              .completedDomains || {}
          ).length
        : 0;

    db[userId] = {
      userId,
      pinHash: pin ? hashPin(pin) : existing?.pinHash,
      updatedAt: new Date().toISOString(),
      completedCount,
      state,
    };

    writeUsersDb(db);

    return NextResponse.json({
      ok: true,
      userId,
      completedCount,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
