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
  Paragraph,
  FAB,
  Text,
  IconButton,
  ActivityIndicator,
  Searchbar,
  useTheme,
} from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { MainTabParamList, RootStackParamList } from '../../navigation/AppNavigator';
import { GET_PROJECTS } from '../../services/graphql/projects';
import { useProjectsStore } from '../../store/projects';
import { useAuthStore } from '../../store/auth';
import { Project } from '../../types';

type ProjectsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Projects'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: ProjectsScreenNavigationProp;
}

export default function ProjectsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { projects, setProjects, setLoading, setError } = useProjectsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  const { data, loading, error, refetch } = useQuery(GET_PROJECTS, {
    onCompleted: (data) => {
      setProjects(data.projects || []);
    },
    onError: (error) => {
      setError(error.message);
      Alert.alert('오류', '프로젝트를 불러오는데 실패했습니다.');
    },
  });

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [projects, searchQuery]);

  const handleRefresh = () => {
    refetch();
  };

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const handleCreateProject = () => {
    // TODO: 프로젝트 생성 모달 또는 화면으로 이동
    Alert.alert('알림', '프로젝트 생성 기능은 곧 추가됩니다.');
  };

  const renderProject = ({ item }: { item: Project }) => (
    <Card
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
    >
      <Card.Content>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Title style={styles.projectTitle}>{item.name}</Title>
            {item.description && (
              <Paragraph style={styles.projectDescription}>
                {item.description}
              </Paragraph>
            )}
          </View>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => handleProjectPress(item)}
          />
        </View>
        <View style={styles.projectMeta}>
          <Text style={styles.metaText}>
            생성일: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="folder-plus" size={64} iconColor={theme.colors.outline} />
      <Title style={[styles.emptyTitle, { color: theme.colors.outline }]}>
        프로젝트가 없습니다
      </Title>
      <Paragraph style={[styles.emptyText, { color: theme.colors.outline }]}>
        새 프로젝트를 생성하여 팀 협업을 시작해보세요
      </Paragraph>
    </View>
  );

  if (loading && projects.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>프로젝트를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.screenTitle}>프로젝트</Title>
        <Text style={styles.welcomeText}>안녕하세요, {user?.name}님!</Text>
      </View>

      <Searchbar
        placeholder="프로젝트 검색"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredProjects}
        renderItem={renderProject}
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
        onPress={handleCreateProject}
        label="프로젝트 생성"
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
  welcomeText: {
    fontSize: 16,
    opacity: 0.7,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  projectCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  projectMeta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaText: {
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