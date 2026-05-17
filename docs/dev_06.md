# OOFBIRD Dev Tools - dev_06 작업 계획서

## 1. 개요
화면에 더 많은 정보를 효과적으로 표시하기 위해 전체적인 UI 사이즈를 80% 수준으로 축소합니다. 

## 2. 작업 내용
- **기준 폰트 사이즈 조정:** `index.css`에서 `html` 요소의 `font-size`를 80%로 설정하여 Tailwind CSS의 `rem` 기반 크기가 전체적으로 80% 축소되도록 변경합니다. (기본 16px -> 12.8px)
- **MUI 테마 적용:** `main.tsx`에 `ThemeProvider`를 추가하고, MUI가 변경된 기준 폰트 크기(12.8px)를 인지하도록 `htmlFontSize`를 설정합니다. 또한 MUI의 `spacing` 유닛도 `rem` 기반으로 변경하여 패딩 및 마진이 비율에 맞게 함께 축소되도록 구현합니다.
