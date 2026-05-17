# dev_10: Base64 & Hash Tool

## 개발 목표
- 텍스트 데이터를 빠르게 Base64 / URL 방식으로 인코딩 및 디코딩.
- 입력된 텍스트에 대한 주요 암호화 해시(MD5, SHA-1, SHA-256, SHA-512) 결과 실시간 제공.
- 이미지 파일을 업로드/드래그하여 CSS나 HTML에 바로 삽입할 수 있는 Base64 (Data URI) 포맷으로 즉시 변환.

## 기술 스택
- **UI Framework:** React + MUI v6
- **Hash Library:** `crypto-js`
- **File API:** 브라우저 내장 HTML5 `FileReader` API

## 주요 기능 (Features)

### 1. 문자열 처리 탭 (Text Encoder & Hash)
- **Input:** 사용자가 텍스트를 입력하거나 붙여넣을 수 있는 멀티라인 텍스트 박스.
- **Encode/Decode:**
  - Base64 Encode / Decode (유니코드 및 특수문자 완벽 지원)
  - URL Encode / Decode (`encodeURIComponent` 기반)
- **Hashes (실시간 생성):**
  - MD5
  - SHA-1
  - SHA-256
  - SHA-512

### 2. 이미지 처리 탭 (Image to Base64)
- **Drag & Drop Upload:** 사용자가 이미지를 박스 안에 끌어다 놓거나 클릭하여 업로드 가능.
- **FileReader 처리:** 서버로 파일을 전송하지 않고 브라우저 로컬 환경에서 안전하게 `readAsDataURL` 수행.
- **결과 제공 (복사 가능):**
  - **Data URI:** `data:image/png;base64,...` (CSS `background-image` 등 활용 가능)
  - **HTML Tag:** `<img src="data:..." />` 형태의 완성된 태그 제공.
  - **Raw Base64:** 헤더가 없는 순수 Base64 문자열 제공.

## 구현 상세
- `src/pages/EncoderTool.tsx`: 신규 도구 컴포넌트 생성. 상단 탭 컴포넌트(`Tabs`, `Tab`)를 활용하여 문자열 모드와 이미지 모드를 전환하도록 설계.
- 브라우저 의존성 최적화: `Buffer` 등 Node.js 환경 객체 대신 `btoa`, `atob` 및 `crypto-js`를 활용하여 순수 프론트엔드 환경에서 동작하도록 구성.
