import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiTrendingUp, FiUsers, FiMail, FiPhone } from 'react-icons/fi';
import Layout from '@/components/Layout';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  score: number;
  status: string;
  source: string;
  createdAt: string;
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  avgScore: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    conversionRate: 0,
    avgScore: 0,
  });
  const [topLeads, setTopLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchDashboardData();
    checkGmailStatus();

    // Refresh data every 10 seconds for real-time feel
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      setStats(data.stats);
      setTopLeads(data.topLeads);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGmailStatus = async () => {
    try {
      const response = await fetch('/api/integrations/gmail');
      const data = await response.json();
      setGmailConnected(data.connected);
    } catch (error) {
      console.error('Error checking Gmail:', error);
    }
  };

  const handleGmailConnect = async () => {
    try {
      const response = await fetch('/api/integrations/gmail');
      const data = await response.json();
      if (!data.connected) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
    }
  };

  const handleGmailSync = async () => {
    try {
      const response = await fetch('/api/integrations/gmail', {
        method: 'POST',
      });
      if (response.ok) {
        alert('Gmail leads synced successfully!');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error syncing Gmail:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {session?.user?.name}!</p>
          </motion.div>
          <motion.div variants={itemVariants} className="flex gap-3">
            <button
              onClick={handleGmailConnect}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                gmailConnected
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {gmailConnected ? '✓ Gmail Connected' : 'Connect Gmail'}
            </button>
            {gmailConnected && (
              <button
                onClick={handleGmailSync}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-all"
              >
                Sync Gmail
              </button>
            )}
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Total Leads',
              value: stats.totalLeads,
              icon: <FiUsers className="w-6 h-6" />,
              color: 'blue',
            },
            {
              label: 'New Leads',
              value: stats.newLeads,
              icon: <FiMail className="w-6 h-6" />,
              color: 'green',
            },
            {
              label: 'Qualified',
              value: stats.qualifiedLeads,
              icon: <FiAlertCircle className="w-6 h-6" />,
              color: 'purple',
            },
            {
              label: 'Conversion',
              value: `${stats.conversionRate}%`,
              icon: <FiTrendingUp className="w-6 h-6" />,
              color: 'orange',
            },
            {
              label: 'Avg Score',
              value: stats.avgScore.toFixed(0),
              icon: <FiPhone className="w-6 h-6" />,
              color: 'red',
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${stat.color}-500`}
            >
              <div className={`flex justify-between items-start`}>
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`text-${stat.color}-500`}>{stat.icon}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Top Leads */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">🔥 Hot Leads</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : topLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No leads yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map((lead, idx) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">{lead.name}</td>
                      <td className="py-4 px-4 text-gray-600">{lead.email || '—'}</td>
                      <td className="py-4 px-4 text-gray-600">{lead.company || '—'}</td>
                      <td className="py-4 px-4">
                        <motion.div
                          className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${
                            lead.score >= 70
                              ? 'bg-green-100 text-green-700'
                              : lead.score >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {lead.score}
                        </motion.div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 font-medium">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{lead.source}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
}
