import strawberry
from typing import List, Optional
from app.schemas.types import *
from app.resolvers.resolvers import QueryResolver, MutationResolver, SubscriptionResolver


# Query Type
@strawberry.type
class Query:
    @strawberry.field
    def me(self, info) -> Optional[User]:
        return QueryResolver.me(info)

    @strawberry.field
    def projects(self, info) -> List[Project]:
        return QueryResolver.projects(info)

    @strawberry.field
    def project(self, info, id: str) -> Optional[Project]:
        return QueryResolver.project(info, id)

    @strawberry.field
    def tasks(self, info, project_id: str, filter: Optional[TaskFilter] = None) -> List[Task]:
        return QueryResolver.tasks(info, project_id, filter)

    @strawberry.field
    def task(self, info, id: str) -> Optional[Task]:
        return QueryResolver.task(info, id)

    @strawberry.field
    def notifications(self, info) -> List[Notification]:
        return QueryResolver.notifications(info)


# Mutation Type
@strawberry.type
class Mutation:
    @strawberry.field
    def login(self, info, input: LoginInput) -> AuthPayload:
        return MutationResolver.login(info, input)

    @strawberry.field
    def register(self, info, input: RegisterInput) -> AuthPayload:
        return MutationResolver.register(info, input)

    @strawberry.field
    def create_project(self, info, input: CreateProjectInput) -> Project:
        return MutationResolver.create_project(info, input)

    @strawberry.field
    def update_project(self, info, id: str, input: UpdateProjectInput) -> Project:
        return MutationResolver.update_project(info, id, input)

    @strawberry.field
    def delete_project(self, info, id: str) -> bool:
        return MutationResolver.delete_project(info, id)

    @strawberry.field
    def create_task(self, info, input: CreateTaskInput) -> Task:
        return MutationResolver.create_task(info, input)

    @strawberry.field
    def update_task(self, info, id: str, input: UpdateTaskInput) -> Task:
        return MutationResolver.update_task(info, id, input)

    @strawberry.field
    def delete_task(self, info, id: str) -> bool:
        return MutationResolver.delete_task(info, id)

    @strawberry.field
    def add_comment(self, info, task_id: str, content: str) -> Comment:
        return MutationResolver.add_comment(info, task_id, content)

    @strawberry.field
    def mark_notification_read(self, info, id: str) -> bool:
        return MutationResolver.mark_notification_read(info, id)


# Subscription Type
@strawberry.type
class Subscription:
    @strawberry.subscription
    async def task_updated(self, info, project_id: str) -> Task:
        return SubscriptionResolver.task_updated(info, project_id)

    @strawberry.subscription
    async def new_comment(self, info, task_id: str) -> Comment:
        return SubscriptionResolver.new_comment(info, task_id)

    @strawberry.subscription
    async def project_activity(self, info, project_id: str) -> Activity:
        return SubscriptionResolver.project_activity(info, project_id)


# Schema
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription
)