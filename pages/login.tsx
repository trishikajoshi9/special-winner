import { motion } from 'framer-motion';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-2xl p-8"
        >
          <h1 className="text-3xl font-bold text-center text-secondary mb-2">Dashboard</h1>
          <p className="text-center text-gray-600 mb-8">AI-Powered Lead Management</p>
          <LoginForm />
        </motion.div>
      </div>
    </motion.div>
  );
}
