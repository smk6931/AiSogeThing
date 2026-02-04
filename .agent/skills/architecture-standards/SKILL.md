# 프로젝트 아키텍처 및 구조 가이드 (Architecture Standards)

## 1. 개요: 모듈러 모놀리스 (Modular Monolith)
이 프로젝트는 **도메인(기능) 중심**으로 폴더를 구성하는 모듈러 모놀리스 아키텍처를 따릅니다. 계층별(routers, services 등)로 상위 폴더를 나누지 않고, 하나의 기능을 수행하는 모든 파일을 하나의 도메인 폴더에 응집시킵니다.

---

## 2. 백엔드 구조 (`back/`)

### 핵심 원칙: Identity와 Context의 분리
- **`user/` (Identity)**: 계정의 근본(회원가입, 로그인, 탈퇴)만 다루며 최상위 독립 도메인입니다. (API 경로: `/api/auth`)
- **`content/` (Service Context)**: 소개팅 앱의 핵심 기능(유튜브, 챗봇, 매칭 등)이 하위 도메인으로 존재합니다. (API 경로: `/api/content/...`)
- **`game/` (Game Context)**: 3D RPG 게임 관련 로직이 존재합니다. (API 경로: `/api/game/...`)
- **`core/`**: DB 연결(`database.py`), 전역 설정 등 모든 도메인이 공유하는 엔진 역할을 합니다.

---

## 3. 프론트엔드 구조 (`front/src/`)

### 앱 중심 구조 (`apps/`)
- 모든 화면과 도메인 로직은 `apps/` 폴더 산하의 독립된 앱 공간에 위치합니다.
  - `apps/auth/`: 로그인, 회원가입 관련 페이지.
  - `apps/content/`: 홈, 배너, 매칭, 커뮤니티 등 서비스 메인 기능.
  - `apps/game/`: RPG 월드, 캐릭터 엔티티, 게임 전용 UI.

### 중앙 집중형 API 관리 (`shared/api/`)
- **가장 중요한 규칙**: 모든 API 호출 로직은 각 앱 폴더가 아닌 `src/shared/api/` 폴더에서 중앙 관리합니다.
- **폴더 구성**:
  - `shared/api/client.js`: 공통 Axios 인스턴스.
  - `shared/api/auth/`: 인증 관련 API.
  - `shared/api/content/`: 유튜브, 챗봇, 노벨 등 콘텐츠 API.
  - `shared/api/game/`: 게임 동기화 및 데이터 API.

---

## 4. 절대 경로 별칭 (Alias) 사용 규칙
상대 경로(`../../../../`)의 복잡성을 방지하기 위해 반드시 다음 별칭을 사용해야 합니다:

- **`@api`**: `src/shared/api` (API 호출 시 필수 사용)
- **`@shared`**: `src/shared` (공통 컨텍스트, 훅 등)
- **`@auth`**: `src/apps/auth`
- **`@content`**: `src/apps/content`
- **`@game`**: `src/apps/game`
- **`@`**: `src/`

---

## 5. 코딩 시 주의사항
- **임포트 금지**: 도메인 간의 직접적인 참조는 가급적 피하며, 필요한 경우 `shared`를 통해 소통합니다.
- **파일명 준수**: API 파일명과 폴더명은 도메인 이름을 따라 일관성을 유지합니다. (예: `@api/content/youtube`)
- **파일 이동**: 새로운 기능을 추가할 때 위 구조를 위반하는 위치(예: `apps/content/api/...`)에 파일을 생성하지 마십시오.
