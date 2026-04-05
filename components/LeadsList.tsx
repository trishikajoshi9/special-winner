import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiMessageSquare, FiPhone } from 'react-icons/fi';

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentLeads();
  }, []);

  const fetchRecentLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads?take=5');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      converted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-bold text-secondary mb-4">Recent Leads</h2>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : leads.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No leads found</p>
      ) : (
        <div className="space-y-4">
          {leads.map((lead: any) => (
            <motion.div
              key={lead.id}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex-1">
                <h3 className="font-medium text-secondary">{lead.name}</h3>
                <p className="text-sm text-gray-600">{lead.email}</p>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    lead.status
                  )}`}
                >
                  {lead.status}
                </span>

                <div className="flex gap-2">
                  {lead.whatsapp && (
                    <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
                      <FiMessageSquare size={18} />
                    </button>
                  )}
                  {lead.phone && (
                    <button className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                      <FiPhone size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
