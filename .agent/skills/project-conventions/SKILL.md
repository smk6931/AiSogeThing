---
name: Project Conventions & Deployment Rules
description: Essential rules for API routing, Nginx configuration, and deployment compatibility to avoid 404 errors.
---

# Project Conventions & Deployment Rules (AiSogeThing)

이 문서는 로컬 개발 환경과 서버 배포 환경(Nginx Reverse Proxy)의 차이로 인한 에러를 방지하기 위한 절대적인 규칙입니다.

## 1. API Routing & Nginx Proxy (가장 중요)
- **규칙**: 모든 백엔드 API 엔드포인트는 반드시 **`/api/`** 접두사(Prefix)를 가져야 합니다.
- **이유**: 운영 서버(sogething.com)의 Nginx는 오직 `/api`로 시작하는 요청만 백엔드(FastAPI, Port 8001)로 전달합니다. 나머지는 프론트엔드로 보냅니다.
- **예시**:
    - ❌ `router = APIRouter(prefix="/novel")` -> **서버에서 404 발생** (Nginx가 백엔드로 안 보냄)
    - ✅ `router = APIRouter(prefix="/api/novel")` -> **정상 동작**

## 2. Static File & Image Serving
- **규칙**: 백엔드가 제공하는 이미지/정적 파일의 URL도 반드시 **`/api/`** 로 시작해야 합니다.
- **구현**:
    - 파일 경로 생성 시: `f"/api/novel/image/{filename}"` (O)
    - 프론트엔드 호출 시: `<img src="/api/novel/image/..." />` (O)
- **주의**: `/novel/image/...`로 생성하면 로컬에선 되지만(포트 직접 접속 시), 서버에선 404가 뜹니다.

## 3. Frontend Development
- **규칙**: 코드 내에 `http://localhost:8001`을 하드코딩하지 마십시오.
- **해결책**:
    - `import client from '@/api/client'` 후 `client.defaults.baseURL`을 사용하십시오.
    - 또는 환경변수 `import.meta.env.VITE_API_URL`을 활용하십시오.
    - `client.js`는 배포 환경을 감지하여 자동으로 IP나 도메인을 설정하도록 되어 있습니다.

## 4. Deployment Routine (배포 루틴)
- **규칙**: 로컬에서 코드를 수정했다면, **반드시 배포 스크립트를 실행**해야 서버에 반영됩니다.
- **명령어**: `Scripts/deploy_remote.ps1`
- **증상**: "로컬은 되는데 서버는 안 돼요" -> 99% 확률로 배포 스크립트 실행 안 함(또는 커밋 안 함).

## 5. Environment Variables (.env)
- 서버의 `.env` 파일은 `pm2 restart`를 해야 변경사항이 적용됩니다.
- 로컬의 `.env`는 `npm run dev`나 `python main.py` 재시작 시 적용됩니다.

이 규칙을 무시할 경우 **"서버에서만 안 되는"** 기이한 현상에 시달리게 됩니다.
