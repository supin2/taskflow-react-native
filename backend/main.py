from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from contextlib import asynccontextmanager

from app.schemas.schema import schema
from app.database.database import create_tables
from app.resolvers.resolvers import get_context


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

def get_context():
    """GraphQL 컨텍스트 생성"""
    db = SessionLocal()
    return {
        "db": db,
        "request": None,
        "current_user": None,
    }

graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
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