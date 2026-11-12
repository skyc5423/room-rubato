import { notFound } from 'next/navigation';
import { ArtworkComparison } from '@/components/ArtworkComparison';
import { artworkComparisons } from '@/lib/artwork-comparisons';
export function generateStaticParams() { return artworkComparisons.map(({slug})=>({slug})); }
export default async function ComparisonPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const study=artworkComparisons.find(item=>item.slug===slug);
 if(!study)notFound();
 return <ArtworkComparison key={study.slug} study={study}/>;
}
