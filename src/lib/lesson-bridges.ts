/** Original editorial prompts, not measured transfer outcomes or personal recommendations. */
export interface LessonBridge { to: string; connection: string; question: string; }
export const lessonBridges: Record<string, LessonBridge[]> = {
 light: [
  {to:'contrast',connection:'물체 안의 명암에서 물체 주변의 색으로 옮겨봅니다.',question:'대상 색은 같아도 배경이 바뀌면 어떻게 보일까요?'},
  {to:'context',connection:'보이는 형태에서 그것을 고르는 기준으로 질문을 바꿉니다.',question:'입체적으로 보이는 쪽과 방에 두고 싶은 쪽은 같을까요?'},
  {to:'space',connection:'그림의 명암은 빛을 표현하고, 건물의 창과 벽은 실제 빛의 통로를 만듭니다. 공간 활동의 국내 사례에서 뮤지엄 SAN을 살펴보세요.',question:'밖이 보이는 창과 빛이 들어오는 틈은 같은 곳인가요?'}],
 rhythm: [
  {to:'space',connection:'막대 사이의 빈틈에서 공간을 나누는 경계로 옮겨봅니다.',question:'시선이 통하는 것과 사람이 지나는 것은 어떻게 다를까요?'},
  {to:'complexity',connection:'간격의 규칙에서 여러 형태의 반복으로 시선을 넓힙니다.',question:'요소가 많아져도 규칙을 찾으면 읽기 편해질까요?'}],
 space: [
  {to:'rhythm',connection:'공간의 구획에서 물건 사이의 간격으로 옮겨봅니다.',question:'물건 수를 그대로 두고 간격만 바꾸면 무엇이 달라질까요?'},
  {to:'light',connection:'시선이 통하는 경계에서 형태 안의 밝고 어두운 부분으로 옮겨봅니다.',question:'같은 형태라도 명암이 생기면 부피가 다르게 느껴질까요?'}],
 contrast: [
  {to:'light',connection:'주변 배경의 차이와 물체 안의 명암을 나눠봅니다.',question:'배경이 아니라 물체 안의 밝기를 바꾸면 무엇이 달라질까요?'},
  {to:'context',connection:'주변색의 영향에서 감상 질문의 영향으로 옮겨봅니다. 둘은 같은 현상이 아닙니다.',question:'더 선명하게 보이는 것과 곁에 두고 싶은 것은 같은 판단일까요?'}],
 context: [
  {to:'complexity',connection:'좋아함과 흥미를 구분했던 질문을 낯선 구성에 적용해봅니다.',question:'쉽게 읽히는 쪽과 더 알고 싶은 쪽은 같을까요?'},
  {to:'contrast',connection:'질문 때문에 달라진 선택과 배경 때문에 달라진 인상을 구분해봅니다.',question:'대상 색이 같아도 주변색에 따라 보이는 인상은 달라질까요?'}],
 complexity: [
  {to:'context',connection:'편안함과 호기심에서 생활 공간과 대화라는 사용 맥락으로 옮겨봅니다.',question:'오래 이야기하고 싶은 그림을 방에도 걸고 싶을까요?'},
  {to:'rhythm',connection:'많은 요소 속 규칙에서 같은 수의 형태 사이 간격으로 좁혀봅니다.',question:'요소를 더하지 않고도 간격만으로 복잡한 느낌을 만들 수 있을까요?'}],
 perspective: [
  {to:'space',connection:'그림 속 깊이를 만드는 선에서 공간을 나누는 경계로 옮겨봅니다.',question:'깊어 보이는 것과 시선이 통하는 것은 어떻게 다를까요?'},
  {to:'light',connection:'선의 수렴과 명암이라는 서로 다른 입체 표현을 비교합니다.',question:'모이는 선이 없는 원에서도 명암만으로 부피가 느껴질까요?'}],
 syncopation: [
  {to:'rhythm',connection:'소리의 시간 간격과 형태의 공간 간격을 따로 비교합니다. 선호가 같을 필요는 없어요.',question:'눈으로 볼 때도 일정한 간격과 변화하는 간격 중 끌리는 쪽이 있나요?'},
  {to:'context',connection:'따라가기 편함과 다시 듣고 싶음을 나눴던 질문을 그림에 옮겨봅니다.',question:'그림에서도 편안함과 이야기하고 싶은 마음이 다를까요?'}]
};
