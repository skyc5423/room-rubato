import Link from 'next/link';
import { artworkComparisons } from '@/lib/artwork-comparisons';
export const metadata = { title: '두 작품 사이 | Room Rubato' };
export default function ComparePage() {
 return <div className="mx-auto max-w-5xl px-5 pb-20 pt-32"><Link href="/notes" className="underline">← 관찰실</Link><p className="mt-8 text-sm">두 작품 사이 · 약 3분</p><h1 className="mt-2 text-3xl font-semibold">같은 단서, 다른 장면</h1><p className="mt-4 leading-7">설명을 먼저 외우지 않아도 괜찮아요. 실제 작품 두 점을 함께 놓고, 눈에 보이는 차이 하나에서 시작해 보세요.</p><div className="mt-8 grid gap-5 md:grid-cols-2">{artworkComparisons.map(item=><Link key={item.slug} href={`/compare/${item.slug}`} className="rounded-2xl border border-[#0042AF]/20 bg-white/70 p-6 focus-visible:outline"><h2 className="text-xl font-semibold">{item.title}</h2><p className="mt-3 leading-7">{item.cue}</p><span className="mt-5 block underline">두 작품 함께 보기 →</span></Link>)}</div></div>;
}
