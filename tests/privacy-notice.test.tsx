import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
import PrivacyPage from '../src/app/privacy/page';
it('separates survey reset, journals, backups and account deletion without claiming a complete policy', () => {
  const html = renderToStaticMarkup(<PrivacyPage />);
  expect(html).toContain('현재 앱에는 회원 탈퇴 기능이 없습니다');
  expect(html).toContain('현재 탭에 보관');
  expect(html).toContain('탭을 닫은 뒤의 복구는 보장하지 않습니다');
  expect(html).toContain('로그아웃은 다른 계정의 임시 수정을 숨길 뿐');
  expect(html).toContain('백업까지 즉시 삭제한다는 의미는 아닙니다');
  expect(html).toContain('정식 개인정보 처리방침은 아직 확정되지 않았습니다');
  expect(html).toContain('계정에도 저장했다면');
  expect(html).toContain('오늘의 질문 선택과 추천 반응을 비웁니다');
  expect(html).toContain('로그인만으로 업로드하지 않으며');
  expect(html).toContain('서비스 연구·개선, 모델 학습이나 다른 이용자와의 통계 비교에 사용하지 않습니다');
  expect(html).toContain('mailto:sangmin5423@gmail.com');
  expect(html).toContain('성별·연령대·직군은 새로 입력받지 않습니다');
});

it('does not ask for unused demographic information or broad statistical consent', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync('src/components/Navbar.tsx', 'utf8');
  expect(source).not.toContain('GENDER_OPTIONS');
  expect(source).not.toContain('AGE_OPTIONS');
  expect(source).not.toContain('OCCUPATION_OPTIONS');
  expect(source).not.toContain('취향·통계 데이터 수집');
  expect(source).toContain('연구·서비스 개선에는 사용하지 않습니다');
});
