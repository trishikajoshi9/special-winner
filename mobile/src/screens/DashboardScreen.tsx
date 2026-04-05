import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import { useLeadStore } from '@store/index';
import apiService from '@services/api';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { leads, setLeads } = useLeadStore();

  const fetchDashboardData = async () => {
    try {
      const [statsData, leadsData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getLeads(),
      ]);
      setStats(statsData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const hotLeads = leads.filter((lead) => lead.score >= 70);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lead Dashboard</Text>
          <Text style={styles.headerSubtitle}>Automated Lead Engagement</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Total Leads"
            value={stats?.totalLeads || 0}
            color="#007AFF"
          />
          <StatCard
            label="Hot Leads"
            value={hotLeads.length}
            color="#FF9500"
          />
          <StatCard
            label="Contacted"
            value={stats?.contacted || 0}
            color="#34C759"
          />
          <StatCard
            label="Converted"
            value={stats?.converted || 0}
            color="#30B0C0"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('ChatList')}
          >
            <Text style={styles.actionButtonText}>💬 View Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('ChatList', { startNew: true })}
          >
            <Text style={styles.actionButtonText}>➕ New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Hot Leads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Hot Leads ({hotLeads.length})</Text>
          {hotLeads.length === 0 ? (
            <Text style={styles.emptyText}>No hot leads at the moment</Text>
          ) : (
            hotLeads.slice(0, 5).map((lead) => (
              <TouchableOpacity
                key={lead.id}
                style={styles.leadCard}
                onPress={() => navigation.navigate('Chat', { leadId: lead.id })}
              >
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>{lead.name}</Text>
                  <Text style={styles.leadPhone}>{lead.phone || lead.email}</Text>
                </View>
                <View style={styles.leadScore}>
                  <Text style={styles.scoreValue}>{lead.score}</Text>
                  <Text style={[
                    styles.scoreLabel,
                    lead.score >= 80 && styles.scoreHot,
                  ]}>
                    {lead.score >= 80 ? '🔥' : '⭐'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Conversion Rate</Text>
          <View style={styles.conversionCard}>
            <Text style={styles.conversionRate}>
              {stats?.conversionRate || 0}%
            </Text>
            <Text style={styles.conversionLabel}>
              {stats?.converted} of {stats?.contacted} converted
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  leadPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  leadScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
  },
  scoreLabel: {
    fontSize: 16,
    marginTop: 2,
  },
  scoreHot: {
    fontSize: 18,
  },
  conversionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  conversionRate: {
    fontSize: 32,
    fontWeight: '700',
    color: '#34C759',
  },
  conversionLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default DashboardScreen;
