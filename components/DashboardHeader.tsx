import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  user?: any;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 18
      ? 'Good Afternoon'
      : 'Good Evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold text-secondary">
        {greeting}, {user?.name}! 👋
      </h1>
      <p className="text-gray-600 mt-2">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </p>
    </motion.div>
  );
}
