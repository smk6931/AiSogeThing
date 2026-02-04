---
name: 배포 및 서버 관리 규칙
description: 배포 스크립트 실행, 환경 변수 자동화 및 PM2 프로세스 관리 절차입니다.
---

# 배포 및 서버 관리 규칙

로컬 변경 사항을 서버에 반영하고 서버 상태를 유지하기 위한 가이드입니다.

## 1. 배포 루틴 (Deployment)
- **명령어**: `./scripts/deploy.sh` (서버에서 실행)
- **절차**: 
    1. 로컬에서 코드 Commit & Push
    2. 서버 접속 후 배포 스크립트 실행
- **참고**: 스크립트 실행 시 Git pull, DB Migration, Build, PM2 재시작이 자동 진행됩니다.

## 2. 환경 변수 (.env)
- **로컬**: `c:\GitHub\AiSogeThing\.env` 수정 후 서버 재시작 필요 없음 (HMR).
- **서버**: 서버의 `.env` 수정 시 반드시 `pm2 restart all` 명령어로 반영해야 합니다.

## 3. DB 마이그레이션 (Alembic)
- **명령어**: `.\venv\Scripts\python -m alembic upgrade head`
- **규칙**: DB 스키마가 변경되면 반드시 마이그레이션 파일을 생성하고 배포 시 반영하십시오.
