import { motion } from 'framer-motion';
import {
  FiUsers,
  FiStar,
  FiMessageSquare,
  FiCheck,
  FiTrendingUp,
} from 'react-icons/fi';

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  trend?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
}: StatsCardProps) {
  const icons: { [key: string]: any } = {
    users: FiUsers,
    star: FiStar,
    message: FiMessageSquare,
    check: FiCheck,
  };

  const Icon = icons[icon] || FiUsers;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <h3 className="text-3xl font-bold text-secondary mt-2">{value}</h3>
          {trend && (
            <p className="text-success text-sm mt-2 flex items-center gap-1">
              <FiTrendingUp size={16} />
              {trend}
            </p>
          )}
        </div>
        <div className="p-4 bg-primary/10 rounded-lg">
          <Icon size={32} className="text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
