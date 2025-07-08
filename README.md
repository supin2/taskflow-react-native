# TaskFlow - 팀 협업 태스크 관리 앱

## 프로젝트 개요
React Native + GraphQL을 활용한 팀 협업 태스크 관리 앱입니다.

## 기술 스택
- **Frontend**: React Native + TypeScript, Apollo Client GraphQL, Zustand
- **Backend**: FastAPI, Strawberry GraphQL, SQLAlchemy, SQLite
- **UI**: Material Design 3 (React Native Paper)
- **Cross-platform**: React Native Web 지원

## 프로젝트 구조
```
taskflow-react-native/
├── backend/               # FastAPI + GraphQL 서버
│   ├── app/
│   │   ├── auth/         # JWT 인증
│   │   ├── database/     # 데이터베이스 설정
│   │   ├── models/       # SQLAlchemy 모델
│   │   ├── resolvers/    # GraphQL 리졸버
│   │   ├── schemas/      # GraphQL 스키마
│   │   └── services/     # 비즈니스 로직
│   ├── main.py          # 서버 진입점
│   └── requirements.txt
├── frontend/TaskFlowApp/  # React Native 앱
│   ├── src/
│   │   ├── components/   # 재사용 컴포넌트
│   │   ├── navigation/   # 네비게이션
│   │   ├── screens/      # 화면 컴포넌트
│   │   ├── services/     # GraphQL 쿼리/뮤테이션
│   │   ├── store/        # Zustand 상태 관리
│   │   └── types/        # TypeScript 타입
│   ├── app.json
│   └── package.json
└── README.md
```

## 주요 기능 (Phase 1)
- ✅ 사용자 인증 (JWT 기반 로그인/회원가입)
- ✅ 프로젝트 관리 (생성, 수정, 삭제)
- ✅ 태스크 관리 (CRUD, 상태 변경, 우선순위)
- ✅ 댓글 시스템
- ✅ 실시간 UI 업데이트
- ✅ Material Design 3 UI/UX

## 설치 및 실행

### 사전 요구사항
- Python 3.8+
- Node.js 16+
- npm 또는 yarn
- iOS 시뮬레이터 (macOS) 또는 Android 에뮬레이터

### 1. 백엔드 서버 실행

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
pip3 install -r requirements.txt

# 서버 시작 (방법 1)
python3 main.py

# 또는 uvicorn으로 직접 실행 (방법 2)
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

서버가 성공적으로 시작되면:
- **API 서버**: http://localhost:8000
- **GraphQL Playground**: http://localhost:8000/graphql
- **헬스체크**: http://localhost:8000/health

### 2. 프론트엔드 앱 실행

```bash
# 프론트엔드 디렉토리로 이동
cd frontend/TaskFlowApp

# 의존성 설치 (패키지 호환성 문제가 있을 경우)
npm install --legacy-peer-deps

# 또는 일반 설치
npm install

# 개발 서버 시작
npm start
```

### 3. 앱 실행 방법

#### 웹 브라우저에서 실행
```bash
# Metro 서버가 시작된 후
w  # 웹 브라우저에서 열기
```
브라우저에서 http://localhost:8081 접속

#### iOS 시뮬레이터에서 실행
```bash
# 방법 1: Metro 서버가 시작된 후 터미널에서
i  # iOS 시뮬레이터에서 열기

# 방법 2: 직접 실행 (네이티브 빌드)
npx expo run:ios

# 방법 3: 시뮬레이터 먼저 실행 후 Metro 서버에서 i 키
open -a Simulator  # 시뮬레이터 실행
npm start          # Metro 서버 시작 후 i 키 누르기
```

**iOS 시뮬레이터 요구사항** (macOS만 가능):
- Xcode 설치 필요
- iOS Simulator 실행: `open -a Simulator`

#### Android 에뮬레이터에서 실행
```bash
# 방법 1: Metro 서버가 시작된 후 터미널에서
a  # Android 에뮬레이터에서 열기

# 방법 2: 직접 실행 (네이티브 빌드)
npx expo run:android

# 방법 3: 에뮬레이터 먼저 실행 후 Metro 서버에서 a 키
# Android Studio에서 AVD Manager로 에뮬레이터 실행
npm start  # Metro 서버 시작 후 a 키 누르기
```

