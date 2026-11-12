import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { TasteNotebook } from '../src/components/TasteNotebook';
import { journalKey, parseJournal } from '../src/lib/taste-journal';
let owner: string|null = null;
vi.mock('../src/lib/persona-store',()=>({usePersonaStore:()=>({authUser:owner?{userUuid:owner}:null,isHydrated:true})}));
let storage: Map<string,string>;
let tabStorage:Map<string,string>;
const button=(view:ReactTestRenderer,label:string)=>view.root.findAllByType('button').find(b=>JSON.stringify(b.children).includes(label))!;
beforeEach(()=>{owner=null;storage=new Map();tabStorage=new Map();vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tabStorage.get(k)||null,setItem:(k:string,v:string)=>tabStorage.set(k,v),removeItem:(k:string)=>tabStorage.delete(k)});vi.stubGlobal('localStorage',{getItem:(k:string)=>storage.get(k)||null,setItem:(k:string,v:string)=>storage.set(k,v)});vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn()});});
afterEach(()=>vi.unstubAllGlobals());
describe('taste notebook',()=>{
  it('offers eight independent experiences and honest browser storage scope',()=>{
    let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
    expect(view!.root.findAllByType('article')).toHaveLength(8);
    expect(JSON.stringify(view!.toJSON())).toContain('이 브라우저에만');
    act(()=>view!.unmount());
  });
  it('supports choice, explanation, reconsideration and persistent journal',()=>{
    let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
    act(()=>button(view!,'첫 탐색 시작').props.onClick());
    expect(view!.root.findByType('svg').props['aria-label']).toContain('균일한 면');
    expect(button(view!,'선택했어요').props.disabled).toBe(true);
    act(()=>button(view!,'아직 모르겠어요').props.onClick());
    act(()=>button(view!,'선택했어요').props.onClick());
    expect(JSON.stringify(view!.toJSON())).toContain('키아로스쿠로');
    act(()=>button(view!,'이제 다시 보고').props.onClick());
    act(()=>button(view!,'B 쪽').props.onClick());
    act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'빛이 더 입체적으로 보였다.'}}));
    act(()=>button(view!,'이번 탐색 마치기').props.onClick());
    const entry=parseJournal(storage.get(journalKey('guest'))!).entries.light;
    expect(entry.before).toBe('unsure');expect(entry.after).toBe('b');expect(entry.memo).toContain('입체적');expect(entry.completedAt).toBeTruthy();
    act(()=>view!.unmount());
    act(()=>{view=create(<TasteNotebook/>);});
    act(()=>button(view!,'내 기록').props.onClick());
    expect(JSON.stringify(view!.toJSON())).toContain('빛이 더 입체적으로 보였다.');
    act(()=>view!.unmount());
  });
  it('does not show guest notes after an account switch',()=>{
    let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
    act(()=>button(view!,'첫 탐색 시작').props.onClick());
    act(()=>button(view!,'A 쪽').props.onClick());
    expect(storage.has(journalKey('guest'))).toBe(true);
    owner='different-user';act(()=>view!.update(<TasteNotebook/>));
    expect(view!.root.findAllByType('article')).toHaveLength(8);
    expect(storage.has(journalKey('different-user'))).toBe(false);
    act(()=>button(view!,'내 기록').props.onClick());
    expect(JSON.stringify(view!.toJSON())).toContain('아직 기록이 없어요');
    act(()=>view!.unmount());
  });
  it('resumes saved settings and deletes only this observation after confirmation',()=>{
    const confirm=vi.fn(()=>false);(window as unknown as {confirm:typeof confirm}).confirm=confirm;
    let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
    act(()=>button(view!,'첫 탐색 시작').props.onClick());
    act(()=>view!.root.findByType('input').props.onChange({target:{value:'27'}}));
    act(()=>button(view!,'A 쪽').props.onClick());
    act(()=>button(view!,'목록으로').props.onClick());
    act(()=>button(view!,'이어서 살펴보기').props.onClick());
    expect(view!.root.findByType('input').props.value).toBe(27);
    expect(JSON.stringify(view!.toJSON())).toContain('이제 다시 보고');
    act(()=>button(view!,'이 탐색 기록 지우기').props.onClick());
    expect(parseJournal(storage.get(journalKey('guest'))!).entries.light).toBeTruthy();
    confirm.mockReturnValue(true);
    act(()=>button(view!,'이 탐색 기록 지우기').props.onClick());
    expect(parseJournal(storage.get(journalKey('guest'))!).entries.light).toBeUndefined();
    expect(button(view!,'선택했어요').props.disabled).toBe(true);
    act(()=>view!.unmount());
  });

  it('uses listening guidance without irrelevant diagram reset for music',()=>{
    let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
    const card=view!.root.findAllByType('article').find(a=>a.findByType('h2').children.join('').includes('박자는 같은데'))!;
    act(()=>card.findByType('button').props.onClick());
    const rendered=JSON.stringify(view!.toJSON());
    expect(rendered).toContain('A와 B를 차례로 들어보세요');
    expect(rendered).toContain('먼저 듣기');
    expect(rendered).not.toContain('먼저 도식을 움직여');
    expect(rendered).not.toContain('도식 기본 설정으로');
    expect(view!.root.findAllByType('input')).toHaveLength(0);
    act(()=>button(view!,'A 쪽').props.onClick());
    const entry=parseJournal(storage.get(journalKey('guest'))!).entries.syncopation;
    expect(entry.beforeSetting).toBeUndefined();
    act(()=>view!.unmount());
  });

});

