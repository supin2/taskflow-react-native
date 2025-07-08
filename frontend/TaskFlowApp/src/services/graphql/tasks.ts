import { gql } from '@apollo/client';

export const GET_TASKS = gql`
  query GetTasks($projectId: String!, $filter: TaskFilter) {
    tasks(projectId: $projectId, filter: $filter) {
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
      due_date
      completed_at
      created_at
      updated_at
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
      due_date
      completed_at
      created_at
      updated_at
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
      due_date
      created_at
      updated_at
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
      due_date
      completed_at
      created_at
      updated_at
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
      created_at
      updated_at
    }
  }
`;