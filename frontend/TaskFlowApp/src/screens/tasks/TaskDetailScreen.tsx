import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  ActivityIndicator,
  Chip,
  TextInput,
  Menu,
  Divider,
  useTheme,
  Avatar,
} from 'react-native-paper';
import { useQuery, useMutation } from '@apollo/client';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { GET_TASK, UPDATE_TASK, DELETE_TASK, ADD_COMMENT } from '../../services/graphql/tasks';
import { useTasksStore } from '../../store/tasks';
import { useAuthStore } from '../../store/auth';
import { Task, Comment } from '../../types';
import EditTaskModal from '../../components/modals/EditTaskModal';

type TaskDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;

interface Props {
  navigation: TaskDetailScreenNavigationProp;
  route: TaskDetailScreenRouteProp;
}

export default function TaskDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { taskId } = route.params;
  const { user } = useAuthStore();
  const { updateTask } = useTasksStore();
  
  const [task, setTask] = useState<Task | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  const { data, loading, error, refetch } = useQuery(GET_TASK, {
    variables: { id: taskId },
    onCompleted: (data) => {
      if (data.task) {
        setTask(data.task);
        navigation.setOptions({ title: data.task.title });
      }
    },
    onError: (error) => {
      Alert.alert('오류', '태스크를 불러오는데 실패했습니다.');
    },
  });

  const [updateTaskMutation] = useMutation(UPDATE_TASK, {
    onCompleted: (data) => {
      setTask(data.update_task);
      updateTask(data.update_task);
    },
    onError: (error) => {
      Alert.alert('오류', '태스크 수정에 실패했습니다.');
    },
  });

  const [deleteTaskMutation] = useMutation(DELETE_TASK, {
    onCompleted: () => {
      Alert.alert('완료', '태스크가 삭제되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error) => {
      Alert.alert('오류', '태스크 삭제에 실패했습니다.');
    },
  });

  const [addCommentMutation, { loading: commentLoading }] = useMutation(ADD_COMMENT, {
    onCompleted: (data) => {
      setComments(prev => [...prev, data.add_comment]);
      setCommentText('');
    },
    onError: (error) => {
      Alert.alert('오류', '댓글 추가에 실패했습니다.');
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleStatusChange = (status: string) => {
    if (!task) return;
    
    updateTaskMutation({
      variables: {
        id: task.id,
        input: { status }
      }
    });
  };

  const handleEdit = () => {
    setMenuVisible(false);
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      '태스크 삭제',
      '정말 이 태스크를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => deleteTaskMutation({ variables: { id: taskId } })
        }
      ]
    );
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    addCommentMutation({
      variables: {
        taskId,
        content: commentText.trim()
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return '#6b7280';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'REVIEW':
        return '#8b5cf6';
      case 'DONE':
        return '#10b981';
      default:
        return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO':
        return '할 일';
      case 'IN_PROGRESS':
        return '진행 중';
      case 'REVIEW':
        return '검토';
      case 'DONE':
        return '완료';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return '#10b981';
      case 'MEDIUM':
        return '#f59e0b';
      case 'HIGH':
        return '#ef4444';
      case 'URGENT':
        return '#dc2626';
      default:
        return theme.colors.outline;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return '낮음';
      case 'MEDIUM':
        return '보통';
      case 'HIGH':
        return '높음';
      case 'URGENT':
        return '긴급';
      default:
        return priority;
    }
  };

  const statusOptions = [
    { label: '할 일', value: 'TODO' },
    { label: '진행 중', value: 'IN_PROGRESS' },
    { label: '검토', value: 'REVIEW' },
    { label: '완료', value: 'DONE' },
  ];

  const renderComment = ({ item }: { item: Comment }) => (
    <Card style={styles.commentCard}>
      <Card.Content style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Avatar.Text
            size={32}
            label={item.author.name.charAt(0).toUpperCase()}
            style={styles.commentAvatar}
          />
          <View style={styles.commentInfo}>
            <Text style={styles.commentAuthor}>{item.author.name}</Text>
            <Text style={styles.commentDate}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </Card.Content>
    </Card>
  );

  if (loading && !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>태스크를 불러오는 중...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text>태스크를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* 태스크 정보 */}
        <Card style={styles.taskCard}>
          <Card.Content>
            <View style={styles.taskHeader}>
              <Text variant="headlineMedium" style={styles.taskTitle}>{task.title}</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item onPress={handleEdit} title="수정" leadingIcon="pencil" />
                <Menu.Item onPress={handleDelete} title="삭제" leadingIcon="delete" />
              </Menu>
            </View>
            
            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}

            <View style={styles.taskTags}>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) + '20' }]}
                textStyle={{ color: getStatusColor(task.status) }}
              >
                {getStatusText(task.status)}
              </Chip>
              <Chip
                mode="flat"
                style={[styles.priorityChip, { backgroundColor: getPriorityColor(task.priority) + '20' }]}
                textStyle={{ color: getPriorityColor(task.priority) }}
              >
                {getPriorityText(task.priority)}
              </Chip>
            </View>

            <View style={styles.taskMeta}>
              {task.assignee && (
                <Text style={styles.metaText}>
                  담당자: {task.assignee.name}
                </Text>
              )}
              {task.dueDate && (
                <Text style={styles.metaText}>
                  마감일: {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              )}
              <Text style={styles.metaText}>
                생성일: {new Date(task.createdAt).toLocaleDateString()}
              </Text>
              {task.completedAt && (
                <Text style={styles.metaText}>
                  완료일: {new Date(task.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* 상태 변경 버튼들 */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.sectionTitle}>상태 변경</Text>
            <View style={styles.statusButtons}>
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  mode={task.status === option.value ? 'contained' : 'outlined'}
                  onPress={() => handleStatusChange(option.value)}
                  style={styles.statusButton}
                  compact
                >
                  {option.label}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 댓글 섹션 */}
        <Card style={styles.commentsCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.sectionTitle}>댓글</Text>
            
            {/* 댓글 입력 */}
            <View style={styles.commentInput}>
              <TextInput
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                style={styles.commentTextInput}
                disabled={commentLoading}
              />
              <Button
                mode="contained"
                onPress={handleAddComment}
                disabled={!commentText.trim() || commentLoading}
                style={styles.commentSubmitButton}
                compact
              >
                {commentLoading ? <ActivityIndicator size="small" color="white" /> : '등록'}
              </Button>
            </View>

            {/* 댓글 목록 */}
            {comments.length > 0 ? (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.commentsList}
              />
            ) : (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>
                  아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {editModalVisible && (
        <EditTaskModal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          task={task}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  taskCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  taskDescription: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 24,
  },
  taskTags: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  priorityChip: {
    height: 28,
  },
  taskMeta: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  statusCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: 80,
  },
  commentsCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
    borderRadius: 12,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
  },
  commentSubmitButton: {
    alignSelf: 'flex-end',
  },
  commentsList: {
    marginTop: 8,
  },
  commentCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
  },
  commentContent: {
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    marginRight: 12,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCommentsText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});