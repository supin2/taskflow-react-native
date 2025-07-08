from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from app.models.models import Task, Comment, TaskStatus, Priority, Activity
from app.schemas.schema import CreateTaskInput, UpdateTaskInput, TaskFilter


class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def get_tasks(self, project_id: str, filter: Optional[TaskFilter] = None) -> List[Task]:
        """
        프로젝트의 태스크들 조회
        """
        query = self.db.query(Task).filter(Task.project_id == project_id)
        
        if filter:
            if filter.status:
                query = query.filter(Task.status == filter.status)
            if filter.priority:
                query = query.filter(Task.priority == filter.priority)
            if filter.assigneeId:
                query = query.filter(Task.assignee_id == filter.assigneeId)
            if filter.search:
                query = query.filter(
                    Task.title.contains(filter.search) | 
                    Task.description.contains(filter.search)
                )
        
        return query.order_by(Task.created_at.desc()).all()

    def get_task(self, task_id: str) -> Optional[Task]:
        """
        태스크 조회
        """
        return self.db.query(Task).filter(Task.id == task_id).first()

    def create_task(self, user_id: str, input: CreateTaskInput) -> Task:
        """
        태스크 생성
        """
        task = Task(
            title=input.title,
            description=input.description,
            project_id=input.projectId,
            assignee_id=input.assigneeId,
            priority=input.priority,
            due_date=input.dueDate,
            status=TaskStatus.TODO
        )
        
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        
        # 활동 로그 생성
        self._create_activity(
            user_id=user_id,
            task_id=task.id,
            project_id=task.project_id,
            action="task_created",
            description=f"태스크 '{task.title}'을(를) 생성했습니다."
        )
        
        return task

    def update_task(self, task_id: str, input: UpdateTaskInput) -> Task:
        """
        태스크 수정
        """
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 변경사항 추적
        changes = []
        
        if input.title is not None and input.title != task.title:
            changes.append(f"제목을 '{task.title}'에서 '{input.title}'로 변경")
            task.title = input.title
        
        if input.description is not None and input.description != task.description:
            changes.append("설명을 수정")
            task.description = input.description
        
        if input.status is not None and input.status != task.status:
            changes.append(f"상태를 '{task.status.value}'에서 '{input.status.value}'로 변경")
            task.status = input.status
            
            # 완료 상태로 변경 시 완료 시간 설정
            if input.status == TaskStatus.DONE:
                task.completed_at = datetime.utcnow()
            else:
                task.completed_at = None
        
        if input.priority is not None and input.priority != task.priority:
            changes.append(f"우선순위를 '{task.priority.value}'에서 '{input.priority.value}'로 변경")
            task.priority = input.priority
        
        if input.assigneeId is not None and input.assigneeId != task.assignee_id:
            changes.append("담당자를 변경")
            task.assignee_id = input.assigneeId
        
        if input.dueDate is not None and input.dueDate != task.due_date:
            changes.append("마감일을 변경")
            task.due_date = input.dueDate
        
        self.db.commit()
        self.db.refresh(task)
        
        # 활동 로그 생성
        if changes:
            self._create_activity(
                user_id=task.assignee_id or "system",  # 실제로는 현재 사용자 ID
                task_id=task.id,
                project_id=task.project_id,
                action="task_updated",
                description=f"태스크 '{task.title}'을(를) 수정했습니다: {', '.join(changes)}"
            )
        
        return task

    def delete_task(self, task_id: str) -> bool:
        """
        태스크 삭제
        """
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # 관련 데이터 삭제 (댓글, 첨부파일 등)
        self.db.query(Comment).filter(Comment.task_id == task_id).delete()
        
        # 활동 로그 생성
        self._create_activity(
            user_id=task.assignee_id or "system",
            task_id=None,
            project_id=task.project_id,
            action="task_deleted",
            description=f"태스크 '{task.title}'을(를) 삭제했습니다."
        )
        
        self.db.delete(task)
        self.db.commit()
        
        return True

    def add_comment(self, user_id: str, task_id: str, content: str) -> Comment:
        """
        댓글 추가
        """
        comment = Comment(
            content=content,
            author_id=user_id,
            task_id=task_id
        )
        
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        
        # 활동 로그 생성
        task = self.get_task(task_id)
        if task:
            self._create_activity(
                user_id=user_id,
                task_id=task_id,
                project_id=task.project_id,
                action="comment_added",
                description=f"태스크 '{task.title}'에 댓글을 추가했습니다."
            )
        
        return comment

    def get_task_comments(self, task_id: str) -> List[Comment]:
        """
        태스크의 댓글들 조회
        """
        return self.db.query(Comment).filter(
            Comment.task_id == task_id
        ).order_by(Comment.created_at.asc()).all()

    def _create_activity(self, user_id: str, task_id: Optional[str], project_id: str, action: str, description: str):
        """
        활동 로그 생성
        """
        activity = Activity(
            user_id=user_id,
            task_id=task_id,
            project_id=project_id,
            action=action,
            description=description
        )
        
        self.db.add(activity)
        self.db.commit()

    def get_project_activities(self, project_id: str, limit: int = 50) -> List[Activity]:
        """
        프로젝트의 활동 로그 조회
        """
        return self.db.query(Activity).filter(
            Activity.project_id == project_id
        ).order_by(Activity.created_at.desc()).limit(limit).all()

    def get_task_activities(self, task_id: str) -> List[Activity]:
        """
        태스크의 활동 로그 조회
        """
        return self.db.query(Activity).filter(
            Activity.task_id == task_id
        ).order_by(Activity.created_at.desc()).all()