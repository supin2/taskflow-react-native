import strawberry
from typing import List, Optional
from datetime import datetime
from enum import Enum


@strawberry.enum
class Role(Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"


@strawberry.enum
class TaskStatus(Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"


@strawberry.enum
class Priority(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


@strawberry.type
class User:
    id: str
    email: str
    name: str
    avatar: Optional[str] = None
    role: Role
    created_at: datetime
    updated_at: datetime


@strawberry.type
class Project:
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


@strawberry.type
class ProjectMember:
    id: str
    user: User
    project: Project
    role: Role
    joined_at: datetime


@strawberry.type
class Task:
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: Priority
    assignee: Optional[User] = None
    project: Project
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


@strawberry.type
class Comment:
    id: str
    content: str
    author: User
    task: Task
    created_at: datetime
    updated_at: datetime


@strawberry.type
class Attachment:
    id: str
    filename: str
    url: str
    size: int
    task: Task
    uploaded_by: User
    created_at: datetime


@strawberry.type
class Activity:
    id: str
    action: str
    description: str
    user: User
    task: Optional[Task] = None
    project: Optional[Project] = None
    created_at: datetime


@strawberry.type
class Notification:
    id: str
    title: str
    message: str
    user: User
    is_read: bool
    created_at: datetime


@strawberry.type
class ProjectStats:
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    completion_rate: float


# Input Types
@strawberry.input
class CreateProjectInput:
    name: str
    description: Optional[str] = None


@strawberry.input
class UpdateProjectInput:
    name: Optional[str] = None
    description: Optional[str] = None


@strawberry.input
class CreateTaskInput:
    title: str
    description: Optional[str] = None
    project_id: str
    assignee_id: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    due_date: Optional[datetime] = None


@strawberry.input
class UpdateTaskInput:
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None


@strawberry.input
class TaskFilter:
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    assignee_id: Optional[str] = None
    search: Optional[str] = None


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.input
class RegisterInput:
    email: str
    password: str
    name: str


@strawberry.type
class AuthPayload:
    token: str
    user: User


# Query Type
@strawberry.type
class Query:
    @strawberry.field
    def me(self, info) -> Optional[User]:
        # 현재 인증된 사용자 반환
        pass

    @strawberry.field
    def projects(self, info) -> List[Project]:
        # 사용자가 속한 프로젝트들 반환
        pass

    @strawberry.field
    def project(self, info, id: str) -> Optional[Project]:
        # 특정 프로젝트 반환
        pass

    @strawberry.field
    def tasks(self, info, project_id: str, filter: Optional[TaskFilter] = None) -> List[Task]:
        # 프로젝트의 태스크들 반환
        pass

    @strawberry.field
    def task(self, info, id: str) -> Optional[Task]:
        # 특정 태스크 반환
        pass

    @strawberry.field
    def notifications(self, info) -> List[Notification]:
        # 사용자의 알림들 반환
        pass


# Mutation Type
@strawberry.type
class Mutation:
    @strawberry.field
    def login(self, info, input: LoginInput) -> AuthPayload:
        # 로그인 처리
        pass

    @strawberry.field
    def register(self, info, input: RegisterInput) -> AuthPayload:
        # 회원가입 처리
        pass

    @strawberry.field
    def create_project(self, info, input: CreateProjectInput) -> Project:
        # 프로젝트 생성
        pass

    @strawberry.field
    def update_project(self, info, id: str, input: UpdateProjectInput) -> Project:
        # 프로젝트 수정
        pass

    @strawberry.field
    def delete_project(self, info, id: str) -> bool:
        # 프로젝트 삭제
        pass

    @strawberry.field
    def create_task(self, info, input: CreateTaskInput) -> Task:
        # 태스크 생성
        pass

    @strawberry.field
    def update_task(self, info, id: str, input: UpdateTaskInput) -> Task:
        # 태스크 수정
        pass

    @strawberry.field
    def delete_task(self, info, id: str) -> bool:
        # 태스크 삭제
        pass

    @strawberry.field
    def add_comment(self, info, task_id: str, content: str) -> Comment:
        # 댓글 추가
        pass

    @strawberry.field
    def mark_notification_read(self, info, id: str) -> bool:
        # 알림 읽음 처리
        pass


# Subscription Type
@strawberry.type
class Subscription:
    @strawberry.subscription
    async def task_updated(self, info, project_id: str) -> Task:
        # 태스크 업데이트 실시간 알림
        pass

    @strawberry.subscription
    async def new_comment(self, info, task_id: str) -> Comment:
        # 새 댓글 실시간 알림
        pass

    @strawberry.subscription
    async def project_activity(self, info, project_id: str) -> Activity:
        # 프로젝트 활동 실시간 알림
        pass


# Schema
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription
)