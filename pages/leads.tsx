import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiZap, FiTrendingUp } from 'react-icons/fi';
import LeadsTable from '@/components/LeadsTable';
import AddLeadModal from '@/components/AddLeadModal';
import Layout from '@/components/Layout';

export default function LeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', source: 'all' });
  const [scoringLeadId, setScoringLeadId] = useState<string | null>(null);
  const [leadScores, setLeadScores] = useState<Record<string, any>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchLeads();
  }, [session, filter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.source !== 'all') params.append('source', filter.source);

      const response = await fetch(`/api/leads?${params.toString()}`);
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (leadData: any) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      if (response.ok) {
        setShowModal(false);
        fetchLeads();
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const scoreLead = async (leadId: string) => {
    try {
      setScoringLeadId(leadId);
      const response = await fetch('/api/leads/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });

      const data = await response.json();
      setLeadScores((prev) => ({ ...prev, [leadId]: data }));
    } catch (error) {
      console.error('Error scoring lead:', error);
    } finally {
      setScoringLeadId(null);
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
    visible: { opacity: 1, y: 0 },
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
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Leads Management</h1>
            <p className="text-gray-600 mt-1">Total leads: {leads.length}</p>
          </div>
          <motion.button
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow font-medium"
          >
            + Add Lead
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 bg-white rounded-lg shadow-md p-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={filter.source}
            onChange={(e) => setFilter({ ...filter, source: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="form">Form</option>
            <option value="api">API</option>
          </select>
        </motion.div>

        {/* Leads Table */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No leads found. Create one to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Score</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Source</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: any, idx: number) => {
                    const score = leadScores[lead.id];
                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 font-medium text-gray-900">{lead.name}</td>
                        <td className="py-4 px-6 text-gray-600 text-xs sm:text-sm">{lead.email || '—'}</td>
                        <td className="py-4 px-6 text-gray-600 text-xs sm:text-sm">{lead.phone || '—'}</td>
                        <td className="py-4 px-6">
                          <motion.div
                            className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${
                              lead.score >= 70
                                ? 'bg-green-100 text-green-700'
                                : lead.score >= 50
                                ? 'bg-yellow-100 text-yellow-700'
                                : lead.score >= 30
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {lead.score}
                          </motion.div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-700 font-medium">
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600 text-xs sm:text-sm capitalize">{lead.source}</td>
                        <td className="py-4 px-6">
                          <motion.button
                            onClick={() => scoreLead(lead.id)}
                            disabled={scoringLeadId === lead.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 text-xs font-medium transition-all"
                          >
                            {scoringLeadId === lead.id ? (
                              <>
                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                              </>
                            ) : (
                              <>
                                <FiZap size={14} />
                                <span className="hidden sm:inline">Score</span>
                              </>
                            )}
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Score Details Modal */}
        {Object.keys(leadScores).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-xl font-bold mb-4">🤖 Lead Scoring Details</h3>
            <div className="space-y-4">
              {Object.entries(leadScores).map(([leadId, score]: any) => {
                const lead = leads.find((l: any) => l.id === leadId);
                return (
                  <motion.div
                    key={leadId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-l-4 border-indigo-500 pl-4 py-2"
                  >
                    <p className="font-semibold text-gray-900">{lead?.name}</p>
                    <p className="text-sm text-gray-600">Score: {score.score}/100</p>
                    <p className="text-sm text-gray-600">Recommendation: {score.recommendation}</p>
                    {score.suggestedMessage && (
                      <p className="text-xs text-gray-500 italic mt-2">"{score.suggestedMessage}"</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Add Lead Modal */}
        {showModal && (
          <AddLeadModal
            onClose={() => setShowModal(false)}
            onAdd={handleAddLead}
          />
        )}
      </motion.div>
    </Layout>
  );
}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <LeadsTable leads={leads} onRefresh={fetchLeads} />
      )}

      {showModal && (
        <AddLeadModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddLead}
        />
      )}
    </motion.div>
  );
}
