import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { describe, it, expect } from 'vitest';
import { TasteNotebook } from '../src/components/TasteNotebook';

describe('taste notebook', () => {
  it('shows an original accessible illustration and a direct source', () => {
    let view: ReactTestRenderer;
    act(() => { view = create(<TasteNotebook />); });
    expect(view!.root.findByType('svg').props['aria-label']).toContain('같은 크기');
    expect(view!.root.findByType('a').props.href).toContain('nationalgallery.org.uk');
    expect(JSON.stringify(view!.toJSON())).toContain('점수에 반영하지 않습니다');
    act(() => view!.unmount());
  });
  it('switches among three notes without collecting answers', () => {
    let view: ReactTestRenderer;
    act(() => { view = create(<TasteNotebook />); });
    const buttons = view!.root.findAllByType('button');
    act(() => buttons[1].props.onClick());
    expect(view!.root.findByType('h2').children.join('')).toContain('미니멀리즘');
    expect(view!.root.findAllByType('svg')).toHaveLength(0);
    expect(buttons[1].props['aria-pressed']).toBe(true);
    act(() => buttons[2].props.onClick());
    expect(view!.root.findByType('h2').children.join('')).toBe('열려 있지만 구분된 공간');
    expect(view!.root.findAllByType('input')).toHaveLength(0);
    act(() => view!.unmount());
  });
});
