from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import User, Role
from app.schemas.schema import RegisterInput
from app.auth.auth import AuthService


class AuthServiceDB:
    def __init__(self, db: Session):
        self.db = db
        self.auth_service = AuthService()

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        사용자 인증
        """
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        if not self.auth_service.verify_password(password, user.password_hash):
            return None
        
        return user

    def create_user(self, input: RegisterInput) -> User:
        """
        새 사용자 생성
        """
        # 이메일 중복 확인
        existing_user = self.db.query(User).filter(User.email == input.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # 비밀번호 해싱
        hashed_password = self.auth_service.hash_password(input.password)
        
        # 새 사용자 생성
        user = User(
            email=input.email,
            name=input.name,
            password_hash=hashed_password,
            role=Role.MEMBER
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user

    def get_current_user(self) -> Optional[User]:
        """
        현재 인증된 사용자 반환
        TODO: 실제 구현에서는 JWT 토큰을 통해 현재 사용자 확인
        """
        # 임시로 첫 번째 사용자 반환 (개발용)
        return self.db.query(User).first()

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        ID로 사용자 조회
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        이메일로 사용자 조회
        """
        return self.db.query(User).filter(User.email == email).first()