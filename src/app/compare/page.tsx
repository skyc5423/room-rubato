import Link from 'next/link';
import { artworkComparisons } from '@/lib/artwork-comparisons';
export const metadata = { title: '두 작품 사이 | Room Rubato' };
export default function ComparePage() {
 return <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 sm:pt-32"><Link href="/notes" className="underline">← 관찰실</Link><p className="mt-8 text-sm">두 작품 사이 · 약 3분</p><h1 className="mt-2 text-3xl font-semibold">같은 단서, 다른 장면</h1><p className="mt-4 leading-7">두 작품을 함께 보며 눈에 띄는 차이를 찾아보세요. 작품 설명은 그다음에 펼쳐볼 수 있어요.</p><div className="mt-8 grid gap-5 md:grid-cols-2">{artworkComparisons.map(item=><Link key={item.slug} href={`/compare/${item.slug}`} className="rounded-2xl border border-[#0042AF]/20 bg-white/70 p-6 focus-visible:outline"><h2 className="text-xl font-semibold">{item.title}</h2><p className="mt-3 leading-7">{item.cue}</p><span className="mt-5 block underline">두 작품 함께 보기 →</span></Link>)}</div></div>;
}