it('revisits completed records without writes and supports draft cancel/save',()=>{
  const original={lessonId:'light',version:1,before:'a',after:'b',beforeSetting:27,afterSetting:60,memo:'원래 기록',bookmarked:false,completedAt:'2026-11-11T00:00:00.000Z',updatedAt:'2026-11-11T00:00:00.000Z'};
  storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:original}}));
  const raw=storage.get(journalKey('guest'));
  let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
  act(()=>button(view!,'다시 살펴보기').props.onClick());
  expect(view!.root.findByType('textarea').props.readOnly).toBe(true);
  expect(button(view!,'A 쪽').props.disabled).toBe(true);
  act(()=>view!.root.findByType('input').props.onChange({target:{value:'80'}}));
  expect(storage.get(journalKey('guest'))).toBe(raw);
  act(()=>button(view!,'첫 선택 당시 설정으로').props.onClick());
  expect(view!.root.findByType('input').props.value).toBe(27);
  act(()=>button(view!,'도식 기본 설정으로').props.onClick());
  expect(view!.root.findByType('input').props.value).toBe(60);
  expect(view!.root.findByType('input').props['aria-label']).toBe('B 도형의 명암 대비');
  act(()=>button(view!,'현재 기록 편집하기').props.onClick());
  act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'취소할 수정'}}));
  expect(storage.get(journalKey('guest'))).toBe(raw);
  act(()=>button(view!,'수정 취소').props.onClick());
  expect(view!.root.findByType('textarea').props.value).toBe('원래 기록');
  expect(storage.get(journalKey('guest'))).toBe(raw);
  act(()=>button(view!,'현재 기록 편집하기').props.onClick());
  act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'저장할 수정'}}));
  act(()=>button(view!,'수정한 기록 저장하기').props.onClick());
  const saved=parseJournal(storage.get(journalKey('guest'))!).entries.light;
  expect(saved.memo).toBe('저장할 수정');expect(saved.completedAt).toBe(original.completedAt);
  expect(saved.beforeSetting).toBe(27);expect(saved.after).toBe('b');
  act(()=>view!.unmount());
});
it('moves keyboard focus to lesson headings, stages and back to notebook',()=>{
  const focus=vi.fn();let view:ReactTestRenderer;
  act(()=>{view=create(<TasteNotebook/>,{createNodeMock:el=>el.type==='h1'||el.type==='h2'?{focus}:null});});
  act(()=>button(view!,'첫 탐색 시작').props.onClick());expect(focus).toHaveBeenCalledTimes(1);
  act(()=>button(view!,'A 쪽').props.onClick());act(()=>button(view!,'선택했어요').props.onClick());expect(focus).toHaveBeenCalledTimes(2);
  act(()=>button(view!,'목록으로').props.onClick());expect(focus).toHaveBeenCalledTimes(3);
  act(()=>view!.unmount());
});
it('does not resurrect a deleted record from an editing draft',()=>{
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,before:'a',after:'b',memo:'old',bookmarked:false,completedAt:'2026-11-11T00:00:00.000Z',updatedAt:'2026-11-11T00:00:00.000Z'}}}));
 (window as any).confirm=()=>true;let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
 act(()=>button(view!,'다시 살펴보기').props.onClick());act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>button(view!,'이 탐색 기록 지우기').props.onClick());
 expect(parseJournal(storage.get(journalKey('guest'))!).entries.light).toBeUndefined();
 expect(button(view!,'수정한 기록 저장하기')).toBeUndefined();
 expect(button(view!,'선택했어요').props.disabled).toBe(true);act(()=>view!.unmount());
});
it('refuses a stale draft save after another tab changes the same record',()=>{
 const original={lessonId:'light',version:1,before:'a',after:'b',memo:'old',bookmarked:false,completedAt:'2026-11-11T00:00:00.000Z',updatedAt:'2026-11-11T00:00:00.000Z'};
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:original}}));
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});act(()=>button(view!,'다시 살펴보기').props.onClick());act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'my draft'}}));
 const newer=JSON.stringify({version:1,entries:{light:{...original,memo:'newer tab',updatedAt:'2026-11-12T00:00:00.000Z'}}});storage.set(journalKey('guest'),newer);
 act(()=>button(view!,'수정한 기록 저장하기').props.onClick());expect(storage.get(journalKey('guest'))).toBe(newer);
 expect(view!.root.findByType('textarea').props.value).toBe('my draft');expect(JSON.stringify(view!.toJSON())).toContain('다른 탭에서 기록이 바뀌었어요');act(()=>view!.unmount());
});
it('preserves the prior record if saving an explicit edit fails',()=>{
 const original={lessonId:'light',version:1,before:'a',after:'b',memo:'old',bookmarked:false,completedAt:'2026-11-11T00:00:00.000Z',updatedAt:'2026-11-11T00:00:00.000Z'};
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:original}}));
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});act(()=>button(view!,'다시 살펴보기').props.onClick());act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'not saved'}}));
 vi.stubGlobal('localStorage',{getItem:(k:string)=>storage.get(k)||null,setItem:()=>{throw new Error('quota');}});
 act(()=>button(view!,'수정한 기록 저장하기').props.onClick());
 expect(view!.root.findByType('textarea').props.value).toBe('not saved');
 act(()=>button(view!,'수정 취소').props.onClick());expect(view!.root.findByType('textarea').props.value).toBe('old');
 expect(parseJournal(storage.get(journalKey('guest'))!).entries.light.memo).toBe('old');act(()=>view!.unmount());
});

