import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useMutation } from '@apollo/client';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { LOGIN } from '../../services/graphql/auth';
import { useAuthStore } from '../../store/auth';
import { LoginInput } from '../../types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState<LoginInput>({
    email: 'admin@taskflow.com', // 개발용 기본값
    password: 'admin123',
  });

  // 자동 로그인 기능 제거됨

  const [loginMutation, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      const { token, user } = data.login;
      login(user, token);
    },
    onError: (error) => {
      console.error('Login error details:', error);
      Alert.alert('로그인 실패', '서버 연결을 확인해주세요.');
    },
  });

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await loginMutation({
        variables: { input: formData },
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
              TaskFlow
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              팀 협업을 위한 태스크 관리
            </Text>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="이메일"
                value={formData.email}
                onChangeText={(email) => setFormData({ ...formData, email })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                disabled={loading}
              />

              <TextInput
                label="비밀번호"
                value={formData.password}
                onChangeText={(password) => setFormData({ ...formData, password })}
                secureTextEntry
                autoComplete="password"
                style={styles.input}
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? <ActivityIndicator color="white" /> : '로그인'}
              </Button>

              <Button
                mode="text"
                onPress={handleRegister}
                disabled={loading}
                style={styles.registerButton}
              >
                계정이 없으신가요? 회원가입
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>데모 계정</Text>
            <Text style={styles.demoText}>관리자: admin@taskflow.com / admin123</Text>
            <Text style={styles.demoText}>매니저: manager@taskflow.com / manager123</Text>
            <Text style={styles.demoText}>개발자: developer1@taskflow.com / dev123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 8,
  },
  demoInfo: {
    marginTop: 30,
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6366f1',
  },
  demoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#6366f1',
  },
});