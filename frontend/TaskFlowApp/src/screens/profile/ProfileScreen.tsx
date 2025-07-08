import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Title,
  Text,
  Button,
  Card,
  Avatar,
  List,
  Divider,
  useTheme,
} from 'react-native-paper';

import { useAuthStore } from '../../store/auth';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'MANAGER':
        return '매니저';
      case 'MEMBER':
        return '멤버';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#ef4444';
      case 'MANAGER':
        return '#f59e0b';
      case 'MEMBER':
        return '#10b981';
      default:
        return theme.colors.primary;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.screenTitle}>프로필</Title>
      </View>

      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={user.name.charAt(0).toUpperCase()}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{user.name}</Title>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleContainer}>
              <Text
                style={[
                  styles.roleText,
                  { backgroundColor: getRoleColor(user.role) }
                ]}
              >
                {getRoleText(user.role)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.menuCard}>
        <List.Section>
          <List.Item
            title="계정 설정"
            description="개인정보 및 보안 설정"
            left={(props) => <List.Icon {...props} icon="account-cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('알림', '계정 설정 기능은 곧 추가됩니다.')}
          />
          <Divider />
          <List.Item
            title="알림 설정"
            description="푸시 알림 및 이메일 설정"
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('알림', '알림 설정 기능은 곧 추가됩니다.')}
          />
          <Divider />
          <List.Item
            title="앱 정보"
            description="버전 정보 및 이용약관"
            left={(props) => <List.Icon {...props} icon="information-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('TaskFlow', 'Version 1.0.0')}
          />
        </List.Section>
      </Card>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#ef4444"
          icon="logout"
        >
          로그아웃
        </Button>
      </View>
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
  },
  profileCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
  },
  roleContainer: {
    alignItems: 'center',
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
    borderRadius: 12,
  },
  footer: {
    padding: 16,
    marginTop: 'auto',
  },
  logoutButton: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
});