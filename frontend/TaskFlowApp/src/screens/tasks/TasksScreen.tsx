import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Text } from 'react-native-paper';

export default function TasksScreen() {
  return (
    <View style={styles.container}>
      <Title>태스크</Title>
      <Text>태스크 화면은 곧 구현됩니다.</Text>
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