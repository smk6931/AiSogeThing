================================================================================
                                개발 명령어 모음집
================================================================================

[ 가상환경 (Virtual Environment) ]
--------------------------------------------------------------------------------
1. 생성 (Windows)
   python -m venv venv

2. 활성화 (Windows Powershell)
   .\venv\Scripts\activate

3. 비활성화
   deactivate


[ 패키지 관리 (Pip) ]
--------------------------------------------------------------------------------
1. 패키지 설치
   pip install [패키지명]

2. 현재 패키지 목록 저장 (requirements.txt 생성)
   pip freeze > requirements.txt

3. requirements.txt로 한방에 설치
   pip install -r requirements.txt


[ 서버 실행 (Server Run) ]
--------------------------------------------------------------------------------
1. FastAPI (Uvicorn) - 개발 모드 (자동 재시작)
   uvicorn main:app --reload

2. Streamlit 
   streamlit run [파일명.py]

3. Next.js (Frontend)
   npm run dev

4. FastAPI (Uvicorn)
   python -m uvicorn main:app --reload --port 8001

[ Git (자주 쓰는 명령어) ]
--------------------------------------------------------------------------------
1. 상태 확인
   git status

2. 모든 변경사항 스테이징
   git add .

3. 커밋
   git commit -m "메시지 내용"

4. 푸시
   git push origin main


[ Docker (컨테이너) ]
--------------------------------------------------------------------------------
1. 컨테이너 실행 (빌드 포함)
   docker-compose up --build

2. 컨테이너 중지
   docker-compose down


[ React (Frontend) 설치 및 실행 ]
--------------------------------------------------------------------------------
* 주의: React는 Python 가상환경(venv)이 아닌, Node.js 환경에서 별도로 설치됩니다.

1. 프로젝트 생성 (Vite 사용)
   npx create-vite@latest frontend --template react

2. 의존성 설치
   cd frontend
   npm install

3. 개발 서버 실행
   npm run dev


[ 서버 ]
1. ssh -i "C:\경로\ssh-key-2026-01-17.key" ubuntu@오라클공인IP 서버 터미널 접속
   ssh -i "C:\Users\ssh\ssh-key-oracle.key" ubuntu@168.107.52.201

2. 가상환경 활성화 (혹시 모르니)
   source venv/bin/activate

pkill -f uvicorn
pkill -f streamlit



3. Backend 실행 (FastAPI, 8080포트)
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8080 > server.log 2>&1 &

4. Frontend 실행 (Streamlit, 8501포트)
nohup streamlit run ui/main_ui.py --server.port 8501 --server.address 0.0.0.0 > ui.log 2>&1 &



1. 우분투 시스템 업데이트 (윈도우 업데이트 같은 것)
sudo apt update && sudo apt upgrade -y

2. 필수 도구 설치 (파이썬 패키지 관리자, 가상환경, 깃, cURL)
sudo apt install -y python3-pip python3-venv git curl

3. Node.js(리액트용) 최신 버전(18.x) 저장소 등록
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

4. Node.js 설치
sudo apt install -y nodejs

<br>

[Method 2] SCP로 로컬 파일 직접 전송 (Git 안 쓸 때)
주의: node_modules(프론트 라이브러리)랑 venv(가상환경) 폴더는 복사하면 안 됩니다! 
(윈도우용이랑 리눅스용 파일이 달라서, 복사해가면 서버 고장납니다.)

1. 터미널(Powershell)에서 프로젝트 상위 폴더로 이동 (예시)
cd c:\GitHub

2. 전송 명령어 (node_modules, venv 빼고 보내는게 좋음)
scp -i "C:\Users\ssh\ssh-key-oracle.key" -r "AiSogeThing" ubuntu@168.107.52.201:/home/ubuntu/

(전송 후에는 서버에서 반드시 `npm install`, `pip install` 다시 해줘야 함)