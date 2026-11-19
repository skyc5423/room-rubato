import React from 'react';
import {act,create,ReactTestRenderer} from 'react-test-renderer';
import {it,expect,vi} from 'vitest';
import {LiteratureLineStudy,literatureLines} from '../src/components/LiteratureLineStudy';
it('preserves every word and punctuation while changing intentional line boundaries',()=>{
 expect(literatureLines.A.join(' ')).toBe(literatureLines.B.join(' '));
 expect(literatureLines.A).toHaveLength(2);expect(literatureLines.B).toHaveLength(3);
});
it('marks line endings accessibly without collecting or changing records',()=>{
 const storage={setItem:vi.fn(),removeItem:vi.fn()};vi.stubGlobal('localStorage',storage);vi.stubGlobal('sessionStorage',storage);
 let view:ReactTestRenderer;act(()=>{view=create(<LiteratureLineStudy/>);});
 const button=()=>view!.root.findByType('button');
 expect(button().props['aria-pressed']).toBe(false);
 act(()=>button().props.onClick());expect(button().props['aria-pressed']).toBe(true);
 expect(view!.root.findAllByProps({'aria-hidden':'true'})).toHaveLength(5);
 expect(view!.root.findByProps({role:'status'}).children.join('')).toContain('의도한 행 끝');
 act(()=>button().props.onClick());expect(button().props['aria-pressed']).toBe(false);
 expect(storage.setItem).not.toHaveBeenCalled();expect(storage.removeItem).not.toHaveBeenCalled();
 expect(view!.root.findAllByType('a').map(a=>a.props.href)).toEqual(['https://poets.org/glossary/line','https://poets.org/glossary/enjambment']);
 expect(JSON.stringify(view!.toJSON())).toContain('위 도식의 A·B와 별개');
 act(()=>view!.unmount());vi.unstubAllGlobals();
});
