import React, { useState, useEffect } from 'react';
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
import { useMutation } from '@apollo/client';

import { UPDATE_TASK, GET_TASK } from '../../services/graphql/tasks';
import { useTasksStore } from '../../store/tasks';
import { Task, UpdateTaskInput } from '../../types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  task: Task;
}

export default function EditTaskModal({ visible, onDismiss, task }: Props) {
  const theme = useTheme();
  const { updateTask } = useTasksStore();
  
  const [formData, setFormData] = useState<UpdateTaskInput>({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
      });
    }
  }, [task]);

  const [updateTaskMutation, { loading }] = useMutation(UPDATE_TASK, {
    onCompleted: (data) => {
      updateTask(data.updateTask);
      handleClose();
    },
    onError: (error) => {
      console.error('Update task error:', error);
    },
    refetchQueries: [
      { query: GET_TASK, variables: { id: task.id } }
    ],
  });

  const handleClose = () => {
    onDismiss();
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      return;
    }

    try {
      await updateTaskMutation({
        variables: {
          id: task.id,
          input: {
            title: formData.title.trim(),
            description: formData.description?.trim() || undefined,
            status: formData.status,
            priority: formData.priority,
            dueDate: formData.dueDate,
          },
        },
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const statusButtons = [
    { value: 'TODO', label: '할 일' },
    { value: 'IN_PROGRESS', label: '진행중' },
    { value: 'REVIEW', label: '검토' },
    { value: 'DONE', label: '완료' },
  ];

  const priorityButtons = [
    { value: 'LOW', label: '낮음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HIGH', label: '높음' },
    { value: 'URGENT', label: '긴급' },
  ];

  const isValid = formData.title?.trim().length > 0;

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
              <Title style={styles.title}>태스크 수정</Title>

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

              <View style={styles.statusContainer}>
                <Title style={styles.sectionTitle}>상태</Title>
                <SegmentedButtons
                  value={formData.status || 'TODO'}
                  onValueChange={(status) => 
                    setFormData({ ...formData, status: status as any })
                  }
                  buttons={statusButtons}
                  style={styles.segmentedButtons}
                />
              </View>

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
                  {loading ? <ActivityIndicator color="white" /> : '수정'}
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
  statusContainer: {
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