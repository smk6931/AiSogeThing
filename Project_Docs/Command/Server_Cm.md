[ 서버 접속 명령어 ]
ssh -i "C:\Users\ssh\ssh-key-oracle.key" ubuntu@168.107.52.201

=======================================================

[ 코드 & 설정파일 업데이트 (SCP 직접 전송) ]
* 주의사항 1: 터미널 위치는 프로젝트 최상위 폴더(c:\GitHub\AiSogeThing)여야 함.
* 주의사항 2: node_modules 같은 무거운 폴더는 보내지 않음.

0. (필수) 서버에 폴더 만들기 (최초 1회 또는 에러 날 때)
# (이거 먼저 실행해서 방을 만들어야 전송이 됩니다)
ssh -i "C:\Users\ssh\ssh-key-oracle.key" ubuntu@168.107.52.201 "mkdir -p /home/ubuntu/AiSogeThing/front"

1. 백엔드 업데이트
scp -i "C:\Users\ssh\ssh-key-oracle.key" -r back ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/
scp -i "C:\Users\ssh\ssh-key-oracle.key" requirements.txt ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/
scp -i "C:\Users\ssh\ssh-key-oracle.key" .env ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/

2. 프론트엔드 업데이트 (경로 수정됨)
# (주의: 끝에 /src/ 붙이지 마세요. front/ 안에 쏙 들어가게 해뒀습니다.)
scp -i "C:\Users\ssh\ssh-key-oracle.key" -r front/src ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/front/

# 모듈설치 시 보내기
scp -i "C:\Users\ssh\ssh-key-oracle.key" -r front/public ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/front/
scp -i "C:\Users\ssh\ssh-key-oracle.key" front/package.json ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/front/
scp -i "C:\Users\ssh\ssh-key-oracle.key" front/vite.config.js ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/front/

scp -i "C:\Users\ssh\ssh-key-oracle.key" front/index.html ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/front/
scp -i "C:\Users\ssh\ssh-key-oracle.key" front/.env ubuntu@168.107.52.201:/home/ubuntu/AiSogeThing/front/


=======================================================
1. 백엔드 초기 셋팅


2. 프론트엔드 초기 셋팅
sudo apt update
sudo apt install -y nodejs

[ 서버 실행 명령어 (서버 접속 후 입력) ]

1. 백엔드 실행 (8080포트)
cd ~/AiSogeThing/back
source ../venv/bin/activate
nohup python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080 > server.log 2>&1 &


2. 프론트엔드 실행
cd ~/AiSogeThing/front
npm install
nohup npm run dev -- --host 0.0.0.0 --port 3000 > front.log 2>&1 &


3. 서버 로그 보기
tail -f server.log
tail -f front.log

4. 서버 끄기 (프로세스 kill)
pkill -f uvicorn
pkill -f "npm run dev"

sudo lsof -i :3000
sudo kill -9 <PID>

0. 프론트엔드 Node.js 버전 업그레이드 (18 -> 20)
  1. 기존 버전 삭제      : sudo apt remove -y nodejs
  2. Node 20 저장소 등록 : curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  3. Node 20 설치       : sudo apt install -y nodejs
  4. 버전 확인          : node -
  

0. 리엑트 라이브러리 다 지우기
rm -rf node_modules package-lock.json

0. 서버 방화벽 문 개방
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
sudo netfilter-persistent save
