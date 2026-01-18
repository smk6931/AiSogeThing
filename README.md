# 💘 AiSogeThing (Project AST)

> **AI 기반 매칭 및 유튜브 콘텐츠 큐레이션 플랫폼**  
> *AI-Powered Dating & Content Curation Platform*

---

## 🌐 Live Service
**👉 [https://sogething.com](https://sogething.com) (현재 배포 및 운영 중)**  
*(Oracle Cloud 서버에서 실시간으로 기능이 업데이트되고 있습니다.)*

---

## 📅 Real-time Development Log (개발 일지)
이 프로젝트는 **매일매일 성장**하고 있습니다. 개발자의 생생한 고민과 해결 과정이 궁금하다면 아래 링크를 확인해주세요.

*   📂 **[Project_Docs/Daily_Log](./Project_Docs/Daily_Log)**: 일별 개발 로그 및 트러블 슈팅 내역
*   📂 **[Project_Docs/Process](./Project_Docs/Process)**: 서버 구축, 도메인 연결, API 설계 등 기술 문서

**[Latest Updates]**
*   ✅ **Infrastructure**: 오라클 클라우드 서버 구축 및 도메인 연결 (`sogething.com`)
*   ✅ **Security**: Nginx 리버스 프록시 및 Lets Encrypt HTTPS(SSL) 적용 완료
*   ✅ **Feature**: YouTube API 비용 절감을 위한 'RSS Seed & Harvest' 알고리즘 구현
*   ✅ **UI/UX**: Mobile-First 반응형 디자인 및 Glassmorphism 적용

---

## 🛠 Tech Stack

### Infrastructure
![Oracle Cloud](https://img.shields.io/badge/Oracle_Cloud-F80000?style=for-the-badge&logo=oracle&logoColor=white) 
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![YouTube API](https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white)

---

## 📂 Project Structure (Docs)
프로젝트의 모든 기획과 기술적 의사결정은 `Project_Docs` 폴더에 문서화되어 있습니다.

```bash
AiSogeThing/
├── Project_Docs/
│   ├── Daily_Log/       # 매일의 개발 기록 (Error Log, Idea)
│   ├── Idea/            # 핵심 기능 아이디어 (YouTube RSS 전략 등)
│   ├── Process/         # 기술 구현 가이드 (Server Setup, Domain, API Flow)
│   └── SQL/             # DB 스키마 및 쿼리
├── back/                # FastAPI Backend Server
└── front/               # React Frontend Client
```