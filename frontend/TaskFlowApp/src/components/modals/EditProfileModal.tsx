import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useMutation } from '@apollo/client';

import { UPDATE_PROFILE } from '../../services/graphql/auth';
import { useAuthStore } from '../../store/auth';
import { User } from '../../types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

interface FormData {
  name: string;
  email: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export default function EditProfileModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const { user, updateUser } = useAuthStore();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // 모달이 열릴 때마다 폼 데이터 초기화
  useEffect(() => {
    if (visible && user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
      setFormErrors({});
    }
  }, [visible, user]);

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      const updatedUser = data.updateProfile;
      updateUser(updatedUser);
      Alert.alert('성공', '프로필이 성공적으로 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            onDismiss();
          },
        },
      ]);
    },
    onError: (error) => {
      console.error('프로필 수정 에러:', error);
      Alert.alert('오류', '프로필 수정에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // 이름 유효성 검증
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.';
    } else if (formData.name.trim().length < 2) {
      errors.name = '이름은 2자 이상이어야 합니다.';
    }

    // 이메일 유효성 검증
    if (!formData.email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        variables: {
          input: {
            name: formData.name.trim(),
            email: formData.email.trim(),
          },
        },
      });
    } catch (error) {
      console.error('프로필 업데이트 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 원래 값으로 되돌리기
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
    setFormErrors({});
    onDismiss();
  };

  const hasChanges = user && (
    formData.name !== user.name || 
    formData.email !== user.email
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={styles.modalContainer}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.title}>
                프로필 편집
              </Text>
              
              <ScrollView style={styles.scrollView}>
                <View style={styles.formContainer}>
                  <TextInput
                    label="이름"
                    value={formData.name}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, name: text }));
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: undefined }));
                      }
                    }}
                    error={!!formErrors.name}
                    style={styles.input}
                    mode="outlined"
                    placeholder="이름을 입력해주세요"
                  />
                  <HelperText type="error" visible={!!formErrors.name}>
                    {formErrors.name}
                  </HelperText>

                  <TextInput
                    label="이메일"
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, email: text }));
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: undefined }));
                      }
                    }}
                    error={!!formErrors.email}
                    style={styles.input}
                    mode="outlined"
                    placeholder="이메일을 입력해주세요"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <HelperText type="error" visible={!!formErrors.email}>
                    {formErrors.email}
                  </HelperText>
                </View>
              </ScrollView>

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.saveButton}
                  disabled={isLoading || !hasChanges}
                  loading={isLoading}
                >
                  {isLoading ? '저장 중...' : '저장'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </SafeAreaView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    elevation: 4,
    maxHeight: '80%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    maxHeight: 300,
  },
  formContainer: {
    gap: 8,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});