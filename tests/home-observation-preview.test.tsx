import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeObservationPreview } from '../src/components/HomeObservationPreview';
import { artworkStudies } from '../src/lib/artwork-studies';

vi.mock('next/link', () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
afterEach(() => vi.unstubAllGlobals());

it('presents the licensed complete pair and one comparison destination without collecting data', () => {
  const write = vi.fn();
  vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: write });
  let view: ReactTestRenderer;
  act(() => { view = create(<HomeObservationPreview/>); });
  const images = view!.root.findAllByType('img');
  expect(images.map(img => img.props.src)).toEqual(['/artworks/met-437881.jpg', '/artworks/met-437853.jpg']);
  for (const img of images) {
    expect(img.props.className).toContain('object-contain');
    expect(img.props.style.transform).toBeUndefined();
    expect(img.props.alt.length).toBeGreaterThan(20);
  }
  expect(view!.root.findAllByType('a').filter(link => link.props.href.startsWith('/compare'))).toHaveLength(1);
  expect(view!.root.findAllByType('a').some(link => link.props.href === '/compare/light-and-edges')).toBe(true);
  expect(view!.root.findAllByType('input')).toHaveLength(0);
  expect(view!.root.findAllByType('textarea')).toHaveLength(0);
  expect(write).not.toHaveBeenCalled();
  expect(localStorage.getItem).not.toHaveBeenCalled();
  expect(view!.root.findAllByType('details')).toHaveLength(2);
  for (const id of ['437881', '437853']) {
    const work = artworkStudies.find(item => item.id === id)!;
    expect(work.license).toBe('CC0');
    expect(view!.root.findAllByType('a').some(link => link.props.href === work.sourceUrl)).toBe(true);
    expect(view!.root.findAllByType('a').some(link => link.props.href === work.licenseUrl)).toBe(true);
  }
  act(() => view!.unmount());
});

it('retains independent image loading and a usable original-image fallback', () => {
  let view: ReactTestRenderer;
  act(() => { view = create(<HomeObservationPreview/>); });
  const figures = view!.root.findAllByType('figure');
  expect(figures[0].findByType('img').props.style.visibility).toBe('hidden');
  act(() => figures[0].findByType('img').props.onLoad());
  expect(figures[0].findByType('img').props.style.visibility).toBe('visible');
  expect(figures[1].findByType('img').props.style.visibility).toBe('hidden');
  act(() => figures[1].findByType('img').props.onError());
  expect(JSON.stringify(figures[1].findByProps({ role: 'status' }).children)).toContain('불러오지 못했어요');
  expect(figures[1].findAllByType('a').some(link => link.props.href === '/artworks/met-437853.jpg')).toBe(true);
  act(() => view!.unmount());
});
