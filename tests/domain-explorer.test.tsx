import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { DomainExplorer } from '../src/components/DomainExplorer';
import { ALL_MASTER_DOMAINS } from '../src/lib/domains-index';
it('provides explicit accessible domain choices and completion filters', () => {
  const select = vi.fn(); let view: any;
  act(() => { view = create(<DomainExplorer completedIds={[1]} ready onSelect={select} />); });
  expect(view.root.findAllByType('li')).toHaveLength(ALL_MASTER_DOMAINS.length);
  const first = view.root.findAllByType('li')[0].findByType('button');
  act(() => first.props.onClick());
  expect(select).toHaveBeenCalledWith(ALL_MASTER_DOMAINS[0].id);
  const done = view.root.findAllByType('button').find((n: any) => n.children.includes('내 결과'));
  act(() => done.props.onClick());
  expect(view.root.findAllByType('li')).toHaveLength(1);
  act(() => view.unmount());
});
it('does not expose stale domain progress during hydration', () => {
  let view: any;
  act(() => { view = create(<DomainExplorer completedIds={[1]} ready={false} onSelect={vi.fn()} />); });
  expect(view.root.findAllByType('li')).toHaveLength(0);
  expect(view.root.findAllByType('button').every((n: any) => n.props.disabled)).toBe(true);
  act(() => view.unmount());
});
