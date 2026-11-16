import type { Metadata } from 'next';
import { getDomainBySlug } from '@/lib/domains-index';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
 const {slug}=await params;
 const domain=getDomainBySlug(slug);
 return domain ? {title:`${domain.shortTitle} · 취향 고르기 | Room Rubato`,description:`${domain.shortTitle} 분야에서 직접 선택하고, 내가 고른 응답의 단서를 돌아봅니다.`} : {title:'찾을 수 없는 분야 | Room Rubato',robots:{index:false,follow:false}};
}
export default function Layout({children}:{children:React.ReactNode}) { return children; }
