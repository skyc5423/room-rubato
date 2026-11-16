/** Independently authored fictional labels; no material-performance claims. */
export const fibreWeaveExamples = [
 {id:'same-fibre',title:'같은 섬유, 다른 조직',a:'가상 설명 A · 실크 섬유 · 평직 조직',b:'가상 설명 B · 실크 섬유 · 새틴 조직',explanation:'섬유는 둘 다 실크이고, 실이 교차하는 조직 이름은 다릅니다. 같은 섬유라는 정보만으로 조직까지 같다고 볼 수 없어요.'},
 {id:'same-weave',title:'같은 조직, 다른 섬유',a:'가상 설명 A · 실크 섬유 · 평직 조직',b:'가상 설명 B · 면 섬유 · 평직 조직',explanation:'조직은 둘 다 평직이고, 섬유 이름은 다릅니다. 평직이라는 말만으로 어떤 섬유를 썼는지 알 수 없어요.'},
] as const;
/** True means the vertical warp passes above the horizontal weft at this crossing. */
export const plainWeave = Array.from({length:6},(_,row)=>Array.from({length:6},(_,column)=>(row+column)%2===0));
export const fibreWeaveSources=[
 {title:'Canadian Conservation Institute · 섬유와 직물 조직',url:'https://www.canada.ca/en/conservation-institute/services/preventive-conservation/guidelines-collections/textiles-costumes.html'},
 {title:'US National Park Service · Weaving Patterns',url:'https://www.nps.gov/articles/000/weaving-patterns.htm'},
];
