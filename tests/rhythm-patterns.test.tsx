import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it } from 'vitest';
import { contrast, hex, over } from './helpers/contrast';
import { TasteStudyDiagram } from '../src/components/TasteStudyDiagram';
import { RHYTHM_PATTERN_STEPS, RHYTHM_PULSE_STEPS, RHYTHM_STEP_COUNT, RHYTHM_STEPS_PER_BEAT, RHYTHM_NO_SOUND_READING } from '../src/lib/rhythm-patterns';

it('retains the original four-beat patterns and their 16 subdivisions', () => {
  expect(RHYTHM_STEP_COUNT).toBe(16);
  expect(RHYTHM_STEPS_PER_BEAT).toBe(4);
  expect(RHYTHM_PULSE_STEPS).toEqual([0, 4, 8, 12]);
  expect(RHYTHM_PATTERN_STEPS).toEqual({ a: [0, 4, 8, 12], b: [0, 3, 6, 10] });
});
it('labels four real beats per panel while retaining the intermediate subdivisions and exact onsets', () => {
  let view: ReturnType<typeof create>;
  act(() => { view = create(<TasteStudyDiagram kind="syncopation" labels={['박 위의 강조', '박 사이의 강조']}/>); });
  try {
    const lines = view!.root.findAllByType('line');
    expect(lines).toHaveLength(32);
    expect(view!.root.findByType('svg').props.className).toContain('bg-[#f6f2e8]');
    for (const line of lines) {
      expect(contrast(hex(line.props.stroke), hex('#f6f2e8'))).toBeGreaterThanOrEqual(3);
      expect(contrast(hex(line.props.stroke), over(hex('#000000'), hex('#f6f2e8'), 0.04))).toBeGreaterThanOrEqual(3);
    }
    expect(new Set(lines.filter(line => line.props.strokeWidth === 1).map(line => line.props.stroke))).toEqual(new Set(['#77867f']));
    expect(new Set(lines.filter(line => line.props.strokeWidth === 2).map(line => line.props.stroke))).toEqual(new Set(['#627c77']));
    expect(lines.filter(line => line.props.strokeWidth === 2)).toHaveLength(8);
    const labels = view!.root.findAllByType('text').map(text => text.children.join(''));
    for (const label of ['1박', '2박', '3박', '4박']) expect(labels.filter(text => text === label)).toHaveLength(2);
    expect(view!.root.findAllByType('circle').map(dot => dot.props.cx))
      .toEqual([...RHYTHM_PATTERN_STEPS.a.map(step => 15 + step * 14), ...RHYTHM_PATTERN_STEPS.b.map(step => 275 + step * 14)]);
    const accessible = view!.root.findByType('svg').props['aria-label'];
    expect(accessible).toContain('굵은 세로선 4개');
    expect(accessible).toContain('한 박을 네 칸');
    expect(accessible).toContain(RHYTHM_NO_SOUND_READING);
  } finally { act(() => view!.unmount()); }
});
