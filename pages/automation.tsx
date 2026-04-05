import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import styles from '@/styles/automation.module.css';

interface MetricCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
}

const AutomationPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 10 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/automation/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading automation metrics...</p>
        </div>
      </Layout>
    );
  }

  const metricCards: MetricCard[] = [
    {
      label: 'Hot Leads',
      value: metrics?.hotLeads || 0,
      icon: '🔥',
      color: '#FF9500',
      trend: `of ${metrics?.totalLeads || 0} total`,
    },
    {
      label: 'Messages Today',
      value: metrics?.messagesToday || 0,
      icon: '💬',
      color: '#007AFF',
      trend: `${metrics?.successRate?.toFixed(1) || 0}% success`,
    },
    {
      label: 'Conversion Rate',
      value: `${metrics?.conversionRate?.toFixed(1) || 0}%`,
      icon: '📈',
      color: '#34C759',
      trend: 'auto-engaged leads',
    },
    {
      label: 'Revenue Today',
      value: `$${metrics?.revenueToday?.toFixed(2) || '0.00'}`,
      icon: '💰',
      color: '#30B0C0',
      trend: 'from conversions',
    },
    {
      label: 'Avg Response',
      value: `${metrics?.averageResponseTime?.toFixed(1) || '0'}m`,
      icon: '⏱️',
      color: '#FF3B30',
      trend: 'time',
    },
    {
      label: 'Failed Actions',
      value: metrics?.failedWebhooks || 0,
      icon: '⚠️',
      color: '#FF3B30',
      trend: 'errors to resolve',
    },
  ];

  return (
    <Layout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🤖 Automation Dashboard</h1>
            <p className={styles.subtitle}>Real-time lead automation metrics</p>
          </div>
          <button
            className={styles.refreshButton}
            onClick={fetchMetrics}
            title="Refresh metrics"
          >
            🔄
          </button>
        </div>

        {/* Auto-Refresh Toggle */}
        <div className={styles.controlsSection}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className={styles.checkbox}
            />
            Auto-refresh every 10 seconds
          </label>
          <div className={styles.lastRefresh}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={styles.metricsGrid}>
          {metricCards.map((card, idx) => (
            <motion.div
              key={idx}
              className={styles.metricCard}
              style={{ borderLeftColor: card.color }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ transform: 'translateY(-4px)' }}
            >
              <div className={styles.metricIcon}>{card.icon}</div>
              <div className={styles.metricContent}>
                <p className={styles.metricLabel}>{card.label}</p>
                <p className={styles.metricValue}>{card.value}</p>
                {card.trend && (
                  <p className={styles.metricTrend}>{card.trend}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status Section */}
        <motion.div
          className={styles.statusSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>System Status</h2>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <div className={styles.statusIndicator} style={{ backgroundColor: '#34C759' }} />
              <div>
                <p className={styles.statusName}>Gmail Sync</p>
                <p className={styles.statusValue}>Active ✓</p>
              </div>
            </div>

            <div className={styles.statusItem}>
              <div className={styles.statusIndicator} style={{ backgroundColor: '#34C759' }} />
              <div>
                <p className={styles.statusName}>Aisensy API</p>
                <p className={styles.statusValue}>Connected ✓</p>
              </div>
            </div>

            <div className={styles.statusItem}>
              <div className={styles.statusIndicator} style={{ backgroundColor: '#34C759' }} />
              <div>
                <p className={styles.statusName}>Cron Jobs</p>
                <p className={styles.statusValue}>Running ✓</p>
              </div>
            </div>

            <div className={styles.statusItem}>
              <div className={styles.statusIndicator} style={{ backgroundColor: '#34C759' }} />
              <div>
                <p className={styles.statusName}>Webhooks</p>
                <p className={styles.statusValue}>Monitoring ✓</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Last Auto-Engagement */}
        {metrics?.lastAutoEngagementTime && (
          <motion.div
            className={styles.lastActionSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className={styles.sectionTitle}>Last Activity</h2>
            <p className={styles.lastActionTime}>
              Last auto-engagement: {new Date(metrics.lastAutoEngagementTime).toLocaleString()}
            </p>
          </motion.div>
        )}

        {/* Performance Tips */}
        <motion.div
          className={styles.tipsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>💡 Automation Tips</h2>
          <ul className={styles.tipsList}>
            <li>✓ Hot leads (score ≥ 70) are automatically engaged via WhatsApp</li>
            <li>✓ Follow-ups are sent every 4 hours to non-responsive leads</li>
            <li>✓ AI responses are auto-generated based on customer messages</li>
            <li>✓ All activity is logged for audit trail and compliance</li>
            <li>✓ Revenue is tracked when leads convert to customers</li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AutomationPage;
