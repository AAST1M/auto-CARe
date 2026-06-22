import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { NavigationProps } from '../types/navigation';
import { Wrench, MapPin, Search, LogOut } from 'lucide-react-native';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProps>();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent default behavior (exiting app)
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Driver'} 👋</Text>
          <Text style={styles.subtitle}>How can we help you today?</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {/* Request Winch Card */}
        <TouchableOpacity 
          style={[styles.card, styles.winchCard]}
          onPress={() => navigation.navigate('WinchMap')}
        >
          <View style={styles.cardHeader}>
            <MapPin size={32} color="#fff" />
            <Text style={styles.cardTitleLight}>Request Winch</Text>
          </View>
          <Text style={styles.cardDescLight}>Stranded? Get a tow truck to your location instantly.</Text>
        </TouchableOpacity>

        {/* AI Diagnostics */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('AIDiagnostics')}
        >
          <View style={styles.cardHeader}>
            <Search size={32} color="#3b82f6" />
            <Text style={styles.cardTitle}>AI Diagnostics</Text>
          </View>
          <Text style={styles.cardDesc}>Chat with our AI to diagnose engine issues or dashboard lights.</Text>
        </TouchableOpacity>

        {/* Find Workshop */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('FindWorkshop')}
        >
          <View style={styles.cardHeader}>
            <Wrench size={32} color="#10b981" />
            <Text style={styles.cardTitle}>Find Workshop</Text>
          </View>
          <Text style={styles.cardDesc}>Locate nearby mechanics and book an appointment.</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
  },
  grid: {
    padding: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  winchCard: {
    backgroundColor: '#3b82f6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardTitleLight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  cardDescLight: {
    fontSize: 14,
    color: '#bfdbfe',
    lineHeight: 20,
  }
});