describe('notebook comparison deep links',()=>{
 it('opens an allowlisted lesson without saving',()=>{
  let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
  expect(view!.root.findAllByType('svg')).toHaveLength(1);expect(storage.size).toBe(0);
  act(()=>view!.unmount());
 });
 it('ignores unknown lessons',()=>{
  let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="unknown"/>);});
  expect(view!.root.findAllByType('article')).toHaveLength(8);expect(storage.size).toBe(0);act(()=>view!.unmount());
 });
 it('opens an existing completed record read-only without replacing its settings',()=>{
  const entry={lessonId:'light',version:1,before:'a',after:'b',beforeSetting:27,afterSetting:31,memo:'preserve',completedAt:'2026-11-11T00:00:00Z',updatedAt:'2026-11-11T00:00:00Z'};
  const raw=JSON.stringify({version:1,entries:{light:entry}});storage.set(journalKey('guest'),raw);
  let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
  expect(storage.get(journalKey('guest'))).toBe(raw);
  expect(JSON.stringify(view!.toJSON())).toContain('preserve');
  expect(view!.root.findByType('textarea').props.readOnly).toBe(true);act(()=>view!.unmount());
 });
});

vi.mock('next/link',()=>({default:({children,...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props}>{children}</a>}));

it('does not switch or write another completed record while a deep-linked draft is open',()=>{
 const make=(id:string)=>({lessonId:id,version:1,before:'a',after:'b',memo:'keep '+id,completedAt:'2026-11-11T00:00:00Z',updatedAt:'2026-11-11T00:00:00Z'});
 const raw=JSON.stringify({version:1,entries:{light:make('light'),context:make('context')}});storage.set(journalKey('guest'),raw);
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>view!.update(<TasteNotebook initialLesson="context"/>));
 expect(view!.root.findByType('textarea').props.value).toBe('keep light');
 expect(storage.get(journalKey('guest'))).toBe(raw);act(()=>view!.unmount());
});

