# Project: Developer All-in-One Tools

## 🎯 프로젝트 개요
**Tools** 프로젝트는 개발자들을 위한 다양한 유틸리티 도구들을 한 곳에 모아둔 "All-in-One 유틸리티 웹사이트"입니다. 
복잡한 설치 과정 없이 웹 브라우저에서 바로 접근하여 개발 생산성을 높일 수 있는 여러 도구(포맷터, 인코더/디코더, 생성기 등)를 제공하는 것을 목표로 합니다.

## 🛠️ 기술 스택 (Tech Stack)
- **Framework:** React 19 (via Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Deployment:** GitHub Pages (via GitHub Actions)
- **Domain:** tools.oofbird.me

## 📐 아키텍처 및 UI 구조
본 프로젝트는 확장성을 고려하여 **대시보드 레이아웃(Dashboard Layout)** 을 기본 골격으로 채택했습니다.
- **Sidebar (사이드바):** 다양한 유틸리티 도구들로 이동할 수 있는 네비게이션 메뉴.
- **Header (헤더):** 현재 사용 중인 도구의 이름과 사용자 프로필, 설정 기능 제공.
- **Main Content (메인 컨텐츠 영역):** 선택한 유틸리티 도구가 렌더링되는 넓은 작업 공간.

## 🚀 배포 파이프라인
`.github/workflows/deploy.yml` 파일에 정의된 GitHub Actions를 통해 CI/CD가 구성되어 있습니다.
- `main` 브랜치에 코드가 Push 되면 자동으로 빌드(`npm run build`)가 수행됩니다.
- 빌드된 결과물(dist)은 GitHub Pages 환경으로 배포되어 `tools.oofbird.me` 도메인을 통해 전 세계에 서비스됩니다.

## 📝 향후 개발 계획 가이드
새로운 유틸리티 도구를 추가할 때의 일반적인 워크플로우는 다음과 같습니다:
1. `src/components/` 또는 `src/tools/` 디렉토리에 새로운 도구 컴포넌트 생성
2. `App.tsx` (또는 추후 도입될 라우팅 시스템)의 사이드바에 해당 도구로 가는 링크 추가
3. 각 도구는 독립적인 컴포넌트로 관리하여 유지보수성을 극대화
