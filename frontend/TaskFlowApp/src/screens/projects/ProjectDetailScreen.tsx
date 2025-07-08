import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../../navigation/AppNavigator';

type ProjectDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProjectDetail'>;
type ProjectDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;

interface Props {
  navigation: ProjectDetailScreenNavigationProp;
  route: ProjectDetailScreenRouteProp;
}

export default function ProjectDetailScreen({ navigation, route }: Props) {
  const { projectId } = route.params;

  return (
    <View style={styles.container}>
      <Title>프로젝트 상세</Title>
      <Text>프로젝트 ID: {projectId}</Text>
      <Text>이 화면은 곧 구현됩니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
});