it('resumes a started context lesson instead of the first untouched catalogue lesson',()=>{
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{context:{lessonId:'context',version:1,before:'a',memo:'',updatedAt:'2026-11-12'}}}));
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook/>);});
 act(()=>button(view!,'멈춘 탐색 이어보기').props.onClick());
 expect(JSON.stringify(view!.toJSON())).toContain('좋은 것과 흥미로운 것은 다르다');
 expect(parseJournal(storage.get(journalKey('guest'))!).entries.light).toBeUndefined();act(()=>view!.unmount());
});
it('verifies contrast without writing answers or losing slider settings',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="contrast"/>);});
 const slider=()=>view!.root.findByType('input');
 act(()=>slider().props.onChange({target:{value:'23'}}));
 act(()=>button(view!,'두 배경을 같은 회색으로 가리기').props.onClick());
 expect(slider().props.value).toBe(23);expect(slider().props.disabled).toBe(true);
 expect(button(view!,'A 쪽').props.disabled).toBe(true);expect(storage.size).toBe(0);
 expect(view!.root.findByType('svg').props['aria-label']).toContain('확인 보기');
 act(()=>button(view!,'원래 배경으로 돌아가기').props.onClick());
 expect(slider().props.value).toBe(23);expect(slider().props.disabled).toBe(false);
 expect(button(view!,'A 쪽').props.disabled).toBe(false);expect(storage.size).toBe(0);act(()=>view!.unmount());
});

it('keeps saved contrast records read-only through verification and restores normal view on reopening',()=>{
 const raw=JSON.stringify({version:1,entries:{contrast:{lessonId:'contrast',version:1,before:'a',after:'b',beforeSetting:22,afterSetting:31,memo:'preserve',completedAt:'2026-11-12',updatedAt:'2026-11-12'}}});storage.set(journalKey('guest'),raw);
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="contrast"/>);});
 act(()=>button(view!,'두 배경을 같은 회색으로 가리기').props.onClick());
 expect(button(view!,'이번 탐색 마치기').props.disabled).toBe(true);expect(storage.get(journalKey('guest'))).toBe(raw);
 act(()=>button(view!,'← 목록으로').props.onClick());
 const card=view!.root.findAllByType('article').find(a=>JSON.stringify(a.findAllByType('h2').map(h=>h.children)).includes('주변이 바꾸는 같은 색'))!;
 act(()=>card.findAllByType('button').find(b=>JSON.stringify(b.children).includes('다시 살펴보기'))!.props.onClick());
 expect(view!.root.findByType('svg').props['aria-label']).not.toContain('확인 보기');
 expect(button(view!,'A 쪽').props.disabled).toBe(true);expect(storage.get(journalKey('guest'))).toBe(raw);act(()=>view!.unmount());
});

it('opens a focused workspace while keeping storage and export controls reachable',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 expect(view!.root.findByType('h1').props.id).toBe('lesson-heading');
 expect(view!.root.findAllByProps({'aria-label':'노트 보기 방식'})).toHaveLength(0);
 expect(JSON.stringify(view!.toJSON())).not.toContain('좋아하는 이유를 찾아보는 시간');
 expect(view!.root.findAllByProps({href:'#notebook-storage'})).toHaveLength(1);
 expect(view!.root.findAllByProps({id:'notebook-storage'})).toHaveLength(1);
 expect(button(view!,'기록 내보내기')).toBeDefined();
 expect(storage.size).toBe(0);
 act(()=>button(view!,'← 목록으로').props.onClick());
 expect(view!.root.findByType('h1').props.id).toBe('notebook-heading');
 expect(view!.root.findAllByProps({'aria-label':'노트 보기 방식'})).toHaveLength(1);
 expect(view!.root.findAllByType('article')).toHaveLength(8);act(()=>view!.unmount());
});
it('keeps a focused draft open when leaving is declined',()=>{
 const raw=JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'}}});storage.set(journalKey('guest'),raw);
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'draft'}}));
 window.confirm=vi.fn(()=>false);
 act(()=>button(view!,'← 목록으로').props.onClick());
 expect(view!.root.findByType('h1').props.id).toBe('lesson-heading');
 expect(view!.root.findByType('textarea').props.value).toBe('draft');expect(storage.get(journalKey('guest'))).toBe(raw);
 act(()=>button(view!,'수정 취소').props.onClick());expect(view!.root.findByType('textarea').props.value).toBe('original');act(()=>view!.unmount());
});
it('keeps storage errors visible before the focused activity',()=>{
 vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');}});
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 expect(view!.root.findByProps({role:'alert'}).children.join('')).toContain('저장소');
 expect(view!.root.findByType('h1').props.id).toBe('lesson-heading');act(()=>view!.unmount());
});

