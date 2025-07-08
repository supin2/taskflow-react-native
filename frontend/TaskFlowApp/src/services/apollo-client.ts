import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REFRESH_TOKEN } from './graphql/auth';

// HTTP 링크 설정
const httpLink = createHttpLink({
  uri: 'http://localhost:8000/graphql', // 백엔드 GraphQL 엔드포인트
});

// 인증 링크 설정
const authLink = setContext(async (_, { headers }) => {
  // AsyncStorage에서 토큰 가져오기
  const token = await AsyncStorage.getItem('auth_token');
  
  // 디버깅용 로그
  console.log('Apollo Client - Token from AsyncStorage:', token);
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// 토큰 재발급 함수
const refreshTokens = async () => {
  try {
    const currentToken = await AsyncStorage.getItem('auth_token');
    if (!currentToken) {
      throw new Error('No token available');
    }

    const response = await fetch('http://localhost:8000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        query: `
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
        `,
      }),
    });

    const result = await response.json();
    
    if (result.data?.refreshToken?.token) {
      await AsyncStorage.setItem('auth_token', result.data.refreshToken.token);
      return result.data.refreshToken.token;
    } else {
      throw new Error('Failed to refresh token');
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    await AsyncStorage.removeItem('auth_token');
    throw error;
  }
};

// 에러 처리 링크
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      console.error(
        `GraphQL error: Message: ${error.message}, Location: ${error.locations}, Path: ${error.path}`
      );
      
      // 401 에러인 경우 토큰 재발급 시도
      if (error.message.includes('Authentication required') || error.message.includes('Not authenticated')) {
        refreshTokens().then((newToken) => {
          // 새 토큰으로 요청 재시도
          const oldHeaders = operation.getContext().headers;
          operation.setContext({
            headers: {
              ...oldHeaders,
              authorization: `Bearer ${newToken}`,
            },
          });
          return forward(operation);
        }).catch((refreshError) => {
          console.error('Token refresh failed, redirecting to login:', refreshError);
          // 여기서 로그인 화면으로 리다이렉트
        });
      }
    }
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    console.error(`Operation that caused error: ${operation.operationName}`);
    console.error(`Variables: ${JSON.stringify(operation.variables)}`);
    
    // 401 에러인 경우 토큰 재발급 시도
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      refreshTokens().then((newToken) => {
        // 새 토큰으로 요청 재시도
        const oldHeaders = operation.getContext().headers;
        operation.setContext({
          headers: {
            ...oldHeaders,
            authorization: `Bearer ${newToken}`,
          },
        });
        return forward(operation);
      }).catch((refreshError) => {
        console.error('Token refresh failed, redirecting to login:', refreshError);
        // 여기서 로그인 화면으로 리다이렉트
      });
    }
  }
});

// Apollo Client 생성
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tasks: {
            // 태스크 목록 캐싱 정책
            merge(_, incoming) {
              return incoming;
            },
          },
          projects: {
            // 프로젝트 목록 캐싱 정책
            merge(_, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default client;