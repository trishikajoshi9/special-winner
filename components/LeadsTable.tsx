import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiMessageSquare } from 'react-icons/fi';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  status: string;
  source: string;
  createdAt: string;
}

interface LeadsTableProps {
  leads: Lead[];
  onRefresh: () => void;
}

export default function LeadsTable({ leads, onRefresh }: LeadsTableProps) {
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        const response = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
        if (response.ok) {
          onRefresh();
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      {leads.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">No leads found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{lead.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.source}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {lead.whatsapp && (
                        <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition">
                          <FiMessageSquare size={18} />
                        </button>
                      )}
                      <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition">
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
