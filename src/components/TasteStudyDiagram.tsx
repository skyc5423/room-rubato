'use client';
import { useId } from 'react';
import { LessonDiagram } from '@/lib/taste-lessons';
export const CONTRAST_CENTER_COLOR = '#7e948c';
export function TasteStudyDiagram({ kind, variation = 60, labels, neutralBackground = false }: { kind: LessonDiagram; variation?: number; neutralBackground?: boolean; labels: [string, string] }) {
  const id = useId().replace(/:/g, '');
  const t = variation / 100;
  const panel = (x: number, b: boolean) => {
    const cx = x + 120;
    if (kind === 'perspective') { const vx=x+35+(b?t:0.5)*170; return <g><rect x={x+12} y="20" width="216" height="160" fill="#e6dfd1"/>{[[x+12,20],[x+228,20],[x+12,180],[x+228,180]].map(([px,py],i)=><line key={i} x1={px} y1={py} x2={vx} y2="95" stroke="#56746e" strokeWidth="2"/>)}<circle cx={vx} cy="95" r="4" fill="#b97543"/></g>; }
    if (kind === 'syncopation') return <g>{Array.from({length:16},(_,i)=><g key={i}><line x1={x+15+i*14} x2={x+15+i*14} y1="60" y2="125" stroke={i%4===0?'#627c77':'#c9d1cc'} strokeWidth={i%4===0?2:1}/>{(b?[0,3,6,10]:[0,4,8,12]).includes(i)&&<circle cx={x+15+i*14} cy="90" r="6" fill="#a9623e"/>}</g>)}</g>;
    if (kind === 'light') return <circle cx={cx} cy="100" r="58" fill={b ? `url(#shade-${id})` : '#939897'} />;
    if (kind === 'rhythm') return <g>{[0,1,2,3,4,5].map(i => <rect key={i} x={x+30+i*28+(b ? Math.sin(i)*t*15 : 0)} y="48" width="16" height="100" fill="#285950" />)}</g>;
    if (kind === 'space') return <g><rect x={x+20} y="30" width="200" height="140" rx="4" fill="#e9dfc9" stroke="#657a78"/><rect x={x+90} y="22" width="60" height="12" fill="#80b8be"/><rect x={x+40} y="60" width="45" height="25" fill="#9a6f46"/><rect x={x+135} y="130" width="55" height="20" fill="#b3a286"/><rect x={x+110} y="35" width="8" height="115" fill={b?'#5e99a3':'#506460'} opacity={b?0.15+t*0.5:1}/>{b&&<path d={`M ${x+190} 155 L ${x+117} 28`} stroke="#a86922" strokeWidth="2" strokeDasharray="4 5"/>}</g>;
    if (kind === 'contrast') return <g><rect x={x+15} y="25" width="210" height="150" rx="10" fill={neutralBackground ? '#d9d9d9' : b ? `hsl(205 10% ${12+t*18}%)` : `hsl(40 10% ${92-t*18}%)`}/><rect x={x+85} y="65" width="70" height="70" fill={CONTRAST_CENTER_COLOR}/></g>;
    if (kind === 'context') return <g>{[0,1,2].map(i=><rect key={i} x={x+40+i*55} y={b?50+(i===1?35*t:0):50} width="38" height="95" fill={i===1?'#bd774b':'#416d68'} transform={b?`rotate(${i===1?15*t:0} ${x+40+i*55+19} 95)`:undefined}/>)}</g>;
    return <g>{Array.from({length:b?16:4},(_,i)=><circle key={i} cx={x+40+(i%4)*52} cy={45+Math.floor(i/4)*36} r={b?8+t*6:14} fill={i%3===0?'#b97952':'#3b7068'} opacity={0.6+(i%2)*0.4}/>)}</g>;
  };
  return <svg viewBox="0 0 500 240" role="img" aria-label={`비교 도식: A는 ${neutralBackground?'같은 회색 배경':labels[0]}, B는 ${neutralBackground?'같은 회색 배경':labels[1]}. ${kind === 'contrast' ? `가운데 두 사각형의 색 값은 모두 ${CONTRAST_CENTER_COLOR}입니다. ${neutralBackground?'두 배경을 같은 회색으로 가린 확인 보기입니다.':`배경 명도 설정은 ${variation}입니다.`}` : '실제 작품이나 검사 문항이 아닙니다.'}`} className="w-full rounded-2xl bg-[#f6f2e8]">
    <defs><radialGradient id={`shade-${id}`} cx="28%" cy="24%" r="80%"><stop offset="0" stopColor={`hsl(145 2% ${65+t*28}%)`}/><stop offset="1" stopColor={`hsl(145 2% ${48-t*30}%)`}/></radialGradient></defs>
    {panel(0,false)}{panel(260,true)}
    <text x="120" y="211" textAnchor="middle" fontSize="13" fill="#193a39">A · {neutralBackground?'같은 회색 배경':labels[0]}</text><text x="380" y="211" textAnchor="middle" fontSize="13" fill="#193a39">B · {neutralBackground?'같은 회색 배경':labels[1]}</text>
  </svg>;
}
