import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// 에러 처리 링크
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    
    // 401 에러인 경우 토큰 제거 및 로그인 화면으로 이동
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      AsyncStorage.removeItem('auth_token');
      // 여기서 로그인 화면으로 네비게이션 처리
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
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          projects: {
            // 프로젝트 목록 캐싱 정책
            merge(existing = [], incoming) {
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