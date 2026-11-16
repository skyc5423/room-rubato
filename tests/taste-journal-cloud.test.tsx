import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TasteJournalCloudSync } from '../src/components/TasteJournalCloudSync';
import { journalFromCloud, type JournalCloudClient, type JournalCloudRow } from '../src/lib/taste-journal-cloud';
import { emptyJournal, updateJournal } from '../src/lib/taste-journal';
vi.mock('../src/lib/supabase', () => ({supabase: null}));
const local = updateJournal(emptyJournal(), 'light', 1, {memo:'local only'});
const server = updateJournal(emptyJournal(), 'space', 1, {memo:'remote only'});
const find = (view: ReactTestRenderer, label: string) => view.root.findAllByType('button').find(b=>b.children.join('') === label)!;
beforeEach(()=>vi.stubGlobal('window',{confirm:vi.fn(()=>true)}));
afterEach(()=>vi.unstubAllGlobals());
describe('manual observation cloud sync candidate', ()=>{
  it('never reads or uploads on mount; requires explicit confirmation to upload',async()=>{
    const client:JournalCloudClient={load:vi.fn(async()=>null),save:vi.fn(async()=>({status:'saved' as const,revision:'r1'}))};
    let view:ReactTestRenderer;
    await act(async()=>{view=create(<TasteJournalCloudSync owner="u1" journal={local} client={client} onReplace={()=>true} onExport={()=>{}}/>);});
    expect(client.load).not.toHaveBeenCalled();expect(client.save).not.toHaveBeenCalled();
    expect(find(view!,'이 브라우저 기록 계정에 저장').props.disabled).toBe(true);
    await act(async()=>find(view!,'서버 기록 확인').props.onClick());
    vi.mocked(window.confirm).mockReturnValue(false);
    await act(async()=>find(view!,'이 브라우저 기록 계정에 저장').props.onClick());
    expect(client.save).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(true);
    await act(async()=>find(view!,'이 브라우저 기록 계정에 저장').props.onClick());
    expect(client.save).toHaveBeenCalledWith(expect.objectContaining({ownerId:'u1',expectedRevision:null,state:local}));
    act(()=>view!.unmount());
  });
  it('keeps local state on conflict, blocks overwriting, fetches and explicitly restores server state',async()=>{
    const replace=vi.fn(()=>true);
    const client:JournalCloudClient={load:vi.fn(async()=>({state:server,revision:'r1'})),save:vi.fn(async()=>({status:'conflict' as const}))};
    let view:ReactTestRenderer;
    await act(async()=>{view=create(<TasteJournalCloudSync owner="u1" journal={local} client={client} onReplace={replace} onExport={()=>{}}/>);});
    await act(async()=>find(view!,'서버 기록 확인').props.onClick());
    expect(replace).not.toHaveBeenCalled();
    await act(async()=>find(view!,'이 브라우저 기록 계정에 저장').props.onClick());
    expect(replace).not.toHaveBeenCalled();
    expect(find(view!,'확인한 서버 기록 불러오기').props.disabled).toBe(true);
    expect(find(view!,'이 브라우저 기록 계정에 저장').props.disabled).toBe(true);
    await act(async()=>find(view!,'서버 기록 확인').props.onClick());
    expect(find(view!,'이 브라우저 기록 계정에 저장').props.disabled).toBe(true);
    await act(async()=>find(view!,'확인한 서버 기록 불러오기').props.onClick());
    expect(replace).toHaveBeenCalledWith(server);
    act(()=>view!.unmount());
  });
  it('retries the identical write after an uncertain response, not later local edits',async()=>{
    const save=vi.fn().mockRejectedValueOnce(Error('lost response')).mockResolvedValueOnce({status:'saved' as const,revision:'r1'});
    const client:JournalCloudClient={load:async()=>null,save};
    let view:ReactTestRenderer;
    const props={owner:'u1',client,onReplace:()=>true,onExport:()=>{}};
    await act(async()=>{view=create(<TasteJournalCloudSync {...props} journal={local}/>);});
    await act(async()=>find(view!,'서버 기록 확인').props.onClick());
    await act(async()=>find(view!,'이 브라우저 기록 계정에 저장').props.onClick());
    const newer=updateJournal(local,'light',1,{memo:'new unsaved edit'});
    act(()=>view!.update(<TasteJournalCloudSync {...props} journal={newer}/>));
    await act(async()=>find(view!,'같은 저장 요청 재확인').props.onClick());
    expect(save.mock.calls[0][0]).toBe(save.mock.calls[1][0]);
    expect(JSON.stringify(view!.toJSON())).toContain('아직 저장하지 않은');
    act(()=>view!.unmount());
  });
  it('ignores an old account request after switching owner',async()=>{
    let resolve!:(row:JournalCloudRow|null)=>void;
    const client:JournalCloudClient={load:()=>new Promise(r=>{resolve=r;}),save:vi.fn()};
    let view:ReactTestRenderer;const props={journal:local,client,onReplace:()=>true,onExport:()=>{}};
    await act(async()=>{view=create(<TasteJournalCloudSync {...props} owner="u1"/>);});
    act(()=>{void find(view!,'서버 기록 확인').props.onClick();});
    act(()=>view!.update(<TasteJournalCloudSync {...props} owner="u2"/>));
    await act(async()=>resolve({state:server,revision:'private-u1'}));
    expect(find(view!,'확인한 서버 기록 불러오기').props.disabled).toBe(true);
    expect(JSON.stringify(view!.toJSON())).not.toContain('private-u1');
    act(()=>view!.unmount());
  });
  it('binds a pending write to its initiating account and ignores its response after switching',async()=>{
    let resolve!:(result:{status:'saved';revision:string})=>void;
    const save=vi.fn((_request: import('../src/lib/taste-journal-cloud').JournalCloudWrite)=>new Promise<{status:'saved';revision:string}>(r=>{resolve=r;}));
    const client:JournalCloudClient={load:async()=>null,save};
    let view:ReactTestRenderer;const props={journal:local,client,onReplace:()=>true,onExport:()=>{}};
    await act(async()=>{view=create(<TasteJournalCloudSync {...props} owner="u1"/>);});
    await act(async()=>find(view!,'서버 기록 확인').props.onClick());
    act(()=>{void find(view!,'이 브라우저 기록 계정에 저장').props.onClick();});
    expect(save.mock.calls[0][0]).toMatchObject({ownerId:'u1',state:local});
    act(()=>view!.update(<TasteJournalCloudSync {...props} owner="u2"/>));
    await act(async()=>resolve({status:'saved',revision:'u1-revision'}));
    expect(find(view!,'이 브라우저 기록 계정에 저장').props.disabled).toBe(true);
    expect(JSON.stringify(view!.toJSON())).not.toContain('계정에 저장했어요');
    act(()=>view!.unmount());
  });
  it('rejects invalid cloud payload instead of silently emptying local records',()=>{
    expect(()=>journalFromCloud({state:{version:1,entries:{broken:{memo:'missing identity'}}},revision:'r'})).toThrow();
    expect(()=>journalFromCloud({state:{version:1,entries:[]},revision:'r'})).toThrow();
  });
  it.each([
    {memo:'x'.repeat(1501)}, {before:'invalid'}, {after:null},
    {beforeSetting:-1}, {afterSetting:101}, {beforeSetting:Infinity},
    {bookmarked:'true'}, {version:0}, {version:1.5},
    {updatedAt:'not a date'}, {completedAt:'2026-02-30T00:00:00.000Z'},
    {extraField:'must not silently disappear'},
  ])('rejects invalid entry fields without coercion: %j', patch=>{
    const state={...local,entries:{light:{...local.entries.light,...patch}}};
    expect(()=>journalFromCloud({state,revision:'r'})).toThrow();
  });
  it('preserves every valid field exactly and rejects unknown top-level fields',()=>{
    const state=updateJournal(local,'light',2,{before:'a',after:'both',beforeSetting:0,afterSetting:100,memo:'a'.repeat(1500),bookmarked:true,completedAt:'2026-11-11T00:00:00.000Z'});
    const parsed=journalFromCloud({state,revision:'r'});
    expect(parsed).toEqual(state);expect(parsed).not.toBe(state);
    expect(()=>journalFromCloud({state:{...state,extra:'new schema'},revision:'r'})).toThrow();
  });

});
