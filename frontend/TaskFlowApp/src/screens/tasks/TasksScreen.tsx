import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Paragraph,
  FAB,
  IconButton,
  ActivityIndicator,
  Searchbar,
  Chip,
  SegmentedButtons,
  Menu,
  Button,
  useTheme,
} from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { MainTabParamList, RootStackParamList } from '../../navigation/AppNavigator';
import { GET_TASKS } from '../../services/graphql/tasks';
import { GET_PROJECTS } from '../../services/graphql/projects';
import { useTasksStore } from '../../store/tasks';
import { useProjectsStore } from '../../store/projects';
import { useAuthStore } from '../../store/auth';
import { Task, Project, TaskFilter } from '../../types';
import CreateTaskModal from '../../components/modals/CreateTaskModal';

type TasksScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Tasks'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: TasksScreenNavigationProp;
}

export default function TasksScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { tasks, setTasks, filter, setFilter } = useTasksStore();
  const { projects, setProjects, selectedProject } = useProjectsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // 프로젝트 목록 가져오기
  const { data: projectsData } = useQuery(GET_PROJECTS, {
    onCompleted: (data) => {
      setProjects(data.projects || []);
    },
  });

  // 선택된 프로젝트의 태스크 가져오기
  const { data: tasksData, loading, error, refetch } = useQuery(GET_TASKS, {
    variables: { 
      projectId: selectedProject?.id || (projects[0]?.id || ''),
      filter: filter 
    },
    skip: !selectedProject?.id && projects.length === 0,
    onCompleted: (data) => {
      setTasks(data.tasks || []);
    },
    onError: (error) => {
      Alert.alert('오류', '태스크를 불러오는데 실패했습니다.');
    },
  });

  useEffect(() => {
    let filtered = tasks;

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // 검색 필터링
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, searchQuery]);

  const handleRefresh = () => {
    refetch();
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const handleCreateTask = () => {
    if (!selectedProject && projects.length === 0) {
      Alert.alert('알림', '먼저 프로젝트를 생성해주세요.');
      return;
    }
    setCreateModalVisible(true);
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

  const statusButtons = [
    { value: 'all', label: '전체' },
    { value: 'TODO', label: '할 일' },
    { value: 'IN_PROGRESS', label: '진행중' },
    { value: 'DONE', label: '완료' },
  ];

  const renderTask = ({ item }: { item: Task }) => (
    <Card
      style={styles.taskCard}
      onPress={() => handleTaskPress(item)}
    >
      <Card.Content>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <Title style={styles.taskTitle}>{item.title}</Title>
            {item.description && (
              <Paragraph style={styles.taskDescription}>
                {item.description}
              </Paragraph>
            )}
          </View>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => handleTaskPress(item)}
          />
        </View>
        
        <View style={styles.taskTags}>
          <Chip
            mode="flat"
            compact
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
          >
            {getStatusText(item.status)}
          </Chip>
          <Chip
            mode="flat"
            compact
            style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) + '20' }]}
            textStyle={{ color: getPriorityColor(item.priority), fontSize: 12 }}
          >
            {getPriorityText(item.priority)}
          </Chip>
        </View>

        <View style={styles.taskMeta}>
          {item.assignee && (
            <Text style={styles.assignee}>담당자: {item.assignee.name}</Text>
          )}
          {item.dueDate && (
            <Text style={styles.dueDate}>
              마감일: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
          <Text style={styles.createdAt}>
            생성일: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="format-list-checks" size={64} iconColor={theme.colors.outline} />
      <Title style={[styles.emptyTitle, { color: theme.colors.outline }]}>
        태스크가 없습니다
      </Title>
      <Paragraph style={[styles.emptyText, { color: theme.colors.outline }]}>
        새 태스크를 생성하여 작업을 시작해보세요
      </Paragraph>
    </View>
  );

  const currentProject = selectedProject || projects[0];

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>태스크를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.screenTitle}>태스크</Title>
        {currentProject && (
          <Text style={styles.projectName}>{currentProject.name}</Text>
        )}
      </View>

      <View style={styles.filters}>
        <Searchbar
          placeholder="태스크 검색"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={statusButtons}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateTask}
        label="태스크 생성"
      />

      <CreateTaskModal
        visible={createModalVisible}
        onDismiss={() => setCreateModalVisible(false)}
        projectId={currentProject?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 16,
    opacity: 0.7,
  },
  filters: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  taskCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
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
  taskMeta: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  assignee: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  createdAt: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});