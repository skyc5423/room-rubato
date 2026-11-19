import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArtworkComparison } from '@/components/ArtworkComparison';
import { artworkComparisons } from '@/lib/artwork-comparisons';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
 const {slug}=await params;
 const study=artworkComparisons.find(item=>item.slug===slug);
 return study ? {title:`${study.title} · 두 작품 사이 | Room Rubato`,description:study.cue} : {title:'찾을 수 없는 비교 | Room Rubato',robots:{index:false,follow:false}};
}
export function generateStaticParams() { return artworkComparisons.map(({slug})=>({slug})); }
export default async function ComparisonPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const study=artworkComparisons.find(item=>item.slug===slug);
 if(!study)notFound();
 return <ArtworkComparison key={study.slug} study={study}/>;
}
