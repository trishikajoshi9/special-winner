import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import StatsCard from '@/components/StatsCard';
import LeadsList from '@/components/LeadsList';
import ChatWidget from '@/components/ChatWidget';
import ChartsSection from '@/components/ChartsSection';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    converted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <DashboardHeader user={session?.user} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Leads" value={stats.totalLeads} icon="users" trend="+12%" />
        <StatsCard title="New Leads" value={stats.newLeads} icon="star" trend="+8%" />
        <StatsCard title="Contacted" value={stats.contacted} icon="message" trend="+5%" />
        <StatsCard title="Converted" value={stats.converted} icon="check" trend="+3%" />
      </div>

      {/* Charts & Analytics */}
      <ChartsSection />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LeadsList />
        </div>
        <div>
          <ChatWidget />
        </div>
      </div>
    </motion.div>
  );
}
