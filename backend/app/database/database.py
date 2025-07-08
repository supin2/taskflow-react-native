from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

# 데이터베이스 URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./taskflow.db")

# SQLAlchemy 엔진 생성
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스
Base = declarative_base()


def get_db():
    """
    데이터베이스 세션을 생성하고 반환하는 의존성 함수
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    모든 테이블을 생성하는 함수
    """
    from app.models.models import Base
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """
    모든 테이블을 삭제하는 함수 (개발용)
    """
    from app.models.models import Base
    Base.metadata.drop_all(bind=engine)