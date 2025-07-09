from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import Project, ProjectMember, User, Role
from app.schemas.types import CreateProjectInput, UpdateProjectInput


class ProjectService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_projects(self, user_id: str) -> List[Project]:
        """
        사용자가 속한 프로젝트들 반환
        """
        try:
            print(f"🔍 get_user_projects for user: {user_id}")
            
            # ProjectMember와 Project를 JOIN하여 가져오기
            from sqlalchemy.orm import joinedload
            
            project_members = self.db.query(ProjectMember).options(
                joinedload(ProjectMember.project)
            ).filter(
                ProjectMember.user_id == user_id
            ).all()
            
            print(f"🔍 Found {len(project_members)} project members")
            
            projects = []
            for member in project_members:
                if member.project:
                    projects.append(member.project)
                    print(f"✅ Added project: {member.project.name}")
            
            print(f"✅ Returning {len(projects)} projects")
            return projects
            
        except Exception as e:
            print(f"❌ Error in get_user_projects: {e}")
            import traceback
            traceback.print_exc()
            
            # 대안: 직접 JOIN 쿼리 사용
            try:
                projects = self.db.query(Project).join(
                    ProjectMember, Project.id == ProjectMember.project_id
                ).filter(
                    ProjectMember.user_id == user_id
                ).all()
                
                print(f"✅ Alternative query returned {len(projects)} projects")
                return projects
                
            except Exception as e2:
                print(f"❌ Alternative query also failed: {e2}")
                return []
    
    def get_all_projects(self) -> List[Project]:
        """
        모든 프로젝트 반환 (개발용)
        """
        return self.db.query(Project).all()

    def get_project(self, project_id: str) -> Optional[Project]:
        """
        프로젝트 조회
        """
        return self.db.query(Project).filter(Project.id == project_id).first()

    def create_project(self, user_id: str, input: CreateProjectInput) -> Project:
        """
        프로젝트 생성
        """
        # 프로젝트 생성
        project = Project(
            name=input.name,
            description=input.description
        )
        
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        
        # 생성자를 매니저로 추가
        project_member = ProjectMember(
            user_id=user_id,
            project_id=project.id,
            role=Role.MANAGER
        )
        
        self.db.add(project_member)
        self.db.commit()
        
        return project

    def update_project(self, project_id: str, input: UpdateProjectInput) -> Project:
        """
        프로젝트 수정
        """
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if input.name is not None:
            project.name = input.name
        if input.description is not None:
            project.description = input.description
        
        self.db.commit()
        self.db.refresh(project)
        
        return project

    def delete_project(self, project_id: str) -> bool:
        """
        프로젝트 삭제
        """
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # 관련 데이터 삭제 (멤버, 태스크 등)
        self.db.query(ProjectMember).filter(ProjectMember.project_id == project_id).delete()
        self.db.delete(project)
        self.db.commit()
        
        return True

    def has_project_access(self, user_id: str, project_id: str) -> bool:
        """
        사용자가 프로젝트에 접근 권한이 있는지 확인
        """
        member = self.db.query(ProjectMember).filter(
            ProjectMember.user_id == user_id,
            ProjectMember.project_id == project_id
        ).first()
        
        return member is not None

    def has_project_manage_access(self, user_id: str, project_id: str) -> bool:
        """
        사용자가 프로젝트 관리 권한이 있는지 확인 (매니저 이상)
        """
        member = self.db.query(ProjectMember).filter(
            ProjectMember.user_id == user_id,
            ProjectMember.project_id == project_id
        ).first()
        
        if not member:
            return False
        
        return member.role in [Role.MANAGER, Role.ADMIN]

    def add_member(self, project_id: str, user_id: str, role: Role = Role.MEMBER) -> ProjectMember:
        """
        프로젝트에 멤버 추가
        """
        # 이미 멤버인지 확인
        existing_member = self.db.query(ProjectMember).filter(
            ProjectMember.user_id == user_id,
            ProjectMember.project_id == project_id
        ).first()
        
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this project"
            )
        
        member = ProjectMember(
            user_id=user_id,
            project_id=project_id,
            role=role
        )
        
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        
        return member

    def remove_member(self, project_id: str, user_id: str) -> bool:
        """
        프로젝트에서 멤버 제거
        """
        member = self.db.query(ProjectMember).filter(
            ProjectMember.user_id == user_id,
            ProjectMember.project_id == project_id
        ).first()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        self.db.delete(member)
        self.db.commit()
        
        return True

    def get_project_members(self, project_id: str) -> List[ProjectMember]:
        """
        프로젝트 멤버들 조회
        """
        return self.db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id
        ).all()