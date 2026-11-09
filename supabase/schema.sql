-- =============================================================================
-- Room Rubato — Privacy-First Persona DB Schema (Supabase PostgreSQL)
-- 설계 원칙:
-- 1. 로그인 식별정보(이메일, OAuth 토큰)는 Supabase 보안 영역(auth.users)에만 격리 보관
-- 2. 실제 취향 분석 테이블(public.persona_profiles)에는 이메일·실명·전화번호 칼럼을 아예 두지 않고,
--    익명 고유 식별자(user_id UUID) + 비식별 통계 속성(성별·연령대·직군) + 취향 응답 JSONB만 저장
-- 3. 회원 탈퇴(auth.users 삭제) 시 ON DELETE CASCADE로 취향 데이터 즉시 영구 파기
-- =============================================================================

create table if not exists public.persona_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gender text default 'unspecified' check (gender in ('female', 'male', 'other', 'unspecified')),
  age_group text default 'unspecified' check (age_group in ('10s', '20s_early', '20s_late', '30s_early', '30s_late', '40s', '50s_plus', 'unspecified')),
  occupation text default 'unspecified' check (occupation in ('tech_product', 'design_art', 'business_office', 'research_edu', 'freelance_creator', 'other', 'unspecified')),
  completed_count integer not null default 0,
  state jsonb not null default '{}'::jsonb,
  consent_agreed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security (RLS) 활성화: 오직 로그인한 본인(auth.uid() = user_id)만 조회·수정·삭제 가능
alter table public.persona_profiles enable row level security;

create policy "Users can view own persona profile"
  on public.persona_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own persona profile"
  on public.persona_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own persona profile"
  on public.persona_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own persona profile"
  on public.persona_profiles for delete
  using (auth.uid() = user_id);
