import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = process.env.VERCEL
  ? '/tmp/room-rubato-data'
  : path.join(process.cwd(), 'data');

// 1. 인증 금고 테이블 (해시된 이메일·비밀번호·세션 토큰만 격리 보관)
const AUTH_VAULT_FILE = path.join(DATA_DIR, 'auth_vault.json');
// 2. 비식별 취향 프로필 테이블 (이메일·이름 없이 오직 익명 UUID + 성별·연령대·직군 + 취향 응답만 보관)
const PERSONA_PROFILES_FILE = path.join(DATA_DIR, 'persona_profiles.json');

interface AuthVaultRecord {
  emailHash: string;
  maskedEmail: string;
  provider: 'google' | 'email';
  passwordHash?: string;
  sessionTokenHash: string;
  userUuid: string;
  consentAgreedAt: string;
  createdAt: string;
}

interface PersonaProfileRecord {
  userUuid: string;
  demographics?: {
    gender?: string;
    ageGroup?: string;
    occupation?: string;
  };
  completedCount: number;
  updatedAt: string;
  state: unknown;
}

function sha256(input: string): string {
  return crypto
    .createHash('sha256')
    .update(`${input}:room-rubato-v3-pepper`)
    .digest('hex');
}

function maskEmailAddress(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (!local || !domain) return 'user***';
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}***@${domain}`;
}

function readJsonFile<T>(filePath: string): Record<string, T> {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, T>;
  } catch {
    return {};
  }
}

function writeJsonFile<T>(filePath: string, data: Record<string, T>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write JSON file:', err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userUuid = searchParams.get('userUuid')?.trim() || '';
  const sessionToken = req.headers.get('x-session-token')?.trim() || '';

  if (!userUuid || !sessionToken) {
    return NextResponse.json({ user: null });
  }

  const vault = readJsonFile<AuthVaultRecord>(AUTH_VAULT_FILE);
  const authEntry = Object.values(vault).find((v) => v.userUuid === userUuid);

  if (!authEntry || authEntry.sessionTokenHash !== sha256(sessionToken)) {
    return NextResponse.json(
      { error: '세션이 만료되었거나 유효하지 않습니다.' },
      { status: 401 }
    );
  }

  const profiles = readJsonFile<PersonaProfileRecord>(PERSONA_PROFILES_FILE);
  const profile = profiles[userUuid] ?? null;

  return NextResponse.json({
    user: profile
      ? {
          userUuid: profile.userUuid,
          maskedEmail: authEntry.maskedEmail,
          provider: authEntry.provider,
          updatedAt: profile.updatedAt,
          completedCount: profile.completedCount,
          state: profile.state,
        }
      : null,
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
    const action = body.action || 'sync';

    // ACTION 1: 로그인 / 회원가입 (Google OAuth 시뮬레이션 또는 이메일+비밀번호 인증)
    if (action === 'auth') {
      const provider: 'google' | 'email' =
        body.provider === 'google' ? 'google' : 'email';
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');
      const consentAgreed = Boolean(body.consentAgreed);
      const initialState = body.state;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: '올바른 이메일 주소를 입력해 주세요.' },
          { status: 400 }
        );
      }

      if (provider === 'email' && password.length < 6) {
        return NextResponse.json(
          { error: '비밀번호는 6자 이상으로 입력해 주세요.' },
          { status: 400 }
        );
      }

      const emailHash = sha256(email);
      const vault = readJsonFile<AuthVaultRecord>(AUTH_VAULT_FILE);
      const profiles = readJsonFile<PersonaProfileRecord>(PERSONA_PROFILES_FILE);
      const existingAuth = vault[emailHash];

      // 이미 가입된 계정인 경우 -> 로그인 처리
      if (existingAuth) {
        if (
          provider === 'email' &&
          existingAuth.passwordHash &&
          existingAuth.passwordHash !== sha256(`pw:${emailHash}:${password}`)
        ) {
          return NextResponse.json(
            { error: '이메일 또는 비밀번호가 일치하지 않습니다.' },
            { status: 403 }
          );
        }

        const newSessionToken = crypto.randomBytes(24).toString('hex');
        existingAuth.sessionTokenHash = sha256(newSessionToken);
        vault[emailHash] = existingAuth;
        writeJsonFile(AUTH_VAULT_FILE, vault);

        const existingProfile = profiles[existingAuth.userUuid] ?? null;

        return NextResponse.json({
          ok: true,
          isNewUser: false,
          userUuid: existingAuth.userUuid,
          maskedEmail: existingAuth.maskedEmail,
          provider: existingAuth.provider,
          sessionToken: newSessionToken,
          state: existingProfile?.state ?? null,
        });
      }

      // 신규 가입인 경우 -> 필수 동의 확인
      if (!consentAgreed) {
        return NextResponse.json(
          {
            error:
              '최초 가입 시 [개인정보 및 비식별 취향 데이터 수집·이용 동의]에 체크해 주세요.',
            requiresConsent: true,
          },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const userUuid = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const sessionToken = crypto.randomBytes(24).toString('hex');

      vault[emailHash] = {
        emailHash,
        maskedEmail: maskEmailAddress(email),
        provider,
        passwordHash:
          provider === 'email'
            ? sha256(`pw:${emailHash}:${password}`)
            : undefined,
        sessionTokenHash: sha256(sessionToken),
        userUuid,
        consentAgreedAt: now,
        createdAt: now,
      };
      writeJsonFile(AUTH_VAULT_FILE, vault);

      if (initialState && typeof initialState === 'object') {
        const completedCount =
          'completedDomains' in initialState
            ? Object.keys(
                (initialState as { completedDomains: Record<string, unknown> })
                  .completedDomains || {}
              ).length
            : 0;

        profiles[userUuid] = {
          userUuid,
          demographics: (
            initialState as { demographics?: PersonaProfileRecord['demographics'] }
          ).demographics,
          completedCount,
          updatedAt: now,
          state: initialState,
        };
        writeJsonFile(PERSONA_PROFILES_FILE, profiles);
      }

      return NextResponse.json({
        ok: true,
        isNewUser: true,
        userUuid,
        maskedEmail: maskEmailAddress(email),
        provider,
        sessionToken,
        state: initialState ?? null,
      });
    }

    // ACTION 2: 로그인된 사용자의 비식별 취향 프로필(UUID 기반) 동기화
    const userUuid = String(body.userUuid || '').trim();
    const sessionToken = String(body.sessionToken || '').trim();
    const state = body.state;

    if (!userUuid || !sessionToken || !state) {
      return NextResponse.json({ ok: true, localOnly: true });
    }

    const vault = readJsonFile<AuthVaultRecord>(AUTH_VAULT_FILE);
    const authEntry = Object.values(vault).find((v) => v.userUuid === userUuid);

    if (!authEntry || authEntry.sessionTokenHash !== sha256(sessionToken)) {
      return NextResponse.json(
        { error: '인증 세션이 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    const profiles = readJsonFile<PersonaProfileRecord>(PERSONA_PROFILES_FILE);
    const completedCount =
      state && typeof state === 'object' && 'completedDomains' in state
        ? Object.keys(
            (state as { completedDomains: Record<string, unknown> })
              .completedDomains || {}
          ).length
        : 0;

    profiles[userUuid] = {
      userUuid,
      demographics: (
        state as { demographics?: PersonaProfileRecord['demographics'] }
      ).demographics,
      completedCount,
      updatedAt: new Date().toISOString(),
      state,
    };

    writeJsonFile(PERSONA_PROFILES_FILE, profiles);

    return NextResponse.json({
      ok: true,
      userUuid,
      completedCount,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// ACTION 3: 회원 탈퇴 및 내 데이터 즉시 영구 파기 (개인정보보호법 파기 요구권 보장)
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const userUuid = String(body.userUuid || '').trim();
    const sessionToken = String(body.sessionToken || '').trim();

    if (!userUuid || !sessionToken) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const vault = readJsonFile<AuthVaultRecord>(AUTH_VAULT_FILE);
    const entryPair = Object.entries(vault).find(
      ([, v]) => v.userUuid === userUuid
    );

    if (!entryPair || entryPair[1].sessionTokenHash !== sha256(sessionToken)) {
      return NextResponse.json(
        { error: '인증 정보가 일치하지 않습니다.' },
        { status: 403 }
      );
    }

    delete vault[entryPair[0]];
    writeJsonFile(AUTH_VAULT_FILE, vault);

    const profiles = readJsonFile<PersonaProfileRecord>(PERSONA_PROFILES_FILE);
    delete profiles[userUuid];
    writeJsonFile(PERSONA_PROFILES_FILE, profiles);

    return NextResponse.json({ ok: true, deletedUuid: userUuid });
  } catch {
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 400 });
  }
}
