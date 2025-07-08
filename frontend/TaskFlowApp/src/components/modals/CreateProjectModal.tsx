import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  TextInput,
  Button,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useMutation } from '@apollo/client';

import { CREATE_PROJECT, GET_PROJECTS } from '../../services/graphql/projects';
import { useProjectsStore } from '../../store/projects';
import { CreateProjectInput } from '../../types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function CreateProjectModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const { addProject } = useProjectsStore();
  
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
  });

  const [createProject, { loading }] = useMutation(CREATE_PROJECT, {
    onCompleted: (data) => {
      addProject(data.create_project);
      handleClose();
    },
    onError: (error) => {
      console.error('Create project error:', error);
    },
    refetchQueries: [{ query: GET_PROJECTS }],
  });

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    onDismiss();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      await createProject({
        variables: {
          input: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
          },
        },
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>새 프로젝트 생성</Title>

            <TextInput
              label="프로젝트 이름 *"
              value={formData.name}
              onChangeText={(name) => setFormData({ ...formData, name })}
              style={styles.input}
              disabled={loading}
              autoFocus
            />

            <TextInput
              label="설명 (선택사항)"
              value={formData.description}
              onChangeText={(description) => setFormData({ ...formData, description })}
              multiline
              numberOfLines={3}
              style={styles.input}
              disabled={loading}
            />

            <View style={styles.buttons}>
              <Button
                mode="text"
                onPress={handleClose}
                disabled={loading}
                style={styles.button}
              >
                취소
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={!isValid || loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                {loading ? <ActivityIndicator color="white" /> : '생성'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  card: {
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    marginLeft: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
});