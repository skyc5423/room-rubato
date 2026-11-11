import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ store: {} as any }));
vi.mock('next/navigation', () => ({ usePathname: () => '/notes' }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock('../src/lib/persona-store', () => ({ usePersonaStore: () => fixture.store }));
import { Navbar } from '../src/components/Navbar';

let view: ReactTestRenderer;
const openPanel = () => {
  act(() => { view = create(<Navbar />); });
  act(() => view.root.findByProps({ 'aria-controls': 'account-panel' }).props.onClick());
};
const text = () => JSON.stringify(view.toJSON());
beforeEach(() => {
  vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  fixture.store = {
    state: { completedDomains: {}, demographics: { gender: 'female', ageGroup: '30s_early', occupation: 'design_art' } },
    isHydrated: true, authUser: null,
    loginWithGoogle: vi.fn().mockResolvedValue({ ok: true }),
    loginWithEmail: vi.fn().mockResolvedValue({ ok: true }),
    updateDemographics: vi.fn(), deletePersonaData: vi.fn(), logoutToGuest: vi.fn(),
  };
});
afterEach(() => { if (view) act(() => view.unmount()); vi.unstubAllGlobals(); });

it('offers no new demographic inputs while preserving existing profile data', () => {
  const before = JSON.stringify(fixture.store.state);
  openPanel();
  expect(view.root.findAllByType('select')).toHaveLength(0);
  expect(text()).toContain('연구·서비스 개선에는 사용하지 않습니다');
  expect(fixture.store.updateDemographics).not.toHaveBeenCalled();
  expect(JSON.stringify(fixture.store.state)).toBe(before);
});

it('keeps Google consent explicit and narrows the displayed purpose', async () => {
  openPanel();
  expect(view.root.findByProps({ type: 'checkbox' }).props.checked).toBe(false);
  expect(text()).toContain('본인의 기록 저장·복원과 취향 요약');
  await act(async () => { await view.root.findByType('form').props.onSubmit({ preventDefault: vi.fn() }); });
  expect(fixture.store.loginWithGoogle).not.toHaveBeenCalled();
  act(() => view.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: true } }));
  await act(async () => { await view.root.findByType('form').props.onSubmit({ preventDefault: vi.fn() }); });
  expect(fixture.store.loginWithGoogle).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ consentAgreed: true }));
});

it('opens the privacy guide without leaving an account dialog over the destination', () => {
  openPanel();
  act(() => view.root.findAllByType('a').find(link => link.props.href === '/privacy')!.props.onClick());
  expect(view.root.findAllByProps({ role: 'dialog' })).toHaveLength(0);
  expect(fixture.store.deletePersonaData).not.toHaveBeenCalled();
});

it('preserves the logged-in reset boundary without asking for demographics', () => {
  fixture.store.authUser = { userUuid: 'test-owner', provider: 'google', maskedEmail: 't***@example.com' };
  openPanel();
  expect(view.root.findAllByType('select')).toHaveLength(0);
  const reset = view.root.findAllByType('button').find(button => button.children.join('') === '설문 프로필 초기화')!;
  act(() => reset.props.onClick());
  expect(text()).toContain('로그인 계정, 동의 기록, 관찰실 기록은 지워지지 않습니다');
  expect(fixture.store.deletePersonaData).not.toHaveBeenCalled();
});
