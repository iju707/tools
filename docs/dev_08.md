# OOFBIRD Dev Tools - dev_08 작업 계획서

## 1. 개요
현재 `dayjs` 기준으로만 동작하는 Date Format Builder에 Python(`strftime`) 및 Java/C#(`SimpleDateFormat`) 포맷팅 규칙을 추가 지원하여, 다양한 언어의 개발자들이 본인에게 익숙한 포맷으로 시간을 테스트할 수 있도록 고도화합니다.

## 2. 작업 내용
- **언어별 포맷 기준 선택 기능:** 
  - 포맷 빌더 상단에 포맷 기준을 선택할 수 있는 탭(또는 토글 버튼) 추가 (옵션: `JavaScript (dayjs)`, `Python (strftime)`, `Java / C#`)
- **언어별 토큰 목록(치트시트) 제공:** 
  - 선택한 언어에 맞춰 하단의 토큰 치트시트(Chip 버튼들)가 해당 언어의 문법으로 동적 변경됨. (예: Python 선택 시 `%Y`, `%m`, `%d` 등이 표시됨)
  - 월(Month), 요일(Day of Week) 문자열 토큰(예: Jan, January, Sun, Sunday) 추가 지원.
- **실시간 포맷 매핑 로직 구현:**
  - 사용자가 입력한 타 언어의 포맷 문자열을 내부적으로 `dayjs` 포맷으로 치환(Mapping)하여 미리보기를 제공하는 로직 개발.

### 매핑 규칙 (예시)
**Python -> dayjs**
- `%Y` -> `YYYY` (연도)
- `%m` -> `MM` (월)
- `%B` -> `MMMM` (월 영문 전체)
- `%d` -> `DD` (일)
- `%A` -> `dddd` (요일 영문 전체)
- `%H` -> `HH` (시간)

**Java/C# -> dayjs**
- `yyyy` -> `YYYY` (연도)
- `dd` -> `DD` (일)
- `EEE` -> `ddd` (요일 영문 약어)
- `a` -> `A` (오전/오후)
