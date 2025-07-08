from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid


Base = declarative_base()


class Role(enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"


class TaskStatus(enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"


class Priority(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    avatar = Column(String)
    role = Column(SQLEnum(Role), default=Role.MEMBER)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project_memberships = relationship("ProjectMember", back_populates="user")
    assigned_tasks = relationship("Task", back_populates="assignee")
    comments = relationship("Comment", back_populates="author")
    activities = relationship("Activity", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    uploaded_attachments = relationship("Attachment", back_populates="uploaded_by")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = relationship("ProjectMember", back_populates="project")
    tasks = relationship("Task", back_populates="project")
    activities = relationship("Activity", back_populates="project")


class ProjectMember(Base):
    __tablename__ = "project_members"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    role = Column(SQLEnum(Role), default=Role.MEMBER)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="project_memberships")
    project = relationship("Project", back_populates="members")


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM)
    assignee_id = Column(String, ForeignKey("users.id"))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    due_date = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assignee = relationship("User", back_populates="assigned_tasks")
    project = relationship("Project", back_populates="tasks")
    comments = relationship("Comment", back_populates="task")
    attachments = relationship("Attachment", back_populates="task")
    activities = relationship("Activity", back_populates="task")


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    content = Column(Text, nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="comments")
    task = relationship("Task", back_populates="comments")


class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    uploaded_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="attachments")
    uploaded_by = relationship("User", back_populates="uploaded_attachments")


class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    action = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"))
    project_id = Column(String, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="activities")
    task = relationship("Task", back_populates="activities")
    project = relationship("Project", back_populates="activities")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")