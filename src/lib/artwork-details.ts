/** Editorial view windows in the existing CC0 reproduction's pixel coordinates.
 * They change only the displayed region, never the source file or saved responses.
 * All windows are 4:3 to match ArtworkImage's frame without stretching. */
export interface ArtworkDetail {
 label:string;
 prompt:string;
 alt:string;
 crop:{x:number;y:number;width:number;height:number;sourceWidth:number;sourceHeight:number};
}
export const artworkDetails:Record<string,ArtworkDetail> = {
 '437881':{label:'주전자와 대야의 테두리',prompt:'주전자와 대야의 가장자리를 따라가 보세요. 빛이 닿은 선과 어두운 면은 어디에서 만날까요?',alt:'부분 확대: 여인의 손 아래 금속 주전자와 넓은 대야. 밝은 테두리가 어두운 몸통과 테이블 위에서 구분된다.',crop:{x:235,y:315,width:300,height:225,sourceWidth:555,sourceHeight:624}},
 '437853':{label:'왼쪽 건물과 물의 반사',prompt:'왼쪽 건물의 아래쪽에서 물 위로 눈을 옮겨보세요. 세로선이 어디까지 이어져 보이나요?',alt:'부분 확대: 왼쪽 건물과 그 아래 수면, 가까운 배들. 건물의 밝고 어두운 색이 물 위에서 길게 흔들려 보인다.',crop:{x:0,y:180,width:352,height:264,sourceWidth:599,sourceHeight:447}},
 '436105':{label:'손과 잔 사이',prompt:'잔을 건네는 손과 받으려는 손, 위를 가리키는 손을 따로 짚어보세요. 각각 어떤 방향을 만들까요?',alt:'부분 확대: 잔을 건네는 인물의 손과 소크라테스의 뻗은 팔, 위를 가리키는 손이 함께 보인다.',crop:{x:215,y:85,width:260,height:195,sourceWidth:599,sourceHeight:399}},
 '436121':{label:'꽃과 눈길, 오른쪽 화면 끝',prompt:'꽃에서 인물의 눈으로, 눈에서 오른쪽 화면 끝으로 이동해 보세요. 화면 밖에 무엇이 있을지 상상하게 되나요?',alt:'부분 확대: 꽃다발의 오른쪽과 오른쪽을 바라보는 인물의 얼굴, 작품의 오른쪽 가장자리까지 함께 보인다.',crop:{x:260,y:75,width:340,height:255,sourceWidth:600,sourceHeight:488}},
};
