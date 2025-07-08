# TaskFlow - 팀 협업 태스크 관리 앱

## 프로젝트 개요
React Native + GraphQL을 활용한 팀 협업 태스크 관리 앱입니다.

## 기술 스택
- **Frontend**: React Native + TypeScript, GraphQL + React Query, Zustand
- **Backend**: FastAPI, Strawberry GraphQL, SQLite, Redis
- **Cross-platform**: React Native Web 지원

## 프로젝트 구조
```
taskflow-react-native/
├── backend/          # FastAPI + GraphQL 서버
├── frontend/         # React Native 앱
└── docs/            # 프로젝트 문서
```

## 실행 방법

### 백엔드 서버
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 프론트엔드 앱
```bash
cd frontend
npm install
npm start
```
