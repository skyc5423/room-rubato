export interface StudyPath { id:string; title:string; description:string; lessonIds:string[]; outcome:string; }
export const studyPaths: StudyPath[] = [
 {id:'seeing-light',title:'빛에서 공간으로',description:'같은 물건이 다르게 보이는 이유를 빛·배경·거리로 나눠 봅니다.',lessonIds:['light','contrast','perspective','space'],outcome:'집이나 사진에서 눈길이 가는 자리를 빛과 경계로 설명해보기'},
 {id:'hearing-rhythm',title:'눈으로 본 리듬, 귀로 듣는 리듬',description:'배열의 간격에서 출발해 음악의 강조와 그림의 붓질을 비교합니다.',lessonIds:['rhythm','syncopation','complexity'],outcome:'규칙적인 것과 변화가 있는 것을 좋아하는 이유를 분야마다 따로 기록하기'},
 {id:'different-question',title:'좋다는 말의 여러 뜻',description:'편안함, 흥미, 곁에 두고 싶은 마음이 같은지 질문을 바꿔 봅니다.',lessonIds:['context','complexity','contrast'],outcome:'취향을 유형명 대신 상황과 관찰 근거가 있는 한 문장으로 남기기'}
];
export function getSeoulDay(date:Date) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
/** Editorial rotation, not a claim of newly published content or personalised prediction. */
export function dailyStudyId(ids:string[], date:Date):string|undefined {
 if(!ids.length)return undefined;
 const day=getSeoulDay(date);
 const index=Math.floor(Date.parse(`${day}T00:00:00Z`)/86400000);
 return ids[((index%ids.length)+ids.length)%ids.length];
}
