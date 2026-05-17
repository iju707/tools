# 개발 환경 및 배포 설정 개선 계획서 (dev_03)

## 1. 개요
현재 프로젝트의 배포 환경(GitHub Pages) 및 CI/CD(GitHub Actions)에서 발생하는 불편함을 개선합니다.
- 문서 파일(`docs/`)만 수정했을 때는 불필요한 배포 파이프라인이 실행되지 않도록 최적화합니다.
- 브라우저에서 `tools.oofbird.me/regex`와 같은 세부 URL로 직접 접속하거나 새로고침할 때 발생하는 404(Not Found) 오류를 해결합니다.

## 2. 요구 사항
1. **GitHub Actions 최적화**
   - `.github/workflows/deploy.yml` 파일 수정.
   - `paths-ignore` 속성을 이용해 `docs/**` 경로의 변경사항만 있을 시 Workflow 실행을 제외(Skip)하도록 처리.
2. **404 Routing 오류 수정**
   - React Router(`BrowserRouter`) 사용 시, GitHub Pages는 서버 사이드에서 해당 경로에 매칭되는 실제 HTML 파일이 없으면 404 페이지를 렌더링합니다.
   - 빌드 과정(`npm run build`) 완료 후 `dist/index.html` 파일을 `dist/404.html`로 복사하여, GitHub Pages가 404 발생 시에도 React 앱을 로드하도록 꼼수(Trick)를 적용합니다.

## 3. 구현 상세
### 3.1. `.github/workflows/deploy.yml` 업데이트
```yaml
on:
  push:
    branches: ["main", "master"]
    paths-ignore:
      - 'docs/**'
```
위 내용을 기존 `push` 이벤트 하위에 추가하여, 문서 수정 시 배포 액션이 실행되지 않도록 합니다.

### 3.2. `package.json` Build 스크립트 업데이트
```json
"scripts": {
  "build": "tsc -b && vite build && cp dist/index.html dist/404.html",
  // ...
}
```
Vite 빌드 스크립트에 `cp` 명령어를 추가하여 빌드 완료 후 `index.html`을 복사한 `404.html`을 생성합니다. 이를 통해 GitHub Pages가 어떤 URL로 접근하든 React 애플리케이션을 내려주고 내부의 라우터가 경로를 찾아가도록 만듭니다.

## 4. 기대 효과
- 불필요한 빌드 시간 단축 및 GitHub Actions 리소스 낭비 방지
- 사용자가 하위 URL을 통해 특정 툴 화면으로 직접 접속하거나 공유할 수 있는 정상적인 UX 보장
