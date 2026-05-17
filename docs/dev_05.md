# OOFBIRD Dev Tools - dev_05 작업 계획서

## 1. 개요
불필요한 메뉴를 정리하고, 애플리케이션의 타이틀을 공식 명칭으로 변경하여 서비스의 정체성을 명확히 합니다.

## 2. 작업 내용
- **메뉴 정리:** 
  - 미사용 메뉴인 `Dashboard`, `Settings` 삭제.
  - 사이드바 네비게이션에서 해당 항목 제거.
  - 라우터(Routes)에서 해당 경로 제거. `/` 접속 시 `/regex`로 리다이렉트되도록 수정.
  - 사용하지 않는 컴포넌트 파일(`src/pages/Dashboard.tsx`) 삭제.
- **타이틀 변경:** 
  - 상단 AppBar의 타이틀을 `DevTools`에서 `OOFBIRD Dev Tools`로 변경.
