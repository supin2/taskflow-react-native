import { gql } from '@apollo/client';

export const GET_TASKS = gql`
  query GetTasks($projectId: String!, $filter: TaskFilter) {
    tasks(project_id: $projectId, filter: $filter) {
      id
      title
      description
      status
      priority
      assignee {
        id
        name
        email
        avatar
      }
      project {
        id
        name
      }
      dueDate
      completedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($id: String!) {
    task(id: $id) {
      id
      title
      description
      status
      priority
      assignee {
        id
        name
        email
        avatar
        role
      }
      project {
        id
        name
        description
      }
      dueDate
      completedAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    create_task(input: $input) {
      id
      title
      description
      status
      priority
      assignee {
        id
        name
        email
      }
      project {
        id
        name
      }
      dueDate
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: String!, $input: UpdateTaskInput!) {
    update_task(id: $id, input: $input) {
      id
      title
      description
      status
      priority
      assignee {
        id
        name
        email
      }
      project {
        id
        name
      }
      dueDate
      completedAt
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: String!) {
    delete_task(id: $id)
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($taskId: String!, $content: String!) {
    add_comment(task_id: $taskId, content: $content) {
      id
      content
      author {
        id
        name
        email
        avatar
      }
      createdAt
      updatedAt
    }
  }
`;