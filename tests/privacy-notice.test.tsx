import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
import PrivacyPage from '../src/app/privacy/page';
it('separates survey reset, journals, backups and account deletion without claiming a complete policy', () => {
  const html = renderToStaticMarkup(<PrivacyPage />);
  expect(html).toContain('현재 앱에는 회원 탈퇴 기능이 없습니다');
  expect(html).toContain('백업까지 즉시 삭제한다는 의미는 아닙니다');
  expect(html).toContain('정식 개인정보 처리방침은 아직 확정되지 않았습니다');
  expect(html).toContain('계정에도 저장했다면');
  expect(html).toContain('로그인만으로 업로드하지 않으며');
});
