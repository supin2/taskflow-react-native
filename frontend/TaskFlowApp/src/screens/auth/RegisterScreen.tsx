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
  Title,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useMutation } from '@apollo/client';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { REGISTER } from '../../services/graphql/auth';
import { useAuthStore } from '../../store/auth';
import { RegisterInput } from '../../types';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState<RegisterInput>({
    email: '',
    password: '',
    name: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const [registerMutation, { loading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      const { token, user } = data.register;
      login(user, token);
    },
    onError: (error) => {
      Alert.alert('회원가입 실패', error.message);
    },
  });

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      await registerMutation({
        variables: { input: formData },
      });
    } catch (error) {
      console.error('Register error:', error);
    }
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
            <Title style={[styles.title, { color: theme.colors.primary }]}>
              회원가입
            </Title>
            <Text style={styles.subtitle}>
              TaskFlow에 오신 것을 환영합니다
            </Text>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="이름"
                value={formData.name}
                onChangeText={(name) => setFormData({ ...formData, name })}
                autoCapitalize="words"
                style={styles.input}
                disabled={loading}
              />

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
                autoComplete="password-new"
                style={styles.input}
                disabled={loading}
              />

              <TextInput
                label="비밀번호 확인"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                disabled={loading}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? <ActivityIndicator color="white" /> : '회원가입'}
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.goBack()}
                disabled={loading}
                style={styles.loginButton}
              >
                이미 계정이 있으신가요? 로그인
              </Button>
            </Card.Content>
          </Card>
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
    fontSize: 28,
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
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginButton: {
    marginTop: 8,
  },
});