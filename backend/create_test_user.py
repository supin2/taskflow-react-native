#!/usr/bin/env python3
"""
테스트용 사용자 생성 스크립트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import SessionLocal
from app.services.auth_service import AuthServiceDB

def create_test_user():
    """테스트 사용자 생성"""
    db = SessionLocal()
    try:
        auth_service = AuthServiceDB(db)
        
        # 테스트 사용자 생성
        test_user_data = {
            "email": "admin@taskflow.com",
            "password": "admin123",
            "name": "관리자"
        }
        
        try:
            user = auth_service.create_user(test_user_data)
            print(f"✅ 테스트 사용자 생성 완료: {user.email}")
            return user
        except Exception as e:
            print(f"❌ 사용자 생성 실패: {e}")
            
            # 기존 사용자 확인
            from app.models.models import User
            existing_user = db.query(User).filter(User.email == test_user_data["email"]).first()
            if existing_user:
                print(f"ℹ️  기존 사용자 존재: {existing_user.email}")
                return existing_user
            
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()