it('recovers an owner-scoped draft after remount without replacing the saved record',()=>{
 const entry={lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'};
 const raw=JSON.stringify({version:1,entries:{light:entry}});storage.set(journalKey('guest'),raw);
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'unsaved draft'}}));
 act(()=>view!.unmount());
 expect(storage.get(journalKey('guest'))).toBe(raw);
 act(()=>{view=create(<TasteNotebook/>);});
 expect(button(view!,'임시 수정 이어가기')).toBeDefined();
 act(()=>button(view!,'임시 수정 이어가기').props.onClick());
 expect(view!.root.findByType('textarea').props.value).toBe('unsaved draft');
 expect(storage.get(journalKey('guest'))).toBe(raw);
 act(()=>button(view!,'수정한 기록 저장하기').props.onClick());
 expect(parseJournal(storage.get(journalKey('guest'))!).entries.light.memo).toBe('unsaved draft');
 expect(tabStorage.size).toBe(0);act(()=>view!.unmount());
});
it('never restores a draft over a changed or deleted base',()=>{
 const entry={lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'};
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:entry}}));
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 act(()=>button(view!,'현재 기록 편집하기').props.onClick());act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'copy me'}}));act(()=>view!.unmount());
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{}}));
 act(()=>{view=create(<TasteNotebook/>);});act(()=>button(view!,'임시 수정 이어가기').props.onClick());
 expect(JSON.stringify(view!.toJSON())).toContain('바뀌었거나 삭제');
 expect(parseJournal(storage.get(journalKey('guest'))!).entries.light).toBeUndefined();
 expect(view!.root.findByProps({'aria-label':'임시 수정 메모'}).props.value).toBe('copy me');
 act(()=>view!.unmount());
});
it('keeps recovery private across owners and clears cancelled drafts',()=>{
 const entry={lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'};
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:entry}}));
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'guest secret'}}));
 owner='second';act(()=>view!.update(<TasteNotebook/>));expect(JSON.stringify(view!.toJSON())).not.toContain('guest secret');expect(button(view!,'임시 수정 이어가기')).toBeUndefined();
 owner=null;act(()=>view!.update(<TasteNotebook/>));act(()=>button(view!,'임시 수정 이어가기').props.onClick());act(()=>button(view!,'수정 취소').props.onClick());
 expect(tabStorage.size).toBe(0);expect(parseJournal(storage.get(journalKey('guest'))!).entries.light.memo).toBe('original');act(()=>view!.unmount());
});
it('retains active edits when tab-copy cleanup fails and warns on failed draft writes',()=>{
 const entry={lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'};
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:entry}}));
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>tabStorage.get(k)||null,setItem:()=>{throw Error('quota');},removeItem:()=>{throw Error('blocked');}});
 act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'new memo'}}));expect(JSON.stringify(view!.toJSON())).toContain('임시 수정 보관에 실패');
 act(()=>button(view!,'수정 취소').props.onClick());expect(view!.root.findByType('textarea').props.value).toBe('new memo');expect(JSON.stringify(view!.toJSON())).toContain('지우지 못했어요');
 expect(parseJournal(storage.get(journalKey('guest'))!).entries.light.memo).toBe('original');act(()=>view!.unmount());
});
it('does not invalidate a pending edit by bookmarking its original',()=>{
 const entry={lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'};
 const raw=JSON.stringify({version:1,entries:{light:entry}});storage.set(journalKey('guest'),raw);
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});act(()=>button(view!,'현재 기록 편집하기').props.onClick());act(()=>view!.unmount());
 act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});act(()=>button(view!,'＋ 다시 볼 단서에 저장').props.onClick());
 expect(storage.get(journalKey('guest'))).toBe(raw);expect(JSON.stringify(view!.toJSON())).toContain('먼저 남아 있는');
 act(()=>button(view!,'임시 수정 이어가기').props.onClick());expect(button(view!,'수정한 기록 저장하기')).toBeDefined();act(()=>view!.unmount());
});
it('clears a confirmed deleted draft and unregisters its unload warning',()=>{
 const entry={lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'};
 storage.set(journalKey('guest'),JSON.stringify({version:1,entries:{light:entry}}));window.confirm=vi.fn(()=>true);
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 const handler=vi.mocked(window.addEventListener).mock.calls.find(([event])=>event==='beforeunload')![1] as (event:any)=>void;
 const event={preventDefault:vi.fn(),returnValue:undefined};handler(event);expect(event.preventDefault).toHaveBeenCalled();expect(event.returnValue).toBe('');
 act(()=>button(view!,'이 탐색 기록 지우기').props.onClick());expect(tabStorage.size).toBe(0);expect(parseJournal(storage.get(journalKey('guest'))!).entries.light).toBeUndefined();
 expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload',handler);act(()=>view!.unmount());
 act(()=>{view=create(<TasteNotebook/>);});expect(button(view!,'임시 수정 이어가기')).toBeUndefined();act(()=>view!.unmount());
});

it('opens related observation questions without writing answers or progress',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 const before=[...storage.entries()];
 const footer=view!.root.findAllByType('section').find(s=>s.props['aria-labelledby']==='lesson-bridges-heading')!;
 expect(footer).toBeTruthy();
 act(()=>footer.findAllByType('button')[0].props.onClick());
 expect(JSON.stringify(view!.root.findByProps({id:'lesson-heading'}).children)).toContain('주변이 바꾸는 같은 색');
 expect([...storage.entries()]).toEqual(before);
 expect(tabStorage.size).toBe(0);
 act(()=>view!.unmount());
});

