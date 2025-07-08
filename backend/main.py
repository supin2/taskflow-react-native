from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from contextlib import asynccontextmanager

from app.schemas.schema import schema
from app.database.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 데이터베이스 테이블 생성
    create_tables()
    yield
    # 종료 시 정리 작업 (필요시)


# FastAPI 앱 생성
app = FastAPI(
    title="TaskFlow API",
    description="팀 협업 태스크 관리 GraphQL API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GraphQL 라우터 생성  
from app.database.database import SessionLocal

def get_graphql_context(request):
    """GraphQL 컨텍스트 생성"""
    db = SessionLocal()
    
    # 토큰에서 현재 사용자 추출
    current_user = None
    authorization = request.headers.get("authorization")
    if authorization:
        try:
            from app.auth.auth import AuthService
            from app.models.models import User
            
            # Bearer 토큰 추출
            scheme, token = authorization.split()
            if scheme.lower() == "bearer":
                # 토큰 검증
                auth_service = AuthService()
                payload = auth_service.verify_token(token)
                if payload:
                    user_id = payload.get("sub")
                    if user_id:
                        current_user = db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            print(f"토큰 검증 실패: {e}")
    
    return {
        "db": db,
        "request": request,
        "current_user": current_user,
    }

graphql_app = GraphQLRouter(
    schema,
    context_getter=get_graphql_context,
    graphql_ide="graphiql"
)

# GraphQL 엔드포인트 등록
app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
async def root():
    return {"message": "TaskFlow GraphQL API", "graphql_endpoint": "/graphql"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)