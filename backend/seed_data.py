"""
개발용 테스트 데이터 생성 스크립트
"""
from app.database.database import SessionLocal, create_tables
from app.models.models import User, Project, ProjectMember, Task, Role, TaskStatus, Priority
from app.auth.auth import AuthService
from datetime import datetime, timedelta


def create_seed_data():
    """테스트 데이터 생성"""
    db = SessionLocal()
    
    try:
        # 기존 데이터 확인
        existing_user = db.query(User).first()
        if existing_user:
            print("시드 데이터가 이미 존재합니다.")
            return
        
        # 사용자 생성
        auth_service = AuthService()
        
        # 관리자 사용자
        admin = User(
            email="admin@taskflow.com",
            name="관리자",
            password_hash=auth_service.hash_password("admin123"),
            role=Role.ADMIN
        )
        db.add(admin)
        
        # 매니저 사용자
        manager = User(
            email="manager@taskflow.com",
            name="프로젝트 매니저",
            password_hash=auth_service.hash_password("manager123"),
            role=Role.MANAGER
        )
        db.add(manager)
        
        # 일반 사용자들
        member1 = User(
            email="developer1@taskflow.com",
            name="개발자1",
            password_hash=auth_service.hash_password("dev123"),
            role=Role.MEMBER
        )
        db.add(member1)
        
        member2 = User(
            email="developer2@taskflow.com",
            name="개발자2",
            password_hash=auth_service.hash_password("dev123"),
            role=Role.MEMBER
        )
        db.add(member2)
        
        # 커밋하여 ID 생성
        db.commit()
        db.refresh(admin)
        db.refresh(manager)
        db.refresh(member1)
        db.refresh(member2)
        
        # 프로젝트 생성
        project1 = Project(
            name="TaskFlow 개발",
            description="팀 협업 태스크 관리 앱 개발 프로젝트"
        )
        db.add(project1)
        
        project2 = Project(
            name="모바일 앱 리뉴얼",
            description="기존 모바일 앱의 UI/UX 개선 프로젝트"
        )
        db.add(project2)
        
        db.commit()
        db.refresh(project1)
        db.refresh(project2)
        
        # 프로젝트 멤버 추가
        members = [
            ProjectMember(user_id=admin.id, project_id=project1.id, role=Role.ADMIN),
            ProjectMember(user_id=manager.id, project_id=project1.id, role=Role.MANAGER),
            ProjectMember(user_id=member1.id, project_id=project1.id, role=Role.MEMBER),
            ProjectMember(user_id=member2.id, project_id=project1.id, role=Role.MEMBER),
            
            ProjectMember(user_id=manager.id, project_id=project2.id, role=Role.MANAGER),
            ProjectMember(user_id=member1.id, project_id=project2.id, role=Role.MEMBER),
        ]
        
        for member in members:
            db.add(member)
        
        # 태스크 생성
        tasks = [
            # 프로젝트 1 태스크들
            Task(
                title="프로젝트 초기 설정",
                description="React Native 프로젝트 생성 및 기본 구조 설정",
                status=TaskStatus.DONE,
                priority=Priority.HIGH,
                assignee_id=member1.id,
                project_id=project1.id,
                completed_at=datetime.utcnow() - timedelta(days=5)
            ),
            Task(
                title="GraphQL API 설계",
                description="백엔드 GraphQL 스키마 및 리졸버 구현",
                status=TaskStatus.IN_PROGRESS,
                priority=Priority.HIGH,
                assignee_id=member2.id,
                project_id=project1.id,
                due_date=datetime.utcnow() + timedelta(days=3)
            ),
            Task(
                title="사용자 인증 시스템",
                description="JWT 기반 로그인/회원가입 기능 구현",
                status=TaskStatus.TODO,
                priority=Priority.MEDIUM,
                assignee_id=member1.id,
                project_id=project1.id,
                due_date=datetime.utcnow() + timedelta(days=7)
            ),
            Task(
                title="프로젝트 관리 UI",
                description="프로젝트 생성, 수정, 삭제 화면 구현",
                status=TaskStatus.TODO,
                priority=Priority.MEDIUM,
                project_id=project1.id,
                due_date=datetime.utcnow() + timedelta(days=10)
            ),
            
            # 프로젝트 2 태스크들
            Task(
                title="UI 디자인 분석",
                description="기존 UI 문제점 분석 및 개선 방안 도출",
                status=TaskStatus.DONE,
                priority=Priority.HIGH,
                assignee_id=manager.id,
                project_id=project2.id,
                completed_at=datetime.utcnow() - timedelta(days=3)
            ),
            Task(
                title="새로운 디자인 시스템",
                description="일관된 디자인 시스템 구축",
                status=TaskStatus.IN_PROGRESS,
                priority=Priority.HIGH,
                assignee_id=member1.id,
                project_id=project2.id,
                due_date=datetime.utcnow() + timedelta(days=5)
            ),
        ]
        
        for task in tasks:
            db.add(task)
        
        db.commit()
        
        print("✅ 시드 데이터 생성 완료!")
        print("\n테스트 계정:")
        print("- 관리자: admin@taskflow.com / admin123")
        print("- 매니저: manager@taskflow.com / manager123")
        print("- 개발자1: developer1@taskflow.com / dev123")
        print("- 개발자2: developer2@taskflow.com / dev123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 시드 데이터 생성 실패: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    # 테이블 생성
    create_tables()
    
    # 시드 데이터 생성
    create_seed_data()