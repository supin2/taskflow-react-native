import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
        avatar
        role
        createdAt
        updatedAt
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
        avatar
        role
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      avatar
      role
      createdAt
      updatedAt
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken {
    refreshToken {
      token
      user {
        id
        email
        name
        avatar
        role
        createdAt
        updatedAt
      }
    }
  }
`;