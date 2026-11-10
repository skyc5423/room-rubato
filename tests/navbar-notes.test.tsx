import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ usePathname: () => '/notes' }));
vi.mock('next/link', () => ({default: ({children, ...props}: any) => <a {...props}>{children}</a>}));
vi.mock('../src/lib/persona-store', () => ({ usePersonaStore: () => ({ state: {completedDomains: {}}, isHydrated: true, authUser: null }) }));
import { Navbar } from '../src/components/Navbar';
it('offers a visible notes link with current-page semantics', () => {
  let view: any;
  act(() => { view = create(<Navbar />); });
  const link = view.root.findAllByType('a').find((node: any) => node.props.href === '/notes');
  expect(link.props['aria-current']).toBe('page');
  expect(link.props.className).not.toContain('hidden');
  expect(link.children).toContain('취향 노트');
  act(() => view.unmount());
});
