import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ArtworkStudy } from '../src/components/ArtworkStudy';
import { artworkStudies } from '../src/lib/artwork-studies';

const works = artworkStudies.filter(work => work.lessonIds.includes('light'));
let renderer: ReactTestRenderer;
const image = () => renderer.root.findByType('img');
const select = (title: string) => act(() => {
  renderer.root.findAllByType('button').find(button => button.children.join('') === title)!.props.onClick();
});
const mount = () => act(() => { renderer = create(<ArtworkStudy lessonId="light"/>); });
afterEach(() => { if (renderer) act(() => renderer.unmount()); });

describe('artwork image transitions', () => {
  it('hides the image behind a loading status until the selected artwork loads', () => {
    mount();
    expect(image().props.style.visibility).toBe('hidden');
    expect(image().props['aria-hidden']).toBe(true);
    expect(renderer.root.findByProps({ role: 'status' }).children.join('')).toContain('불러오는 중');
    expect(renderer.root.findByProps({ 'aria-busy': true })).toBeDefined();
    act(() => image().props.onLoad());
    expect(image().props.style.visibility).toBe('visible');
    expect(image().props['aria-hidden']).toBe(false);
    expect(renderer.root.findAllByProps({ role: 'status' })).toHaveLength(0);
  });

  it('replaces loaded pixels immediately when selecting a new work', () => {
    mount();
    const oldImage = image();
    act(() => oldImage.props.onLoad());
    select(works[1].titleKo);
    expect(image()).not.toBe(oldImage);
    expect(image().props.src).toBe(works[1].image);
    expect(image().props.style.visibility).toBe('hidden');
    expect(renderer.root.findByType('figcaption').findByType('strong').children).toEqual([works[1].titleKo]);
    act(() => image().props.onLoad());
    expect(image().props.style.visibility).toBe('visible');
  });

  it('ignores stale load/error events during rapid A-to-B-to-A switching', () => {
    mount();
    const firstHandlers = image().props;
    select(works[1].titleKo);
    const secondHandlers = image().props;
    select(works[0].titleKo);
    act(() => { firstHandlers.onLoad(); secondHandlers.onLoad(); secondHandlers.onError(); });
    expect(image().props.src).toBe(works[0].image);
    expect(image().props.style.visibility).toBe('hidden');
    expect(renderer.root.findByProps({ 'aria-busy': true })).toBeDefined();
    act(() => image().props.onLoad());
    expect(image().props.style.visibility).toBe('visible');
  });

  it('shows an error without stale pixels and recovers on another selection', () => {
    mount();
    act(() => image().props.onError());
    expect(image().props.style.visibility).toBe('hidden');
    expect(renderer.root.findByProps({ 'aria-busy': false })).toBeDefined();
    expect(renderer.root.findByProps({ role: 'status' }).children.join('')).toContain('불러오지 못했어요');
    select(works[1].titleKo);
    expect(renderer.root.findByProps({ role: 'status' }).children.join('')).toContain('불러오는 중');
    act(() => image().props.onLoad());
    expect(image().props.style.visibility).toBe('visible');
  });

  it('recognizes an image already loaded before hydration', () => {
    act(() => {
      renderer = create(<ArtworkStudy lessonId="light"/>, {
        createNodeMock: element => element.type === 'img' ? { complete: true, naturalWidth: 600 } : null,
      });
    });
    expect(image().props.style.visibility).toBe('visible');
    expect(renderer.root.findAllByProps({ role: 'status' })).toHaveLength(0);
  });

  it('keeps loaded images visible when zooming and replaces them on a lesson change', () => {
    mount();
    act(() => image().props.onLoad());
    const loadedImage = image();
    select(`${works[0].detail} 확대`);
    expect(image()).toBe(loadedImage);
    expect(image().props.style.visibility).toBe('visible');
    expect(image().props.style.transform).toBe('scale(1.6)');
    act(() => renderer.update(<ArtworkStudy lessonId="rhythm"/>));
    expect(image()).not.toBe(loadedImage);
    expect(image().props.style.visibility).toBe('hidden');
  });
});
