export interface RoomObjectMeta {
  domainId: number;
  slug: string;
  code: string;
  objectName: string;
  shortObject: string;
  domainLabel: string;
  roomZone: string;
  /** Exact coordinates in the 1376 x 768 Master Room Illustration */
  x: number;
  y: number;
  /** Watercolor reveal mask radii on the 1376 x 768 canvas */
  maskRx: number;
  maskRy: number;
  /** Offset for the floating museum pin label */
  pinOffsetX: number;
  pinOffsetY: number;
  parallaxDepth: 'back' | 'mid' | 'front';
  artworkUrl: string;
  emptyWhisper: string;
  filledWhisper: string;
}

export const ROOM_OBJECTS: RoomObjectMeta[] = [
  {
    domainId: 1,
    slug: 'fashion',
    code: '01',
    objectName: '옷걸이의 코트와 거울',
    shortObject: '코트와 거울',
    domainLabel: '패션',
    roomZone: '왼편 벽면',
    x: 235,
    y: 355,
    maskRx: 175,
    maskRy: 225,
    pinOffsetX: 25,
    pinOffsetY: 125,
    parallaxDepth: 'mid',
    artworkUrl: '/artwork/objects/fashion.jpg',
    emptyWhisper:
      '딱 떨어지는 코트가 편한지, 부드러운 니트가 편한지 사진 3장으로 내 옷 취향을 찾아봅니다.',
    filledWhisper:
      '내가 입었을 때 가장 어색하지 않고 편안한 옷 스타일을 찾았습니다.',
  },
  {
    domainId: 4,
    slug: 'visual-art',
    code: '02',
    objectName: '벽면의 액자',
    shortObject: '벽면 액자',
    domainLabel: '미술·디자인',
    roomZone: '왼편 뒷벽',
    x: 490,
    y: 218,
    maskRx: 130,
    maskRy: 160,
    pinOffsetX: 0,
    pinOffsetY: 152,
    parallaxDepth: 'back',
    artworkUrl: '/artwork/objects/visual-art.jpg',
    emptyWhisper:
      '깔끔한 기하학 그림과 거친 유화 물감 그림 중 어떤 그림에 더 눈이 가는지 알아봅니다.',
    filledWhisper:
      '방에 걸어두고 오래 봐도 질리지 않는 그림과 디자인 취향을 찾았습니다.',
  },
  {
    domainId: 2,
    slug: 'space-interior',
    code: '03',
    objectName: '아치형 창문과 조명',
    shortObject: '창문과 조명',
    domainLabel: '인테리어',
    roomZone: '방 한가운데 창가',
    x: 815,
    y: 215,
    maskRx: 215,
    maskRy: 195,
    pinOffsetX: 0,
    pinOffsetY: 108,
    parallaxDepth: 'back',
    artworkUrl: '/artwork/objects/space-interior.jpg',
    emptyWhisper:
      '비워둔 깔끔한 방과 아끼는 물건이 가득한 아늑한 방 중 어디가 더 편한지 골라봅니다.',
    filledWhisper:
      '집이나 카페에 갈 때 내가 가장 편안함을 느끼는 공간 분위기를 찾았습니다.',
  },
  {
    domainId: 9,
    slug: 'tech-cosmos',
    code: '04',
    objectName: '창가의 천체망원경',
    shortObject: '천체망원경',
    domainLabel: '기술·과학',
    roomZone: '오른편 창가',
    x: 955,
    y: 398,
    maskRx: 105,
    maskRy: 175,
    pinOffsetX: 0,
    pinOffsetY: 112,
    parallaxDepth: 'mid',
    artworkUrl: '/artwork/objects/tech-cosmos.jpg',
    emptyWhisper:
      '일상을 편하게 해주는 실용 기술과 우주·AI 같은 거대한 원리 중 어디에 흥미가 가는지 봅니다.',
    filledWhisper:
      '새로운 기술과 미래 변화를 대하는 나만의 관점을 확인했습니다.',
  },
  {
    domainId: 12,
    slug: 'philosophy',
    code: '05',
    objectName: '벽시계',
    shortObject: '벽시계',
    domainLabel: '삶의 태도',
    roomZone: '오른편 높은 벽',
    x: 1162,
    y: 198,
    maskRx: 85,
    maskRy: 125,
    pinOffsetX: 0,
    pinOffsetY: 112,
    parallaxDepth: 'back',
    artworkUrl: '/artwork/objects/philosophy.jpg',
    emptyWhisper:
      '중요한 결정을 내릴 때 확실한 계획과 그때그때의 유연함 중 무엇을 더 중시하는지 알아봅니다.',
    filledWhisper:
      '평소 선택의 기로에서 나를 움직이는 기준을 확인했습니다.',
  },
  {
    domainId: 5,
    slug: 'music',
    code: '06',
    objectName: 'LP 턴테이블과 스피커',
    shortObject: '턴테이블',
    domainLabel: '음악',
    roomZone: '왼편 오디오 선반',
    x: 162,
    y: 565,
    maskRx: 155,
    maskRy: 175,
    pinOffsetX: 15,
    pinOffsetY: 32,
    parallaxDepth: 'front',
    artworkUrl: '/artwork/objects/music.jpg',
    emptyWhisper:
      '노래를 들을 때 가사와 멜로디를 먼저 듣는지, 비트와 악기 소리를 먼저 듣는지 알아봅니다.',
    filledWhisper:
      '내가 어떤 소리와 리듬을 들을 때 가장 좋아하는지 찾았습니다.',
  },
  {
    domainId: 7,
    slug: 'literature',
    code: '07',
    objectName: '책상 위 책과 스탠드',
    shortObject: '책과 스탠드',
    domainLabel: '책·글',
    roomZone: '책상 왼편',
    x: 585,
    y: 455,
    maskRx: 140,
    maskRy: 110,
    pinOffsetX: 0,
    pinOffsetY: 66,
    parallaxDepth: 'mid',
    artworkUrl: '/artwork/objects/literature.jpg',
    emptyWhisper:
      '명쾌하게 정리된 실용·비소설과 여운이 긴 소설·에세이 중 어떤 책에 손이 가는지 골라봅니다.',
    filledWhisper:
      '오래 읽어도 지루하지 않은 글과 책의 스타일을 찾았습니다.',
  },
  {
    domainId: 3,
    slug: 'gastronomy-scent',
    code: '08',
    objectName: '커피 드리퍼와 찻잔',
    shortObject: '커피와 찻잔',
    domainLabel: '음식·향',
    roomZone: '책상 오른편',
    x: 798,
    y: 445,
    maskRx: 98,
    maskRy: 95,
    pinOffsetX: 0,
    pinOffsetY: 76,
    parallaxDepth: 'mid',
    artworkUrl: '/artwork/objects/gastronomy-scent.jpg',
    emptyWhisper:
      '산뜻하고 깔끔한 맛·향과 묵직하고 진한 맛·향 중 어느 쪽을 더 좋아하는지 알아봅니다.',
    filledWhisper:
      '평소 커피, 차, 향수, 음식을 고를 때 끌리는 취향을 찾았습니다.',
  },
  {
    domainId: 10,
    slug: 'economy',
    code: '09',
    objectName: '황동 저울과 수첩',
    shortObject: '저울과 수첩',
    domainLabel: '소비·돈',
    roomZone: '오른편 서가 선반',
    x: 1135,
    y: 448,
    maskRx: 115,
    maskRy: 125,
    pinOffsetX: 0,
    pinOffsetY: 94,
    parallaxDepth: 'mid',
    artworkUrl: '/artwork/objects/economy.jpg',
    emptyWhisper:
      '돈을 쓸 때 유명한 브랜드와 물건 자체의 실속 중 무엇을 더 중요하게 보는지 알아봅니다.',
    filledWhisper:
      '돈과 시간을 어디에 쓸 때 가장 아깝지 않은지 내 기준을 확인했습니다.',
  },
  {
    domainId: 6,
    slug: 'cinema',
    code: '10',
    objectName: '16mm 영사기',
    shortObject: '영사기',
    domainLabel: '영화·드라마',
    roomZone: '오른편 삼각대',
    x: 1280,
    y: 455,
    maskRx: 98,
    maskRy: 185,
    pinOffsetX: -22,
    pinOffsetY: 132,
    parallaxDepth: 'front',
    artworkUrl: '/artwork/objects/cinema.jpg',
    emptyWhisper:
      '전개가 빠르고 치밀한 극영화와 영상미·분위기가 좋은 영화 중 무엇을 더 좋아하는지 봅니다.',
    filledWhisper:
      '금요일 밤에 후회 없이 고를 수 있는 영화·드라마 취향을 찾았습니다.',
  },
  {
    domainId: 8,
    slug: 'travel',
    code: '11',
    objectName: '가죽 여행가방',
    shortObject: '여행가방',
    domainLabel: '여행·휴식',
    roomZone: '바닥 러그 왼편',
    x: 492,
    y: 642,
    maskRx: 115,
    maskRy: 92,
    pinOffsetX: 0,
    pinOffsetY: 38,
    parallaxDepth: 'front',
    artworkUrl: '/artwork/objects/travel.jpg',
    emptyWhisper:
      '조용한 숙소에서 쉬는 여행과 낯선 동네를 부지런히 돌아다니는 여행 중 어디가 좋은지 골라봅니다.',
    filledWhisper:
      '쉬는 날 에너지를 채워주는 나만의 여행·휴식 방식을 찾았습니다.',
  },
  {
    domainId: 11,
    slug: 'work-social',
    code: '12',
    objectName: '마주 놓인 두 의자',
    shortObject: '두 개의 의자',
    domainLabel: '인간관계·일',
    roomZone: '바닥 러그 오른편',
    x: 958,
    y: 645,
    maskRx: 245,
    maskRy: 120,
    pinOffsetX: 0,
    pinOffsetY: 46,
    parallaxDepth: 'front',
    artworkUrl: '/artwork/objects/work-social.jpg',
    emptyWhisper:
      '여럿이 의견을 나누는 자리와 혼자 깊게 집중하는 시간 중 언제 더 에너지를 얻는지 알아봅니다.',
    filledWhisper:
      '일할 때와 사람을 만날 때 가장 편안한 나만의 방식을 확인했습니다.',
  },
];

export function getRoomObjectByDomainId(
  domainId: number
): RoomObjectMeta | undefined {
  return ROOM_OBJECTS.find((obj) => obj.domainId === domainId);
}

export function getRoomObjectBySlug(slug: string): RoomObjectMeta | undefined {
  return ROOM_OBJECTS.find((obj) => obj.slug === slug);
}
