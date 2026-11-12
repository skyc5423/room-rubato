import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
vi.mock('react-dom',()=>({createPortal:(children:React.ReactNode)=>children}));
import {RoomDialog} from '../src/components/RoomDialog';

// Mount the real component/listener with a small DOM adapter; no browser layout/Tab default is simulated.
class Node {
 tagName:string;isConnected=true;tabIndex=0;parentElement:Node|null=null;children:Node[]=[];attrs=new Set<string>();visible=true;visibility='visible';disabled=false;
 constructor(tag='BUTTON',parent?:Node){this.tagName=tag;if(parent){this.parentElement=parent;parent.children.push(this);}}
 focus=vi.fn(()=>{doc.activeElement=this;});
 contains(node:unknown):boolean{return node===this||this.children.some(child=>child.contains(node));}
 hasAttribute(name:string){return this.attrs.has(name);}
 matches(){return this.disabled||this.attrs.has('type-hidden');}
 closest(){for(let node:Node|null=this;node;node=node.parentElement)if(node.attrs.has('hidden')||node.attrs.has('inert'))return node;return null;}
 getClientRects(){return this.visible?[{}]:[];}
 querySelector(){return this.children.find(child=>child.tagName==='SUMMARY')||null;}
 querySelectorAll=vi.fn((selector:string)=>{
  const list:Node[]=[];const walk=(node:Node)=>{for(const child of node.children){if(child.tagName!=='DETAILS'&&(child.tagName!=='SUMMARY'||selector.includes('summary')))list.push(child);walk(child);}};walk(this);return list;
 });
}
let doc:any,listener:(event:any)=>void,opener:Node,panel:Node,view:ReactTestRenderer|undefined;
beforeEach(()=>{opener=new Node();panel=new Node('DIV');panel.tabIndex=-1;doc={activeElement:opener,body:{style:{overflow:'auto'}},addEventListener:vi.fn((_name,fn)=>{listener=fn;}),removeEventListener:vi.fn()};vi.stubGlobal('document',doc);vi.stubGlobal('HTMLElement',Node);vi.stubGlobal('getComputedStyle',(node:Node)=>({visibility:node.visibility}));});
afterEach(()=>{if(view)act(()=>view!.unmount());view=undefined;vi.unstubAllGlobals();});
function mount(close=vi.fn()){act(()=>{view=create(<RoomDialog onClose={close}><details><summary>저장된 점수와 문항별 선택</summary><a href="/source">출처</a></details><button>다시 선택하기</button><button>닫기</button></RoomDialog>,{createNodeMock:element=>element.props.role==='dialog'?panel:null});});return close;}
function key(key='Tab',shiftKey=false){const event={key,shiftKey,preventDefault:vi.fn()};act(()=>listener(event));return event;}
it('includes native disclosure in both boundaries, leaving Enter/Space and interior Tab native',()=>{
 const details=new Node('DETAILS',panel);const summary=new Node('SUMMARY',details);const link=new Node('A',details);const retry=new Node('BUTTON',panel);const close=new Node('BUTTON',panel);mount();
 expect(doc.activeElement).toBe(panel);key();expect(doc.activeElement).toBe(summary);
 expect(key('Enter').preventDefault).not.toHaveBeenCalled();expect(key(' ').preventDefault).not.toHaveBeenCalled();
 expect(key().preventDefault).not.toHaveBeenCalled(); // native browser moves summary→retry
 retry.focus();expect(key('Tab',true).preventDefault).not.toHaveBeenCalled();
 summary.focus();key('Tab',true);expect(doc.activeElement).toBe(close);key();expect(doc.activeElement).toBe(summary);expect(link.focus).not.toHaveBeenCalled();
});
it('excludes hidden/disabled controls and closed details contents, admitting links when opened',()=>{
 const details=new Node('DETAILS',panel);const summary=new Node('SUMMARY',details);const link=new Node('A',details);
 const disabled=new Node('BUTTON',panel);disabled.disabled=true;
 const hidden=new Node('BUTTON',panel);hidden.attrs.add('hidden');
 const inert=new Node('BUTTON',panel);inert.attrs.add('inert');
 const cssHidden=new Node('BUTTON',panel);cssHidden.visible=false;
 const invisible=new Node('BUTTON',panel);invisible.visibility='hidden';
 const removed=new Node('BUTTON',panel);removed.tabIndex=-1;
 mount();key('Tab',true);expect(doc.activeElement).toBe(summary);
 details.attrs.add('open');panel.focus();key('Tab',true);expect(doc.activeElement).toBe(link);key();expect(doc.activeElement).toBe(summary);
 for(const item of [disabled,hidden,inert,cssHidden,invisible,removed])expect(item.focus).not.toHaveBeenCalled();
});
it('returns orphaned/body focus inside and handles an empty dialog',()=>{
 const retry=new Node('BUTTON',panel);mount();doc.activeElement=doc.body;key();expect(doc.activeElement).toBe(retry);
 retry.disabled=true;doc.activeElement=doc.body;expect(key().preventDefault).toHaveBeenCalled();expect(doc.activeElement).toBe(panel);
});
it('preserves Escape callback freshness, body overflow and opener restoration',()=>{
 new Node('BUTTON',panel);const initial=mount();expect(doc.body.style.overflow).toBe('hidden');const next=vi.fn();act(()=>view!.update(<RoomDialog onClose={next}><button>닫기</button></RoomDialog>));expect(key('Escape').preventDefault).toHaveBeenCalledOnce();expect(next).toHaveBeenCalledOnce();expect(initial).not.toHaveBeenCalled();act(()=>view!.unmount());view=undefined;expect(doc.body.style.overflow).toBe('auto');expect(doc.activeElement).toBe(opener);expect(doc.removeEventListener).toHaveBeenCalledWith('keydown',listener);
});
it('honors positive tabindex endpoints before normal DOM-order controls',()=>{
 const normal=new Node('BUTTON',panel);const second=new Node('BUTTON',panel);second.tabIndex=2;const first=new Node('BUTTON',panel);first.tabIndex=1;mount();key();expect(doc.activeElement).toBe(first);key('Tab',true);expect(doc.activeElement).toBe(normal);
});

it('restores focus-capable SVG openers but not disconnected elements',()=>{
 const svg={isConnected:true,focus:vi.fn()};doc.activeElement=svg;mount();act(()=>view!.unmount());view=undefined;expect(svg.focus).toHaveBeenCalledOnce();
 const detached={isConnected:false,focus:vi.fn()};doc.activeElement=detached;mount();act(()=>view!.unmount());view=undefined;expect(detached.focus).not.toHaveBeenCalled();
});
it('keeps open inner details hidden under a closed outer disclosure, then includes textarea endpoint',()=>{
 const outer=new Node('DETAILS',panel);const outerSummary=new Node('SUMMARY',outer);const inner=new Node('DETAILS',outer);inner.attrs.add('open');const innerSummary=new Node('SUMMARY',inner);const innerLink=new Node('A',inner);const textarea=new Node('TEXTAREA',inner);
 mount();key('Tab',true);expect(doc.activeElement).toBe(outerSummary);expect(innerSummary.focus).not.toHaveBeenCalled();expect(innerLink.focus).not.toHaveBeenCalled();expect(textarea.focus).not.toHaveBeenCalled();
 outer.attrs.add('open');panel.focus();key('Tab',true);expect(doc.activeElement).toBe(textarea);key();expect(doc.activeElement).toBe(outerSummary);
 textarea.disabled=true;panel.focus();key('Tab',true);expect(doc.activeElement).toBe(innerLink);
});
