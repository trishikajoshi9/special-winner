import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Layout from '@/components/Layout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const data = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-6"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg capitalize font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : chartData ? (
          <div className="space-y-6">
            {/* Lead Status Distribution */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Lead Status Distribution</h2>
              <Chart
                type="pie"
                data={{
                  labels: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
                  datasets: [
                    {
                      data: [
                        chartData.statusNew,
                        chartData.statusContacted,
                        chartData.statusQualified,
                        chartData.statusConverted,
                        chartData.statusLost,
                      ],
                      backgroundColor: [
                        '#3B82F6',
                        '#10B981',
                        '#F59E0B',
                        '#8B5CF6',
                        '#EF4444',
                      ],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: true }}
              />
            </motion.div>

            {/* Lead Score Trend */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Average Lead Score Trend</h2>
              {chartData.scoreTrend && (
                <Chart
                  type="line"
                  data={{
                    labels: chartData.labels,
                    datasets: [
                      {
                        label: 'Avg Score',
                        data: chartData.scoreTrend,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: true }}
                />
              )}
            </motion.div>

            {/* Leads by Source */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Leads by Source</h2>
              {chartData.sourceData && (
                <Chart
                  type="bar"
                  data={{
                    labels: chartData.sourceLabels,
                    datasets: [
                      {
                        label: 'Leads',
                        data: chartData.sourceData,
                        backgroundColor: [
                          '#3B82F6',
                          '#10B981',
                          '#F59E0B',
                          '#8B5CF6',
                        ],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: true }}
                />
              )}
            </motion.div>
          </div>
        ) : null}
      </motion.div>
    </Layout>
  );
}
