import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useQuery } from '@apollo/client';

import { useAuthStore } from '../store/auth';
import { GET_ME } from '../services/graphql/auth';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  ProjectDetail: { projectId: string };
  TaskDetail: { taskId: string };
};

export type MainTabParamList = {
  Projects: undefined;
  Tasks: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Projects') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Projects" 
        component={ProjectsScreen}
        options={{ title: '프로젝트' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{ title: '태스크' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: '프로필' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  // 토큰이 없으면 초기화 완료
  useEffect(() => {
    if (!token) {
      setIsInitializing(false);
      setIsValidToken(false);
    }
  }, [token]);

  // 서버에서 토큰 유효성 검증
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_ME, {
    skip: !token, // 토큰이 없으면 쿼리 실행 안 함
    errorPolicy: 'all',
    onCompleted: (data) => {
      if (data?.me) {
        setIsValidToken(true);
      }
      setIsInitializing(false);
    },
    onError: (error) => {
      console.log('Token validation failed:', error);
      setIsValidToken(false);
      setIsInitializing(false);
      // 토큰이 유효하지 않으면 로그아웃
      logout();
    }
  });

  // 초기화 중이거나 토큰이 있는데 유효성 검증 중인 경우 로딩 화면
  if (isInitializing || (token && userLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>앱을 초기화하는 중...</Text>
      </View>
    );
  }

  // 토큰이 있고 유효한 경우에만 인증된 것으로 간주
  const isAuthenticatedAndValid = isAuthenticated && token && isValidToken;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticatedAndValid ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="ProjectDetail" 
              component={ProjectDetailScreen}
              options={{ 
                headerShown: true,
                title: '프로젝트 상세',
              }}
            />
            <Stack.Screen 
              name="TaskDetail" 
              component={TaskDetailScreen}
              options={{ 
                headerShown: true,
                title: '태스크 상세',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ 
                headerShown: true,
                title: '회원가입',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});