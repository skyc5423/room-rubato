import {useEffect,useState} from 'react';

export type WriterState='checking'|'held'|'busy'|'unsupported'|'failed';
// Cooperative single-writer lease. Never steal another tab's lock.
export function useNotebookWriter(owner:string,ready:boolean){
  const [attempt,retry]=useState(0);
  const [lease,setLease]=useState<{owner:string;state:WriterState}>({owner,state:'checking'});
  useEffect(()=>{
    if(!ready)return;
    let active=true;let release:(()=>void)|undefined;
    setLease({owner,state:'checking'});
    const set=(state:WriterState)=>{if(active)setLease({owner,state});};
    try {
      const locks=typeof window==='undefined'?undefined:window.navigator?.locks;
      if(!locks){set('unsupported');return;}
      void locks.request(`room-rubato:notebook-writer:${owner}`,{mode:'exclusive',ifAvailable:true},lock=>{
        if(!active)return;
        if(!lock){set('busy');return;}
        set('held');
        return new Promise<void>(resolve=>{release=resolve;});
      }).catch(()=>set('failed'));
    } catch {set('failed');}
    return ()=>{active=false;release?.();};
  },[owner,ready,attempt]);
  const state=ready&&lease.owner===owner?lease.state:'checking';
  return {state,canWrite:state==='held'||state==='unsupported',retry:()=>retry(n=>n+1)};
}
