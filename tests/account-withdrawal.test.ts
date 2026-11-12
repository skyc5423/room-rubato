import { describe, it, expect, vi } from 'vitest';
import { withdrawOwnAccount, WITHDRAWAL_CONFIRMATION as text } from '../src/lib/account-withdrawal';
const setup = () => ({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner' } }, error: null }) }, rpc: vi.fn().mockResolvedValue({ data: true, error: null }) });
describe('staged account withdrawal', () => {
  it('defaults disabled and never touches auth or RPC', async () => {
    const c=setup(); expect(await withdrawOwnAccount(c,text)).toEqual({status:'disabled'}); expect(c.auth.getUser).not.toHaveBeenCalled(); expect(c.rpc).not.toHaveBeenCalled();
  });
  it('requires exact confirmation before any request', async () => {
    const c=setup(); expect(await withdrawOwnAccount(c,'delete',true)).toEqual({status:'confirmation-required'}); expect(c.rpc).not.toHaveBeenCalled();
  });
  it('requires server-verified identity and binds confirmation identity without granting target authority', async () => {
    const c=setup(); expect(await withdrawOwnAccount(c,text,true,'owner','session')).toEqual({status:'deleted'}); expect(c.rpc).toHaveBeenCalledExactlyOnceWith('withdraw_own_account',{p_confirmation:text,p_expected_owner:'owner',p_expected_session:'session'});
    c.rpc.mockClear(); c.auth.getUser.mockResolvedValue({data:{user:null},error:null}); expect(await withdrawOwnAccount(c,text,true,'owner','session')).toEqual({status:'sign-in-required'}); expect(c.rpc).not.toHaveBeenCalled();
  });
  it.each([['P0001','WITHDRAWAL_DISABLED','disabled'],['42501','Fresh sign-in required','sign-in-required'],['P0001','WITHDRAWAL_STORAGE_REVIEW_REQUIRED','blocked'],['22023','Confirmation required','blocked'],['','Network failure','unknown']])('maps %s / %s without exposing error content', async (code,message,status) => {
    const c=setup(); c.rpc.mockResolvedValue({data:null,error:{code,message}}); expect(await withdrawOwnAccount(c,text,true,'owner','session')).toEqual({status});
  });
  it('does not auto-retry or claim success on a lost acknowledgment', async () => {
    const c=setup(); c.rpc.mockRejectedValue(new Error('transport failure')); expect(await withdrawOwnAccount(c,text,true,'owner','session')).toEqual({status:'unknown'}); expect(c.rpc).toHaveBeenCalledTimes(1);
  });
  it('rejects an account change before the request', async () => {
    const c=setup(); expect(await withdrawOwnAccount(c,text,true,'different-owner','session')).toEqual({status:'account-changed'}); expect(c.rpc).not.toHaveBeenCalled();
  });
  it('requires both captured identity assertions', async () => {
    const c=setup(); expect(await withdrawOwnAccount(c,text,true)).toEqual({status:'account-changed'}); expect(await withdrawOwnAccount(c,text,true,'owner')).toEqual({status:'account-changed'}); expect(c.rpc).not.toHaveBeenCalled();
  });
  it('requires an explicit true receipt', async () => {
    const c=setup(); c.rpc.mockResolvedValue({data:null,error:null}); expect(await withdrawOwnAccount(c,text,true,'owner','session')).toEqual({status:'unknown'});
  });
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AccountWithdrawalPage from '../src/app/account/withdrawal/page';
import PrivacyPage from '../src/app/privacy/page';
it('exposes an honest disabled withdrawal entry point, never a destructive form', () => {
  const html=renderToStaticMarkup(React.createElement(AccountWithdrawalPage));
  expect(html).toContain('disabled=""');
  expect(html).toContain('자동 회원 탈퇴는 아직 제공하지 않습니다');
  expect(html).toContain('mailto:sangmin5423@gmail.com');
  expect(html).not.toContain('<form');
  expect(renderToStaticMarkup(React.createElement(PrivacyPage))).toContain('href="/account/withdrawal"');
});
