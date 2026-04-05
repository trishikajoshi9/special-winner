import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiLoader } from 'react-icons/fi';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-danger/10 text-danger rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
          <FiMail size={20} className="text-gray-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="ml-3 flex-1 outline-none"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
          <FiLock size={20} className="text-gray-500" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="ml-3 flex-1 outline-none"
            required
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <FiLoader size={20} className="animate-spin" />}
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Demo Credentials */}
      <div className="p-4 bg-gray-100 rounded-lg text-sm">
        <p className="font-medium text-gray-700 mb-2">Demo Credentials:</p>
        <p className="text-gray-600">Email: demo@example.com</p>
        <p className="text-gray-600">Password: demo123</p>
      </div>
    </form>
  );
}
