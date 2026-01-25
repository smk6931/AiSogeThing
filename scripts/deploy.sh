#!/bin/bash

# ==========================================
#  AiSogeThing 자동 배포 스크립트 (PM2 버전)
# ==========================================

PROJECT_DIR="/home/ubuntu/AiSogeThing"
BACK_DIR="$PROJECT_DIR/back"
FRONT_DIR="$PROJECT_DIR/front"

echo "🚀 [1/4] 최신 코드 다운로드 (Git Pull)..."
cd "$PROJECT_DIR"
git pull origin main

echo "🐍 [2/4] 백엔드 업데이트 (Pip & DB)..."
cd "$BACK_DIR"
source ../venv/bin/activate
pip install -r ../requirements.txt

# [Fix] 서버에서는 로컬 DB 포트(5432)를 사용하도록 강제 설정
export DB_PORT=5432

# DB 마이그레이션 적용
alembic upgrade head

echo "⚛️ [3/4] 프론트엔드 업데이트 (npm install)..."
cd "$FRONT_DIR"
npm install
# (프로덕션 빌드하려면 아래 주석 해제)
# npm run build

echo "🔥 [4/4] PM2 프로세스 재시작..."
# PM2로 관리 중인 'backend', 'frontend' 프로세스 재시작
pm2 restart backend
pm2 restart frontend
# (만약 이름을 모른다면 'pm2 restart all' 사용 가능)
# pm2 restart all

echo "🎉 배포 완료! (Deployment Success)"
pm2 status


# 실행 권한 한 번만 주고
# 커맨드 : chmod +x Project_Docs/Server/deploy.sh
# 바로 실행!
# 커맨드 : ./Project_Docs/Server/deploy.sh