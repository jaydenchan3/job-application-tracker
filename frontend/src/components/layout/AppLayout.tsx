import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoBox from '../../assets/images/logo_box_bg.png';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Navigation items for sidebar
 // Navigation items for sidebar
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '📊'
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: '📝'
  },
  {
    name: 'Companies',
    href: '/companies',
    icon: '🏢'
  },
  {
    name: 'Documents',          
    href: '/documents',          
    icon: '📄'                   
  },
  {
    name: 'Add Application',
    href: '/applications/add',
    icon: '➕'
  },
  {
    name: 'Interviews',          
    href: '/interviews',         
    icon: '📅'                   
  }
];

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-800 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`} style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
        
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-6 border-b border-stone-600 bg-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
              <img src={logoBox} alt="Job Tracker" className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-stone-200 hover:bg-stone-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* Left side - Hamburger menu and title */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSidebarOpen(!isSidebarOpen);
                  }}
                  className="lg:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 z-50 relative"
                >
                  ☰
                </button>
                
                {/* Search bar - optional */}
                <div className="hidden md:block">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔍</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Profile dropdown */}
              <div className="flex items-center space-x-4">
                {/* Notifications - optional */}
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                  🔔
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      className="w-8 h-8 rounded-full"
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${user?.firstName || ''} ${user?.lastName || user?.email || 'User'}`
                      )}&background=292524&color=fff&length=2`}
                      alt="Profile"
                    />
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.email && user.email.length > 20 
                          ? `${user.email.substring(0, 20)}...` 
                          : user?.email || 'No email'}
                      </p>
                    </div>
                    <span className="text-gray-400">▼</span>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50 border border-gray-300" style={{ backgroundColor: '#f5f5f4' }}>
                      <div className="px-4 py-3 border-b border-gray-300">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.email}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          // Future: navigate to profile settings
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-200"
                      >
                        👤 Profile Settings
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          // Future: navigate to settings
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-200"
                      >
                        ⚙️ Settings
                      </button>
                      
                      <div className="border-t border-gray-300 my-1"></div>
                      
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-200"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay - Colored Background */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900 bg-opacity-75 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Click outside handler for profile dropdown */}
      {isProfileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;