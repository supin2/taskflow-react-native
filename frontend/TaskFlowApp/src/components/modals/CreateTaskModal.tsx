import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  TextInput,
  Button,
  ActivityIndicator,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { useMutation, useQuery } from '@apollo/client';
// import DateTimePicker from '@react-native-community/datetimepicker';

import { CREATE_TASK, GET_TASKS } from '../../services/graphql/tasks';
import { GET_PROJECTS } from '../../services/graphql/projects';
import { useTasksStore } from '../../store/tasks';
import { CreateTaskInput } from '../../types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  projectId?: string;
}

export default function CreateTaskModal({ visible, onDismiss, projectId }: Props) {
  const theme = useTheme();
  const { addTask } = useTasksStore();
  
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    projectId: projectId || '',
    priority: 'MEDIUM',
  });

  const [createTask, { loading }] = useMutation(CREATE_TASK, {
    onCompleted: (data) => {
      addTask(data.create_task);
      handleClose();
    },
    onError: (error) => {
      console.error('Create task error:', error);
    },
    refetchQueries: [
      { query: GET_TASKS, variables: { projectId: formData.projectId } }
    ],
  });

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      projectId: projectId || '',
      priority: 'MEDIUM',
    });
    onDismiss();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.projectId) {
      return;
    }

    try {
      await createTask({
        variables: {
          input: {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            projectId: formData.projectId,
            priority: formData.priority,
            dueDate: formData.dueDate,
          },
        },
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const priorityButtons = [
    { value: 'LOW', label: '낮음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HIGH', label: '높음' },
    { value: 'URGENT', label: '긴급' },
  ];

  const isValid = formData.title.trim().length > 0 && formData.projectId;

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
            <ScrollView showsVerticalScrollIndicator={false}>
              <Title style={styles.title}>새 태스크 생성</Title>

              <TextInput
                label="태스크 제목 *"
                value={formData.title}
                onChangeText={(title) => setFormData({ ...formData, title })}
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

              <View style={styles.priorityContainer}>
                <Title style={styles.sectionTitle}>우선순위</Title>
                <SegmentedButtons
                  value={formData.priority || 'MEDIUM'}
                  onValueChange={(priority) => 
                    setFormData({ ...formData, priority: priority as any })
                  }
                  buttons={priorityButtons}
                  style={styles.segmentedButtons}
                />
              </View>

              <TextInput
                label="마감일 (선택사항, YYYY-MM-DD)"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                onChangeText={(dateStr) => {
                  if (dateStr) {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                      setFormData({ ...formData, dueDate: date.toISOString() });
                    }
                  } else {
                    setFormData({ ...formData, dueDate: undefined });
                  }
                }}
                style={styles.input}
                disabled={loading}
                placeholder="2024-01-01"
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
            </ScrollView>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    maxHeight: '80%',
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
  priorityContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
});