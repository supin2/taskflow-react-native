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