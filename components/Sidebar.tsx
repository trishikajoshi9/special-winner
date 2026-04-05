import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  FiHome,
  FiUsers,
  FiMessageSquare,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiX,
  FiChevronRight,
} from 'react-icons/fi';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome, color: 'from-blue-500 to-blue-600' },
    { name: 'Leads', href: '/leads', icon: FiUsers, color: 'from-purple-500 to-purple-600' },
    { name: 'Chat', href: '/chat', icon: FiMessageSquare, color: 'from-green-500 to-green-600' },
    { name: 'Analytics', href: '/analytics', icon: FiBarChart2, color: 'from-orange-500 to-orange-600' },
    { name: 'Settings', href: '/settings', icon: FiSettings, color: 'from-gray-500 to-gray-600' },
  ];

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -256, opacity: 0 },
  };

  const menuItemVariants = {
    initial: { x: -20, opacity: 0 },
    animate: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
  };

  return (
    <>
      {/* Mobile Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <motion.aside
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ duration: 0.3 }}
        className="fixed lg:static w-64 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white z-50 flex flex-col shadow-2xl"
      >
        {/* Logo */}
        <motion.div className="p-6 flex items-center justify-between border-b border-slate-700">
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            📊 Dashboard
          </motion.h1>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white hover:text-gray-300 transition"
          >
            <FiX size={24} />
          </button>
        </motion.div>

        {/* Menu */}
        <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;

            return (
              <motion.div
                key={item.href}
                custom={i}
                variants={menuItemVariants}
                initial="initial"
                animate="animate"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link href={item.href}>
                  <motion.a
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`relative z-10 text-lg`}>
                      <Icon size={20} />
                    </div>
                    <span className="font-medium text-sm">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-4 text-white"
                      >
                        <FiChevronRight size={16} />
                      </motion.div>
                    )}
                    {hoveredItem === item.href && !isActive && (
                      <motion.div
                        className="absolute right-4 text-gray-400"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <FiChevronRight size={16} />
                      </motion.div>
                    )}
                  </motion.a>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Divider */}
        <motion.div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* Logout */}
        <motion.div 
          className="p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/20 rounded-lg transition-all group border border-transparent hover:border-red-500/30"
          >
            <FiLogOut size={20} className="group-hover:text-red-400 transition" />
            <span className="font-medium text-sm">Logout</span>
          </motion.button>
        </motion.div>
      </motion.aside>
    </>
  );
}

