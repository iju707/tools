# dev_14: Regex 및 Time & Date 도구 화면 표준 일치화

## 개발 목표
- `ConverterTool` 및 `EncoderTool`에서 정립한 **MUI v6 화면 표준 레이아웃 규격**을 `RegexTool` 및 `TimeDateTool`에 일관되게 적용하여 전체 서비스의 시각적 통일성과 프리미엄 퀄리티를 완성합니다.
- 복잡한 Tailwind CSS 스타일과 HTML 요소를 걷어내고 컴파일 에러 없는 온전한 MUI v6 컴포넌트 구조로 교체합니다.

---

## 주요 변경 사항

### 1. 정규표현식 도구 화면 전면 리팩토링 (`src/pages/RegexTool.tsx`)
- **최외각 박스 및 가로폭 제한**: 최외각 컨테이너를 `<Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1600, mx: 'auto' }}>`로 교체하여 타 화면들과 폭 및 여백을 완전히 맞췄습니다.
- **상단 타이틀 영역 구조화**: 타이틀 및 부가 정보 공간을 일괄 통일된 구조로 맞췄습니다.
- **정규표현식 입력 패널**: MUI `Card` 표준 스타일 및 회색 헤더바(`bgcolor: 'grey.50'`)를 입혔으며, 슬림하고 미려한 `/ pattern / flags` TextField 구조로 변경했습니다. 정규식 오류 에러 메시지 영역도 MUI 스타일과 매칭되도록 가독성을 높였습니다.
- **AST Analyzer 및 Test String & Matches 스플릿 레이아웃**:
  - 두 서브 패널을 타 화면과 동일한 아웃라인 카드 구조로 감싸고 상단에 회색 헤더 영역을 두어 콘텐츠 영역과 시각적으로 명확히 분리되게 설계했습니다.
  - AST 트리 노드 렌더러를 MUI `Typography`, `Box`, `Chip`을 조합하여 프리미엄 테마에 맞는 색상과 폰트 크기로 전면 업그레이드했습니다.
  - Test String 입력창, 하이라이트 매칭 결과 영역, 매칭 상세 정보의 패딩과 간격을 표준 간격(`gap: 2`, `p: 3`)에 맞춰 다듬었습니다.

### 2. 시간 & 날짜 변환기 화면 규격 정돈 (`src/pages/TimeDateTool.tsx`)
- **가로폭 최대화 확대**: 기존 `maxWidth: 1400`이었던 설정을 **`maxWidth: 1600`**으로 확장하여 와이드 모니터 등 대화면에서의 통일감을 완성했습니다.
- **타이틀 상단 여백 규격화**: 타이틀 영역에 일체감 있는 여백과 타이틀 크기를 정의했습니다.
- **헤더바 및 패딩 표준화**:
  - `Two-way Converter` 및 `Date Format Builder` 카드 영역에 회색 헤더바(`<Box sx={{ bgcolor: 'grey.50' }}>`)를 도입하여 각 헤더에 아이콘(`SwapVertIcon`, `CalendarTodayIcon`)과 타이틀을 단정하게 정렬했습니다.
  - 두 변환기 카드의 내부 내용 여백을 표준에 맞추어 `p: 3`으로 통정했습니다.
  - 패널 간 간격(`gap`)을 기존 `3`에서 표준인 **`2`**로 조정하여 컴팩트하고 세련된 레이아웃을 형성했습니다.

### 3. 컴파일 오류 수정 및 최적화
- `RegexTool.tsx` 내 사용되지 않던 미사용 선언(`CardContent`, `Avatar`)을 정리하여 컴파일 경고를 해소했습니다.
- React 19 환경 하에서 MUI `Stack` 컴포넌트의 타입 제약조건(특히 `alignItems` prop 등)으로 인해 발생하던 TS2769 타입 컴파일 에러를 해결하기 위해, 더욱 직관적이고 안정적인 `<Box sx={{ display: 'flex', ... }}>` Flexbox 레이아웃 형태로 교체하여 `npm run build` 빌드를 성공시켰습니다.
