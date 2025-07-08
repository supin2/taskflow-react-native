import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Title,
  Text,
  Card,
  Button,
  IconButton,
  ActivityIndicator,
  Chip,
  FAB,
  useTheme,
} from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { GET_PROJECT } from '../../services/graphql/projects';
import { GET_TASKS } from '../../services/graphql/tasks';
import { useProjectsStore } from '../../store/projects';
import { useTasksStore } from '../../store/tasks';
import { Project, Task } from '../../types';

type ProjectDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProjectDetail'>;
type ProjectDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;

interface Props {
  navigation: ProjectDetailScreenNavigationProp;
  route: ProjectDetailScreenRouteProp;
}

export default function ProjectDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { projectId } = route.params;
  const { setSelectedProject } = useProjectsStore();
  const { tasks, setTasks } = useTasksStore();
  const [project, setProject] = useState<Project | null>(null);

  const { data: projectData, loading: projectLoading, refetch: refetchProject } = useQuery(GET_PROJECT, {
    variables: { id: projectId },
    onCompleted: (data) => {
      if (data.project) {
        setProject(data.project);
        setSelectedProject(data.project);
        navigation.setOptions({ title: data.project.name });
      }
    },
    onError: (error) => {
      Alert.alert('오류', '프로젝트를 불러오는데 실패했습니다.');
    },
  });

  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(GET_TASKS, {
    variables: { projectId },
    onCompleted: (data) => {
      setTasks(data.tasks || []);
    },
    onError: (error) => {
      console.error('Tasks error:', error);
    },
  });

  const handleRefresh = () => {
    refetchProject();
    refetchTasks();
  };

  const handleCreateTask = () => {
    Alert.alert('알림', '태스크 생성 기능은 곧 추가됩니다.');
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
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

  if (projectLoading && !project) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>프로젝트를 불러오는 중...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text>프로젝트를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={projectLoading || tasksLoading}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* 프로젝트 정보 */}
        <Card style={styles.projectCard}>
          <Card.Content>
            <Title style={styles.projectTitle}>{project.name}</Title>
            {project.description && (
              <Text style={styles.projectDescription}>{project.description}</Text>
            )}
            <View style={styles.projectMeta}>
              <Text style={styles.metaText}>
                생성일: {new Date(project.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* 태스크 통계 */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>태스크 현황</Title>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{taskStats.total}</Text>
                <Text style={styles.statLabel}>전체</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: getStatusColor('TODO') }]}>
                  {taskStats.todo}
                </Text>
                <Text style={styles.statLabel}>할 일</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: getStatusColor('IN_PROGRESS') }]}>
                  {taskStats.inProgress}
                </Text>
                <Text style={styles.statLabel}>진행 중</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: getStatusColor('DONE') }]}>
                  {taskStats.done}
                </Text>
                <Text style={styles.statLabel}>완료</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 최근 태스크 */}
        <Card style={styles.tasksCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>최근 태스크</Title>
              <Button
                mode="text"
                onPress={() => {
                  // TODO: 전체 태스크 화면으로 이동
                }}
                compact
              >
                전체 보기
              </Button>
            </View>
            
            {tasks.slice(0, 5).map((task) => (
              <Card
                key={task.id}
                style={styles.taskCard}
                onPress={() => handleTaskPress(task)}
              >
                <Card.Content style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <IconButton
                      icon="chevron-right"
                      size={20}
                      onPress={() => handleTaskPress(task)}
                    />
                  </View>
                  <View style={styles.taskTags}>
                    <Chip
                      mode="flat"
                      compact
                      style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) + '20' }]}
                      textStyle={{ color: getStatusColor(task.status), fontSize: 12 }}
                    >
                      {getStatusText(task.status)}
                    </Chip>
                    <Chip
                      mode="flat"
                      compact
                      style={[styles.priorityChip, { backgroundColor: getPriorityColor(task.priority) + '20' }]}
                      textStyle={{ color: getPriorityColor(task.priority), fontSize: 12 }}
                    >
                      {getPriorityText(task.priority)}
                    </Chip>
                  </View>
                  {task.assignee && (
                    <Text style={styles.assignee}>담당자: {task.assignee.name}</Text>
                  )}
                </Card.Content>
              </Card>
            ))}

            {tasks.length === 0 && (
              <View style={styles.emptyTasks}>
                <Text style={styles.emptyText}>아직 태스크가 없습니다.</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateTask}
        label="태스크 생성"
      />
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
  projectCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 12,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 24,
  },
  projectMeta: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaText: {
    fontSize: 14,
    opacity: 0.6,
  },
  statsCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  tasksCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskCard: {
    marginVertical: 4,
    elevation: 1,
    borderRadius: 8,
  },
  taskContent: {
    paddingVertical: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  taskTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  statusChip: {
    height: 24,
  },
  priorityChip: {
    height: 24,
  },
  assignee: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});