**Android 에뮬레이터 요구사항**:
- Android Studio 설치
- Android SDK 및 에뮬레이터 설정
- 에뮬레이터가 실행 중이어야 함

#### 실제 기기에서 실행
```bash
# Expo Go 앱 설치 후 QR 코드 스캔
# Metro 서버 시작 시 터미널에 표시되는 QR 코드 스캔
```

### 4. 개발 도구

#### GraphQL Playground 사용
1. 백엔드 서버 실행 후 http://localhost:8000/graphql 접속
2. 샘플 쿼리:
```graphql
query {
  me {
    id
    name
    email
  }
}

mutation {
  login(input: { email: "test@example.com", password: "password" }) {
    token
    user {
      name
    }
  }
}
```

#### React Native 디버깅
- **개발자 메뉴**: 시뮬레이터에서 `Cmd+D` (iOS) 또는 `Cmd+M` (Android)
- **리로드**: `Cmd+R`
- **React DevTools**: `npx react-devtools`

## 문제 해결

### 의존성 충돌 문제
```bash
npm install --legacy-peer-deps
```

### react-native-gesture-handler 오류
```bash
# 의존성 설치
npm install react-native-gesture-handler --legacy-peer-deps

# App.tsx 파일 상단에 import 추가
import 'react-native-gesture-handler';
```

### Metro 포트 충돌 문제
```bash
# 다른 포트 사용
npx expo start --port 8082

# 또는 기존 프로세스 종료
lsof -ti:8081 | xargs kill -9
```

### 서버 연결 문제
```bash
# 백엔드 서버 상태 확인
curl http://localhost:8000/health

# GraphQL 엔드포인트 확인
curl -X POST http://localhost:8000/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'

# 서버 프로세스 확인
lsof -i :8000

# 기존 서버 종료 후 재시작
lsof -ti:8000 | xargs kill -9
cd backend && python3 main.py
```

### Network Error 422 해결
- 백엔드 서버가 실행 중인지 확인
- GraphQL 스키마 오류 확인
- 인증 토큰 문제 확인 (로그인 전에는 공개 API만 사용)

### iOS 시뮬레이터 문제
- Xcode 명령줄 도구 설치: `xcode-select --install`
- 시뮬레이터 재시작: `xcrun simctl shutdown all && xcrun simctl boot "iPhone 15 Pro"`

### Android 에뮬레이터 문제
- Android Studio의 AVD Manager에서 에뮬레이터 상태 확인
- `adb devices`로 연결된 기기 확인
- 에뮬레이터 재시작

## 추가 명령어

### 프로젝트 빌드
```bash
# iOS 빌드
npx expo build:ios

# Android 빌드  
npx expo build:android

# 웹 빌드
npx expo build:web
```

### 프로덕션 실행
```bash
# 백엔드 프로덕션 모드
uvicorn main:app --host 0.0.0.0 --port 8000

# 프론트엔드 최적화 빌드
npm run build
```

## API 문서

### 주요 GraphQL 쿼리 및 뮤테이션

#### 인증
```graphql
# 로그인
mutation {
  login(input: { email: "user@example.com", password: "password" }) {
    token
    user {
      id
      name
      email
    }
  }
}

# 회원가입
mutation {
  register(input: { email: "user@example.com", password: "password", name: "User Name" }) {
    token
    user {
      id
      name
      email
    }
  }
}
```

#### 프로젝트 관리
```graphql
# 프로젝트 목록
query {
  projects {
    id
    name
    description
    createdAt
  }
}

# 프로젝트 생성
mutation {
  createProject(input: { name: "새 프로젝트", description: "프로젝트 설명" }) {
    id
    name
    description
  }
}
```

#### 태스크 관리
```graphql
# 태스크 목록
query {
  tasks(projectId: "project-id") {
    id
    title
    description
    status
    priority
    assignee {
      name
    }
    dueDate
  }
}

# 태스크 생성
mutation {
  createTask(input: {
    title: "새 태스크"
    description: "태스크 설명"
    projectId: "project-id"
    priority: MEDIUM
  }) {
    id
    title
    status
  }
}
```

## 라이센스
MIT License