import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ store: {} as any, path: '/notes' }));
vi.mock('next/navigation', () => ({ usePathname: () => fixture.path }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock('../src/lib/persona-store', () => ({ usePersonaStore: () => fixture.store }));
import { Navbar } from '../src/components/Navbar';

let view: ReactTestRenderer;
const listeners = new Map<string, (event: any) => void>();
class ElementFixture { contains() { return false; } focus() {} querySelector() { return this; } querySelectorAll() { return []; } }
const localWrite = vi.fn(), sessionWrite = vi.fn();
const button = (text: string) => view.root.findAllByType('button').find(node => node.children.join('') === text)!;
const open = () => act(() => view.root.findByProps({ 'aria-controls': 'account-panel' }).props.onClick());
const email = () => act(() => button('이메일 로그인').props.onClick());
const password = () => view.root.findByProps({ id: 'account-password' });
const typePassword = (value = 'synthetic-only-secret') => act(() => password().props.onChange({ target: { value } }));
const submit = () => view.root.findByType('form').props.onSubmit({ preventDefault: vi.fn() }) as Promise<void>;
const consent = () => act(() => view.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: true } }));
const deferred = () => { let resolve!: (value: any) => void; let reject!: (reason: unknown) => void; const promise = new Promise<any>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

beforeEach(() => {
  fixture.path = '/notes'; listeners.clear(); localWrite.mockClear(); sessionWrite.mockClear();
  vi.stubGlobal('Node', ElementFixture);
  vi.stubGlobal('document', { addEventListener: (type: string, fn: any) => listeners.set(type, fn), removeEventListener: (type: string) => listeners.delete(type) });
  vi.stubGlobal('localStorage', { setItem: localWrite }); vi.stubGlobal('sessionStorage', { setItem: sessionWrite });
  fixture.store = { state: { completedDomains: {} }, isHydrated: true, authUser: null,
    loginWithEmail: vi.fn().mockResolvedValue({ ok: false, error: 'synthetic failure' }),
    loginWithGoogle: vi.fn().mockResolvedValue({ ok: true }),
  };
  act(() => { view = create(<Navbar/>, { createNodeMock: () => new ElementFixture() }); });
  open(); email(); typePassword();
});
afterEach(() => {
  if (view) act(() => view.unmount());
  expect(localWrite).not.toHaveBeenCalled(); expect(sessionWrite).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it.each(['close', 'toggle', 'escape', 'outside', 'privacy link', 'route exit'])('clears the app-held secret on %s and does not authenticate', (path) => {
  act(() => {
    if (path === 'close') button('닫기 ✕').props.onClick();
    if (path === 'toggle') view.root.findByProps({ 'aria-controls': 'account-panel' }).props.onClick();
    if (path === 'escape') listeners.get('keydown')!({ key: 'Escape' });
    if (path === 'outside') listeners.get('pointerdown')!({ target: new ElementFixture() });
    if (path === 'privacy link') view.root.findAllByType('a').find(node => node.props.href === '/privacy')!.props.onClick();
    if (path === 'route exit') { fixture.path = '/compare'; view.update(<Navbar/>); }
  });
  expect(view.root.findAllByProps({ id: 'account-panel' })).toHaveLength(0);
  open();
  expect(password().props.value).toBe('');
  expect(fixture.store.loginWithEmail).not.toHaveBeenCalled(); expect(fixture.store.loginWithGoogle).not.toHaveBeenCalled();
});
it('clears when leaving email for Google without transmitting either form', () => {
  act(() => view.root.findAllByType('button').find(node => node.findAllByType('span').some(span => span.children.join('') === 'Google 로그인'))!.props.onClick());
  email(); expect(password().props.value).toBe('');
  expect(fixture.store.loginWithEmail).not.toHaveBeenCalled(); expect(fixture.store.loginWithGoogle).not.toHaveBeenCalled();
});
it('clears on a verified owner change and does not revive the secret when returning to guest', () => {
  act(() => { fixture.store.authUser = { userUuid: 'synthetic-owner', maskedEmail: 's***@example.com', provider: 'google' }; view.update(<Navbar/>); });
  act(() => { fixture.store.authUser = null; view.update(<Navbar/>); });
  expect(password().props.value).toBe('');
});
it('preserves an actively open failed attempt for immediate retry, then clears it on dismissal', async () => {
  consent(); await act(submit);
  expect(password().props.value).toBe('synthetic-only-secret');
  expect(JSON.stringify(view.toJSON())).toContain('synthetic failure');
  act(() => button('닫기 ✕').props.onClick()); open();
  expect(password().props.value).toBe('');
  expect(JSON.stringify(view.toJSON())).not.toContain('synthetic failure');
});
it.each(['success', 'failure', 'rejection'])('does not let an old %s response erase a newly typed form or repopulate dismissed feedback', async outcome => {
  const pending = deferred(); fixture.store.loginWithEmail.mockReturnValue(pending.promise); consent();
  let request!: Promise<void>; act(() => { request = submit(); });
  expect(JSON.stringify(view.toJSON())).toContain('이미 보낸 요청은 취소되지 않으며');
  act(() => button('닫기 ✕').props.onClick()); open();
  expect(password().props.value).toBe(''); typePassword('new-synthetic-secret');
  // Dismissal does not release the in-flight request guard or send a second login.
  await act(submit); expect(fixture.store.loginWithEmail).toHaveBeenCalledTimes(1);
  await act(async () => { if (outcome === 'rejection') pending.reject(new Error('synthetic rejection')); else pending.resolve(outcome === 'success' ? { ok: true } : { ok: false, error: 'old synthetic failure' }); await request; });
  expect(password().props.value).toBe('new-synthetic-secret');
  const html = JSON.stringify(view.toJSON());
  expect(html).not.toContain('old synthetic failure'); expect(html).not.toContain('인증되었습니다'); expect(html).not.toContain('synthetic rejection');
});
it('ignores pending auth feedback after an owner change and prevents duplicate requests', async () => {
  const pending = deferred(); fixture.store.loginWithEmail.mockReturnValue(pending.promise); consent();
  let request!: Promise<void>; act(() => { request = submit(); }); await act(submit);
  expect(fixture.store.loginWithEmail).toHaveBeenCalledTimes(1);
  act(() => { fixture.store.authUser = { userUuid: 'new-owner', maskedEmail: 'n***@example.com', provider: 'google' }; view.update(<Navbar/>); });
  await act(async () => { pending.resolve({ ok: false, error: 'previous owner error' }); await request; });
  expect(JSON.stringify(view.toJSON())).not.toContain('previous owner error');
  act(() => { fixture.store.authUser = null; view.update(<Navbar/>); }); expect(password().props.value).toBe('');
});
it('does not keep UI ownership after unmount while a request settles', async () => {
  const pending = deferred(); fixture.store.loginWithEmail.mockReturnValue(pending.promise); consent();
  let request!: Promise<void>; act(() => { request = submit(); }); act(() => view.unmount());
  await act(async () => { pending.reject(new Error('synthetic rejection')); await request; });
  expect(fixture.store.loginWithEmail).toHaveBeenCalledTimes(1);
});
it('does not move a pending email error into the Google form', async () => {
  const pending = deferred(); fixture.store.loginWithEmail.mockReturnValue(pending.promise); consent();
  let request!: Promise<void>; act(() => { request = submit(); });
  act(() => view.root.findAllByType('button').find(node => node.findAllByType('span').some(span => span.children.join('') === 'Google 로그인'))!.props.onClick());
  await act(async () => { pending.resolve({ ok: false, error: 'old email error' }); await request; });
  expect(JSON.stringify(view.toJSON())).not.toContain('old email error'); email(); expect(password().props.value).toBe('');
});
it('does not let a dismissed Google response change the reopened email form', async () => {
  act(() => view.root.findAllByType('button').find(node => node.findAllByType('span').some(span => span.children.join('') === 'Google 로그인'))!.props.onClick());
  const pending = deferred(); fixture.store.loginWithGoogle.mockReturnValue(pending.promise); consent();
  let request!: Promise<void>; act(() => { request = submit(); });
  act(() => button('닫기 ✕').props.onClick()); open(); email(); typePassword('new-synthetic-secret');
  await act(submit); expect(fixture.store.loginWithEmail).not.toHaveBeenCalled();
  await act(async () => { pending.resolve({ ok: true }); await request; });
  expect(password().props.value).toBe('new-synthetic-secret');
  expect(JSON.stringify(view.toJSON())).not.toContain('Google 인증 페이지로 이동합니다');
});
it('offers honest password-reset support without promising recovery or sending anything', () => {
  const html = JSON.stringify(view.toJSON());
  for (const text of ['아직 비밀번호 재설정을 제공하지', '비밀번호나 인증 코드는 보내지', '문의만으로 계정이 복구되거나 비밀번호가 바뀌지는']) expect(html).toContain(text);
  expect(view.root.findByProps({ href: 'mailto:sangmin5423@gmail.com' }).type).toBe('a');
  expect(fixture.store.loginWithEmail).not.toHaveBeenCalled(); expect(fixture.store.loginWithGoogle).not.toHaveBeenCalled();
});
