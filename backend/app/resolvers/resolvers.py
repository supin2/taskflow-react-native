from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.models import User, Project, Task, Comment, ProjectMember, Notification, Activity
# GraphQL 입력 및 출력 타입들은 별도 파일에 정의
from app.models.models import Role, TaskStatus, Priority
from app.auth.auth import AuthService, security
from app.auth.middleware import auth_middleware
from app.services.project_service import ProjectService
from app.services.task_service import TaskService
from app.services.auth_service import AuthServiceDB


def get_context(request, db: Session):
    """
    GraphQL 컨텍스트 제공
    """
    # 요청에서 현재 사용자 추출
    current_user = auth_middleware.get_current_user_from_request(request)
    
    return {
        "db": db,
        "request": request,
        "current_user": current_user,
        "auth_service": AuthServiceDB(db),
        "project_service": ProjectService(db),
        "task_service": TaskService(db),
        "auth_middleware": auth_middleware,
    }


class QueryResolver:
    @staticmethod
    def me(info) -> Optional[User]:
        """
        현재 인증된 사용자 반환
        """
        context = info.context
        current_user = context["current_user"]
        
        if current_user:
            # Role enum을 GraphQL 호환 형식으로 변환
            from app.schemas.types import Role as GraphQLRole
            current_user.role = GraphQLRole(current_user.role.value) if hasattr(current_user.role, 'value') else GraphQLRole(current_user.role)
        
        return current_user

    @staticmethod
    def projects(info) -> List[Project]:
        """
        사용자가 속한 프로젝트들 반환
        """
        try:
            context = info.context
            db = context["db"]
            current_user = context["current_user"]
            
            print(f"🔍 projects query - current_user: {current_user.id if current_user else None}")
            
            # 인증 확인
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # 프로젝트 서비스 생성
            from app.services.project_service import ProjectService
            project_service = ProjectService(db)
            
            # 사용자가 속한 프로젝트들 반환
            projects = project_service.get_user_projects(current_user.id)
            print(f"✅ Found {len(projects)} projects for user {current_user.id}")
            return projects
            
        except Exception as e:
            print(f"❌ Error in projects query: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise e

    @staticmethod
    def project(info, id: str) -> Optional[Project]:
        """
        특정 프로젝트 반환
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        project = context["project_service"].get_project(id)
        if not project:
            return None
        
        # 권한 확인
        if not context["project_service"].has_project_access(current_user.id, id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return project

    @staticmethod
    def tasks(info, projectId: str, filter = None) -> List[Task]:
        """
        프로젝트의 태스크들 반환
        """
        context = info.context
        db = context["db"]
        current_user = context["current_user"]
        
        # 인증 확인
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # 태스크 서비스 생성
        from app.services.task_service import TaskService
        task_service = TaskService(db)
        
        # 태스크 조회
        tasks = task_service.get_tasks(projectId, filter)
        
        # Enum 값들을 GraphQL 호환 형태로 변환
        from app.schemas.types import TaskStatus as GraphQLTaskStatus, Priority as GraphQLPriority
        for task in tasks:
            task.status = GraphQLTaskStatus(task.status.value) if hasattr(task.status, 'value') else GraphQLTaskStatus(task.status)
            task.priority = GraphQLPriority(task.priority.value) if hasattr(task.priority, 'value') else GraphQLPriority(task.priority)
        
        return tasks

    @staticmethod
    def task(info, id: str) -> Optional[Task]:
        """
        특정 태스크 반환
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        task = context["task_service"].get_task(id)
        if not task:
            return None
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, task.project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Enum 값들을 GraphQL 호환 형태로 변환
        from app.schemas.types import TaskStatus as GraphQLTaskStatus, Priority as GraphQLPriority
        task.status = GraphQLTaskStatus(task.status.value) if hasattr(task.status, 'value') else GraphQLTaskStatus(task.status)
        task.priority = GraphQLPriority(task.priority.value) if hasattr(task.priority, 'value') else GraphQLPriority(task.priority)
        
        return task

    @staticmethod
    def notifications(info) -> List[Notification]:
        """
        사용자의 알림들 반환
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        return context["db"].query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(Notification.created_at.desc()).all()


class MutationResolver:
    @staticmethod
    def login(info, input):
        """
        로그인 처리 (자동 회원가입 포함)
        """
        context = info.context
        db = context["db"]
        
        # 간단한 인증 서비스 생성
        from app.services.auth_service import AuthServiceDB
        auth_service = AuthServiceDB(db)
        
        # 기존 사용자 인증 시도
        user = auth_service.authenticate_user(input.email, input.password)
        
        if not user:
            # 사용자가 없으면 자동으로 새 계정 생성
            try:
                # 이름이 없으면 이메일에서 추출
                name = getattr(input, 'name', input.email.split("@")[0])
                
                auto_register_input = {
                    "email": input.email,
                    "password": input.password,
                    "name": name
                }
                
                user = auth_service.create_user_if_not_exists(auto_register_input)
                print(f"✅ 자동 회원가입 완료: {user.email}")
                
            except Exception as e:
                print(f"❌ 자동 회원가입 실패: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
        
        access_token = AuthService.create_access_token(data={"sub": user.id})
        
        # AuthPayload 객체 생성 (types.py에서 import 필요)
        from app.schemas.types import AuthPayload, Role as GraphQLRole
        
        # Role enum을 GraphQL 호환 형식으로 변환
        user.role = GraphQLRole(user.role.value) if hasattr(user.role, 'value') else GraphQLRole(user.role)
        
        return AuthPayload(token=access_token, user=user)

    @staticmethod
    def register(info, input):
        """
        회원가입 처리
        """
        context = info.context
        db = context["db"]
        
        # 간단한 인증 서비스 생성
        from app.services.auth_service import AuthServiceDB
        auth_service = AuthServiceDB(db)
        
        # 이메일 중복 확인
        existing_user = db.query(User).filter(User.email == input.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # 새 사용자 생성
        user_input = {
            "email": input.email,
            "password": input.password,
            "name": input.name
        }
        user = auth_service.create_user(user_input)
        access_token = AuthService.create_access_token(data={"sub": user.id})
        
        # AuthPayload 객체 생성 (types.py에서 import 필요)
        from app.schemas.types import AuthPayload, Role as GraphQLRole
        
        # Role enum을 GraphQL 호환 형식으로 변환
        user.role = GraphQLRole(user.role.value) if hasattr(user.role, 'value') else GraphQLRole(user.role)
        
        return AuthPayload(token=access_token, user=user)

    @staticmethod
    def create_project(info, input) -> Project:
        """
        프로젝트 생성
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        return context["project_service"].create_project(current_user.id, input)

    @staticmethod
    def update_project(info, id: str, input) -> Project:
        """
        프로젝트 수정
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # 권한 확인 (매니저 이상)
        if not context["project_service"].has_project_manage_access(current_user.id, id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["project_service"].update_project(id, input)

    @staticmethod
    def delete_project(info, id: str) -> bool:
        """
        프로젝트 삭제
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # 권한 확인 (매니저 이상)
        if not context["project_service"].has_project_manage_access(current_user.id, id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["project_service"].delete_project(id)

    @staticmethod
    def create_task(info, input) -> Task:
        """
        태스크 생성
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, input.projectId):
            raise HTTPException(status_code=403, detail="Access denied")
        
        task = context["task_service"].create_task(current_user.id, input)
        
        # Enum 값들을 GraphQL 호환 형태로 변환
        from app.schemas.types import TaskStatus as GraphQLTaskStatus, Priority as GraphQLPriority
        task.status = GraphQLTaskStatus(task.status.value) if hasattr(task.status, 'value') else GraphQLTaskStatus(task.status)
        task.priority = GraphQLPriority(task.priority.value) if hasattr(task.priority, 'value') else GraphQLPriority(task.priority)
        
        return task

    @staticmethod
    def update_task(info, id: str, input) -> Task:
        """
        태스크 수정
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        task = context["task_service"].get_task(id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, task.project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        updated_task = context["task_service"].update_task(id, input)
        
        # Enum 값들을 GraphQL 호환 형태로 변환
        from app.schemas.types import TaskStatus as GraphQLTaskStatus, Priority as GraphQLPriority
        updated_task.status = GraphQLTaskStatus(updated_task.status.value) if hasattr(updated_task.status, 'value') else GraphQLTaskStatus(updated_task.status)
        updated_task.priority = GraphQLPriority(updated_task.priority.value) if hasattr(updated_task.priority, 'value') else GraphQLPriority(updated_task.priority)
        
        return updated_task

    @staticmethod
    def delete_task(info, id: str) -> bool:
        """
        태스크 삭제
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        task = context["task_service"].get_task(id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, task.project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["task_service"].delete_task(id)

    @staticmethod
    def add_comment(info, task_id: str, content: str) -> Comment:
        """
        댓글 추가
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        task = context["task_service"].get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, task.project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["task_service"].add_comment(current_user.id, task_id, content)

    @staticmethod
    def mark_notification_read(info, id: str) -> bool:
        """
        알림 읽음 처리
        """
        context = info.context
        current_user = context["current_user"]
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        notification = context["db"].query(Notification).filter(
            Notification.id == id,
            Notification.user_id == current_user.id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        context["db"].commit()
        return True

    @staticmethod
    def refresh_token(info):
        """
        토큰 재발급
        """
        context = info.context
        current_user = context["current_user"]
        
        # 인증 확인
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # 새 토큰 생성
        access_token = AuthService.create_access_token(data={"sub": current_user.id})
        
        # AuthPayload 객체 생성
        from app.schemas.types import AuthPayload, Role as GraphQLRole
        
        # Role enum을 GraphQL 호환 형식으로 변환
        current_user.role = GraphQLRole(current_user.role.value) if hasattr(current_user.role, 'value') else GraphQLRole(current_user.role)
        
        return AuthPayload(token=access_token, user=current_user)

    @staticmethod
    def update_profile(info, input):
        """
        프로필 업데이트 처리
        """
        context = info.context
        current_user = context["current_user"]
        db = context["db"]
        
        # 인증 확인
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        try:
            # 현재 사용자의 데이터베이스 객체 가져오기
            from app.models.models import User
            user = db.query(User).filter(User.id == current_user.id).first()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # 업데이트할 필드들 확인 및 적용
            updated_fields = []
            
            if input.name is not None:
                if len(input.name.strip()) < 2:
                    raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
                user.name = input.name.strip()
                updated_fields.append("name")
            
            if input.email is not None:
                import re
                email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
                if not re.match(email_pattern, input.email):
                    raise HTTPException(status_code=400, detail="Invalid email format")
                
                # 이메일 중복 확인 (현재 사용자 제외)
                existing_user = db.query(User).filter(
                    User.email == input.email,
                    User.id != current_user.id
                ).first()
                if existing_user:
                    raise HTTPException(status_code=400, detail="Email already exists")
                
                user.email = input.email.strip()
                updated_fields.append("email")
            
            if input.avatar is not None:
                user.avatar = input.avatar
                updated_fields.append("avatar")
            
            # 변경사항이 있는 경우에만 업데이트
            if updated_fields:
                from datetime import datetime
                user.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(user)
                print(f"✅ Profile updated for user {user.id}: {', '.join(updated_fields)}")
            else:
                print("ℹ️ No changes to update")
            
            # Role enum을 GraphQL 호환 형식으로 변환
            from app.schemas.types import Role as GraphQLRole
            user.role = GraphQLRole(user.role.value) if hasattr(user.role, 'value') else GraphQLRole(user.role)
            
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Error updating profile: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Internal server error")


class SubscriptionResolver:
    @staticmethod
    async def task_updated(info, project_id: str):
        """
        태스크 업데이트 실시간 알림
        """
        # 실제 구현에서는 Redis나 WebSocket을 사용
        pass

    @staticmethod
    async def new_comment(info, task_id: str):
        """
        새 댓글 실시간 알림
        """
        # 실제 구현에서는 Redis나 WebSocket을 사용
        pass

    @staticmethod
    async def project_activity(info, project_id: str):
        """
        프로젝트 활동 실시간 알림
        """
        # 실제 구현에서는 Redis나 WebSocket을 사용
        pass