it('keeps the edited record and draft when a related bridge exit is declined',()=>{
 const raw=JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,before:'a',after:'b',memo:'original',completedAt:'2026-11-12',updatedAt:'2026-11-12'}}});storage.set(journalKey('guest'),raw);
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="light"/>);});
 act(()=>button(view!,'현재 기록 편집하기').props.onClick());
 act(()=>view!.root.findByType('textarea').props.onChange({target:{value:'synthetic draft'}}));
 const beforeDraft=[...tabStorage.entries()];window.confirm=vi.fn(()=>false);
 const footer=view!.root.findAllByType('section').find(s=>s.props['aria-labelledby']==='lesson-bridges-heading')!;
 act(()=>footer.findAllByType('button')[0].props.onClick());
 expect(window.confirm).toHaveBeenCalledOnce();
 expect(view!.root.findByProps({id:'lesson-heading'}).children.join('')).toContain('명암은 형태를 만든다');
 expect(view!.root.findByType('textarea').props.value).toBe('synthetic draft');
 expect(storage.get(journalKey('guest'))).toBe(raw);expect([...tabStorage.entries()]).toEqual(beforeDraft);
 act(()=>view!.unmount());
});
it('keeps cinema sequence navigation separate from notebook answers and resets on reopening',()=>{
 let view:ReactTestRenderer;act(()=>{view=create(<TasteNotebook initialLesson="context"/>);});const before=[...storage.entries()];
 const panel=()=>view!.root.findByProps({'aria-labelledby':'cinema-sequence-title'});
 const next=()=>panel().findAllByType('button').find(b=>b.children.join('')==='다음 컷')!;
 act(()=>next().props.onClick());act(()=>next().props.onClick());expect(panel().findByProps({role:'status'}).children.join('')).toContain('3/4');
 expect([...storage.entries()]).toEqual(before);expect(tabStorage.size).toBe(0);
 act(()=>button(view!,'← 목록으로').props.onClick());act(()=>view!.unmount());
 act(()=>{view=create(<TasteNotebook initialLesson="context"/>);});expect(panel().findByProps({role:'status'}).children.join('')).toContain('1/4');expect([...storage.entries()]).toEqual(before);act(()=>view!.unmount());
});
