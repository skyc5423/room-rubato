import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SavedRecordInspector } from '../src/components/SavedRecordInspector';
import type { PersonaState } from '../src/lib/persona-store';
import { INITIAL_LAYER1_VECTOR, INITIAL_LAYER2_VECTOR, INITIAL_LAYER3_VECTOR } from '../src/lib/domains-index';
import { tasteLessons } from '../src/lib/taste-lessons';
const fixture: PersonaState = {
  layer1Vector: {...INITIAL_LAYER1_VECTOR}, layer2Vector: {...INITIAL_LAYER2_VECTOR}, layer3Vector: {...INITIAL_LAYER3_VECTOR},
  completedDomains: {}, choiceTelemetryLog: [], curationFeedbackLog: [],
  dailyShiftLog: [{timestamp:'synthetic-record-only',pulseId:'synthetic-question',phase1Choice:'A',phase1ResponseTimeMs:1234,phase2ChoiceAfterSocialProof:'B',didShift:true}],
};
describe('optional neutral saved record inspection', () => {
  it('does not include raw personal records in initial rendered markup', () => {
    const html = renderToStaticMarkup(<SavedRecordInspector state={fixture}/>);
    expect(html).toContain('저장된 기록 확인'); expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('synthetic-record-only'); expect(html).not.toContain('<pre');
    expect(html).not.toContain('Ground-Truth');
  });
  it('reveals the unchanged JSON only on request and removes it on collapse', () => {
    const original = JSON.stringify(fixture); let view: ReactTestRenderer;
    act(() => {view=create(<SavedRecordInspector state={fixture}/>);});
    const button=()=>view!.root.findByType('button');
    const controls=button().props['aria-controls'];
    expect(view!.root.findByProps({id:controls}).props.hidden).toBe(true);
    act(()=>button().props.onClick());
    expect(button().props['aria-expanded']).toBe(true);
    expect(view!.root.findByType('pre').children.join('')).toBe(JSON.stringify(fixture,null,2));
    expect(view!.root.findByType('pre').props.tabIndex).toBe(0);
    expect(JSON.stringify(view!.toJSON())).toContain('답을 바꾼 이유나 동조 성향을 판단하는 값이 아닙니다');
    act(()=>button().props.onClick());expect(view!.root.findAllByType('pre')).toHaveLength(0);
    expect(JSON.stringify(fixture)).toBe(original);act(()=>view!.unmount());
  });
  it('keeps inspection open for same-owner updates but closes on owner or guest changes', () => {
    let view: ReactTestRenderer;
    act(()=>{view=create(<SavedRecordInspector key="owner-a" state={fixture}/>);});
    act(()=>view!.root.findByType('button').props.onClick());
    const updated = {...fixture, dailyShiftLog: []};
    act(()=>view!.update(<SavedRecordInspector key="owner-a" state={updated}/>));
    expect(view!.root.findByType('button').props['aria-expanded']).toBe(true);
    expect(view!.root.findByType('pre').children.join('')).toBe(JSON.stringify(updated,null,2));
    act(()=>view!.update(<SavedRecordInspector key="owner-b" state={fixture}/>));
    expect(view!.root.findByType('button').props['aria-expanded']).toBe(false);
    expect(view!.root.findAllByType('pre')).toHaveLength(0);
    act(()=>view!.root.findByType('button').props.onClick());
    act(()=>view!.update(<SavedRecordInspector key="guest" state={updated}/>));
    expect(view!.root.findAllByType('pre')).toHaveLength(0);
    act(()=>view!.unmount());
    act(()=>{view=create(<SavedRecordInspector key="guest" state={updated}/>);});
    expect(view!.root.findByType('button').props['aria-expanded']).toBe(false);
    act(()=>view!.unmount());
  });
  it('preserves answer-change provenance and does not add persistence or inference', () => {
    const store=readFileSync('src/lib/persona-store.tsx','utf8');
    expect(store).toContain('const didShift = phase1Choice !== phase2ChoiceAfterSocialProof;');
    const component=readFileSync('src/components/SavedRecordInspector.tsx','utf8');
    expect(component).not.toMatch(/localStorage|sessionStorage|fetch\(|setItem|recordDailyPulseShift/);
    const page=readFileSync('src/app/research/page.tsx','utf8');
    expect(page).toContain("<SavedRecordInspector key={authUser?.userUuid ?? 'guest'} state={state} />");
    expect(page).not.toMatch(/Ground-Truth|동조 변화|JSON\.stringify/);
  });
  it('links the two music papers through their canonical publisher DOIs', () => {
    expect(tasteLessons.find(lesson=>lesson.id==='syncopation')!.sources.map(source=>source.url)).toEqual([
      'https://doi.org/10.1371/journal.pone.0094446','https://doi.org/10.1371/journal.pone.0311877',
    ]);
  });
});
