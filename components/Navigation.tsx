import { FiMenu, FiBell, FiSearch, FiUser } from 'react-icons/fi';
import { useSession } from 'next-auth/react';

interface NavigationProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Navigation({
  sidebarOpen,
  setSidebarOpen,
}: NavigationProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiMenu size={24} />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 flex-1 max-w-sm">
            <FiSearch size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search leads..."
              className="bg-transparent outline-none flex-1"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FiBell size={24} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <p className="font-medium text-sm">{session?.user?.name}</p>
              <p className="text-gray-500 text-xs">{session?.user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <FiUser size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
