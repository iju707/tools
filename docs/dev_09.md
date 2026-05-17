# OOFBIRD Dev Tools - dev_09 작업 계획서

## 1. 개요
개발 시 자주 사용되는 다양한 데이터 포맷(JSON, YAML, XML, TOML, CSV 등) 간의 상호 변환을 지원하는 **Data Converter (데이터 포맷 변환기)** 기능을 신규 도구로 추가합니다. 직관적인 좌우 분할(Dual Pane) UI를 제공하여 실시간 변환 및 포맷팅 기능을 지원합니다.

## 2. 작업 내용
### 2.1 신규 페이지 추가: Data Converter (`/converter`)
- **라우팅 및 메뉴 추가:** `App.tsx` 및 사이드바에 'Data Converter' 메뉴 추가 (아이콘: `SyncAltIcon`)
- **레이아웃:** 좌측(Input)과 우측(Output) 패널로 나뉜 Dual Pane 구조 구현.

### 2.2 지원 포맷 및 파싱 라이브러리 도입
내부적으로 모든 입력 데이터를 일단 `JavaScript Object(JSON)`로 파싱한 후, 타겟 포맷으로 직렬화(Stringify)하는 구조를 취합니다.
- **JSON:** 내장 `JSON.parse` / `JSON.stringify`
- **YAML:** `yaml` 라이브러리 사용
- **XML:** `xml-js` 라이브러리 사용
- **TOML:** `@iarna/toml` 라이브러리 사용
- **CSV:** `papaparse` 라이브러리 사용 (1차원 객체 배열의 경우에 한해 지원)
- **URL Query String:** 내장 `URLSearchParams` 사용

### 2.3 주요 기능 (Features)
- **포맷 선택:** Input/Output 패널 상단에서 각각의 데이터 포맷을 Select Box로 선택.
- **실시간 변환:** Input 내용이 변경되거나 포맷을 변경할 때 즉각적으로 Output 창에 변환 결과 반영.
- **방향 전환 (Swap):** 입력창과 결과창의 포맷 및 텍스트 데이터를 서로 맞바꾸는 `<->` 버튼 제공.
- **Beautify & Minify:**
  - 코드를 예쁘게 정렬해주는 Format 기능 지원.
  - JSON의 경우 공백을 모두 제거하는 Minify 기능 추가.
- **에러 핸들링:** 입력 데이터의 문법이 잘못된 경우(Invalid syntax), Output 패널 혹은 하단 상태 표시줄에 에러 메시지를 명확히 표시.

## 3. UI/UX 디자인
- 화면의 80% 스케일 디자인 시스템을 유지.
- 패널 내부에서만 스크롤이 발생하도록 `flex: 1`, `overflow: auto` 적용.
- Material UI의 `TextField` (multiline) 또는 Code Editor 형태의 UI 컴포넌트 사용.
