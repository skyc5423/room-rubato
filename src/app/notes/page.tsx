import { TasteNotebook } from '@/components/TasteNotebook';
export const metadata = { title: '관찰실 · 취향 노트 | Room Rubato', description: '명암, 간격, 공간을 직접 바꿔 보고 관찰 전후의 선택과 이유를 기록하는 여덟 가지 탐색.' };
export default async function NotesPage({searchParams}:{searchParams:Promise<{lesson?:string|string[]}>}) { const {lesson}=await searchParams; return <TasteNotebook initialLesson={typeof lesson==='string'?lesson:undefined}/>; }
