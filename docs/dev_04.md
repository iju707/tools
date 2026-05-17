# Material UI 전환 및 레이아웃 개선 계획서 (dev_04)

## 1. 개요
프로젝트의 전반적인 디자인 시스템을 **Material UI(MUI)** 중심으로 전환합니다.
기존 Tailwind CSS로 수동 구성했던 화면 레이아웃(Sidebar, Header)을 MUI 컴포넌트로 전면 교체하여 보다 표준화되고 부드러운 사용자 경험을 제공합니다.

## 2. 요구 사항
1. **Material UI 도입 및 적용**
   - MUI 코어 패키지 및 아이콘 패키지 설치
   - `AGENT.md`의 기술 스택을 MUI 중심으로 변경 (수정 완료)
2. **상단바(Header / AppBar) 개편**
   - MUI `<AppBar>` 및 `<Toolbar>` 적용
   - 좌측: 사이드바 영역의 축소/확대를 토글할 수 있는 햄버거(Menu) 버튼 추가
   - 우측: 기존의 알림(Notification) 아이콘과 사용자 프로필 아바타 제거
   - 우측: MUI `<GitHubIcon>`을 배치하여 클릭 시 현재 프로젝트의 Repository(`https://github.com/iju707/tools`)로 이동
3. **사이드바(Sidebar / Drawer) 개편**
   - MUI `<Drawer>` 및 `<List>` 적용
   - 상단 토글 버튼과 연동되는 접힘/펼침(Collapse/Expand) 동작 지원
   - 펼침 상태(Expanded): 아이콘과 메뉴 텍스트 표시
   - 접힘 상태(Collapsed): 메뉴 텍스트 숨김 처리, 아이콘만 중앙 정렬 표시

## 3. 구현 상세
### 3.1. 의존성 설치
```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

### 3.2. App.tsx 레이아웃 교체
- 기존 `div`, `aside`, `header` 기반의 하드코딩된 레이아웃을 지우고, MUI의 미니 드로어(Mini variant drawer) 패턴을 적용합니다.
- `isSidebarOpen` 상태를 선언하여 `<Drawer>` 컴포넌트의 `open` 프로퍼티와 연결하고, 펼쳐질 때의 너비와 접힐 때의 너비를 CSS transition으로 부드럽게 연결합니다.

## 4. 기대 효과
- MUI 전환을 통해 이후 새로운 유틸리티 툴을 추가할 때 버튼, 텍스트 필드, 셀렉트 박스 등 표준화된 고품질 컴포넌트를 즉각 활용할 수 있습니다.
- 사이드바 접기 기능을 통해 툴(Regex, Dashboard 등)이 표시되는 메인 작업 공간을 더 넉넉하게 확보할 수 있습니다.
