from typing import Optional
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from app.auth.auth import AuthService
from app.database.database import SessionLocal
from app.models.models import User


class AuthMiddleware:
    """JWT 인증 미들웨어"""
    
    def __init__(self):
        self.auth_service = AuthService()
    
    def get_current_user_from_request(self, request: Request) -> Optional[User]:
        """
        요청에서 JWT 토큰을 추출하여 사용자 정보 반환
        """
        authorization: str = request.headers.get("Authorization")
        if not authorization:
            return None
        
        try:
            # Bearer 토큰 추출
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return None
            
            # 토큰 검증
            payload = self.auth_service.verify_token(token)
            if not payload:
                return None
            
            user_id = payload.get("sub")
            if not user_id:
                return None
            
            # 데이터베이스에서 사용자 조회
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                return user
            finally:
                db.close()
                
        except (ValueError, AttributeError):
            return None
        
        return None
    
    def require_auth(self, request: Request) -> User:
        """
        인증이 필요한 엔드포인트에서 사용
        인증되지 않은 경우 401 에러 발생
        """
        user = self.get_current_user_from_request(request)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user


# 전역 미들웨어 인스턴스
auth_middleware = AuthMiddleware()