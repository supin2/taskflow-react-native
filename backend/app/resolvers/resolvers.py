from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database.database import get_db
from app.models.models import User, Project, Task, Comment, ProjectMember, Notification, Activity
# GraphQL 입력 및 출력 타입들은 별도 파일에 정의
from app.models.models import Role, TaskStatus, Priority
from app.auth.auth import AuthService, security
from app.services.project_service import ProjectService
from app.services.task_service import TaskService
from app.services.auth_service import AuthServiceDB


def get_context(db: Session = Depends(get_db)):
    """
    GraphQL 컨텍스트 제공
    """
    return {
        "db": db,
        "auth_service": AuthServiceDB(db),
        "project_service": ProjectService(db),
        "task_service": TaskService(db),
    }


class QueryResolver:
    @staticmethod
    def me(info) -> Optional[User]:
        """
        현재 인증된 사용자 반환
        """
        context = info.context
        # 여기서 JWT 토큰을 통해 현재 사용자 확인
        # 실제 구현에서는 인증 미들웨어를 통해 처리
        return context["auth_service"].get_current_user()

    @staticmethod
    def projects(info) -> List[Project]:
        """
        사용자가 속한 프로젝트들 반환
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        return context["project_service"].get_user_projects(current_user.id)

    @staticmethod
    def project(info, id: str) -> Optional[Project]:
        """
        특정 프로젝트 반환
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
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
    def tasks(info, project_id: str, filter: Optional[Dict[str, Any]] = None) -> List[Task]:
        """
        프로젝트의 태스크들 반환
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["task_service"].get_tasks(project_id, filter)

    @staticmethod
    def task(info, id: str) -> Optional[Task]:
        """
        특정 태스크 반환
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        task = context["task_service"].get_task(id)
        if not task:
            return None
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, task.project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return task

    @staticmethod
    def notifications(info) -> List[Notification]:
        """
        사용자의 알림들 반환
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        return context["db"].query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(Notification.created_at.desc()).all()


class MutationResolver:
    @staticmethod
    def login(info, input: Dict[str, Any]) -> Dict[str, Any]:
        """
        로그인 처리
        """
        context = info.context
        user = context["auth_service"].authenticate_user(input["email"], input["password"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        access_token = AuthService.create_access_token(data={"sub": user.id})
        return {"token": access_token, "user": user}

    @staticmethod
    def register(info, input: RegisterInput) -> AuthPayload:
        """
        회원가입 처리
        """
        context = info.context
        
        # 이메일 중복 확인
        existing_user = context["db"].query(User).filter(User.email == input.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # 새 사용자 생성
        user = context["auth_service"].create_user(input)
        access_token = AuthService.create_access_token(data={"sub": user.id})
        return {"token": access_token, "user": user}

    @staticmethod
    def create_project(info, input: CreateProjectInput) -> Project:
        """
        프로젝트 생성
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        return context["project_service"].create_project(current_user.id, input)

    @staticmethod
    def update_project(info, id: str, input: UpdateProjectInput) -> Project:
        """
        프로젝트 수정
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
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
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # 권한 확인 (매니저 이상)
        if not context["project_service"].has_project_manage_access(current_user.id, id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["project_service"].delete_project(id)

    @staticmethod
    def create_task(info, input: CreateTaskInput) -> Task:
        """
        태스크 생성
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, input.project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["task_service"].create_task(current_user.id, input)

    @staticmethod
    def update_task(info, id: str, input: UpdateTaskInput) -> Task:
        """
        태스크 수정
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        task = context["task_service"].get_task(id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 프로젝트 접근 권한 확인
        if not context["project_service"].has_project_access(current_user.id, task.project_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return context["task_service"].update_task(id, input)

    @staticmethod
    def delete_task(info, id: str) -> bool:
        """
        태스크 삭제
        """
        context = info.context
        current_user = context["auth_service"].get_current_user()
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
        current_user = context["auth_service"].get_current_user()
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
        current_user = context["auth_service"].get_current_user()
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