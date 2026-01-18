#!/bin/bash

# ==========================================
# AiSogeThing 자동 배포 스크립트 (One-Click Deploy)
# 사용법: ./deploy.sh
# ==========================================

PROJECT_DIR="/home/ubuntu/AiSogeThing"
BACK_DIR="$PROJECT_DIR/back"
FRONT_DIR="$PROJECT_DIR/front"
LOG_DIR="$PROJECT_DIR/logs"

# 로그 폴더 생성
mkdir -p "$LOG_DIR"

echo "🚀 [1/5] 최신 코드 다운로드 (Git Pull)..."
cd "$PROJECT_DIR"
git pull origin main

echo "🐍 [2/5] 백엔드 업데이트 (Pip & DB)..."
cd "$BACK_DIR"
# 가상환경 활성화 (없으면 에러 날 수 있으니 체크)
source ../venv/bin/activate
pip install -r requirements.txt
# DB 마이그레이션 (DB 구조 변경사항 적용)
# alembic upgrade head 
# (아직 DB 세팅 전이면 에러 날 수 있어서 주석 처리함. 나중에 주석 해제하세요!)

echo "⚛️ [3/5] 프론트엔드 패키지 설치..."
cd "$FRONT_DIR"
npm install

echo "🔄 [4/5] 기존 서비스 종료 (Kill Process)..."
# 백엔드(8080) 종료
pkill -f "uvicorn main:app" || echo "백엔드가 실행 중이 아닙니다."
# 프론트엔드(3000) 종료 (node 프로세스)
fuser -k 3000/tcp || echo "프론트엔드가 실행 중이 아닙니다."

echo "🔥 [5/5] 서비스 재시작 (Restart)..."

# 백엔드 시작 (포트 8080)
cd "$BACK_DIR"
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8080 > "$LOG_DIR/backend.log" 2>&1 &
echo "✅ Backend Started (Port 8080)"

# 프론트엔드 시작 (포트 3000)
cd "$FRONT_DIR"
# (주의: 실제 운영에선 build 후 serve를 권장하지만, 현재 설정 유지 위해 dev 사용)
nohup npm run dev -- --host 0.0.0.0 --port 3000 > "$LOG_DIR/frontend.log" 2>&1 &
echo "✅ Frontend Started (Port 3000)"

echo "🎉 배포 완료! (Deployment Success)"
