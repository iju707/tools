# OOFBIRD Dev Tools - dev_07 작업 계획서

## 1. 개요
타임스탬프와 날짜/시간 포맷을 손쉽게 변환하고 테스트할 수 있는 **Time & Date** 툴을 추가합니다.

## 2. 작업 내용
- **의존성 추가:** 날짜 처리를 위해 가벼운 `dayjs` 라이브러리를 사용합니다. (`utc`, `timezone` 플러그인 포함)
- **Time & Date 페이지 구현 (`src/pages/TimeDateTool.tsx`):**
  - **World Time:** 상단에 현재 시간을 기준으로 KST, UTC, PST, EST 시계를 실시간(1초 단위 틱)으로 표시합니다.
  - **Two-way Converter:** 타임스탬프 값을 입력하면 날짜로 변환하고, 날짜를 입력하면 타임스탬프로 실시간 상호 변환됩니다.
  - **Format Builder:** 포맷 문자열(예: `YYYY-MM-DD`)을 입력하면 실시간으로 결과를 미리보기 형태로 보여주며, 각 포맷 토큰(`YYYY`, `MM` 등)에 대한 설명을 툴팁(Tooltip) 형식으로 제공하여 화면 공간을 절약합니다.
- **네비게이션 연동:** `App.tsx` 사이드바 메뉴에 "Time & Date"를 추가합니다.
