import React from 'react';
import { LayoutDashboard, Wallet, CheckSquare, Users, PenTool, Image, Newspaper, Bell, MessageSquare, LogOut, Home, Shield, ExternalLink, FileText, Calendar, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string | undefined;
  isOpen: boolean;        // New Prop
  onClose: () => void;    // New Prop
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, isOpen, onClose }) => {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const isSuperAdmin = ['SUPER_ADMIN', 'super_admin'].includes(role || '');

  if (!currentUser) return null;

  // Main Menu Items (Common)
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'funds', label: 'Funds & Projects', icon: Wallet },
  ];

  // Items visible to ONLY Super Admin
  const superOnlyItems = [
    { id: 'users', label: 'Members', icon: Users },
    { id: 'gallery-admin', label: 'Gallery', icon: Image },
    { id: 'news-admin', label: 'News & Updates', icon: Newspaper },
    { id: 'approve-requests', label: 'Approvals', icon: CheckSquare },
    { id: 'site-editor', label: 'Site Editor', icon: PenTool },
    { id: 'bills', label: 'Bills & Vouchers', icon: FileText },
    { id: 'notify', label: 'Notifications', icon: Bell },
  ];

  const adminItems = [];

  const handleLogout = () => {
    logout();
    navigate(RoutePath.LOGIN);
  };

  const NavItem = ({ item, isActive, onClick, isDanger = false, isSuper = false }: any) => (
    <motion.button
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => { onClick(); onClose(); }} // Close sidebar on mobile click
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm relative overflow-hidden group ${isActive
        ? isSuper
          ? 'bg-red-600/20 text-red-400 border border-red-500/30'
          : 'bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        : isDanger
          ? 'text-red-500 hover:bg-red-900/20'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeGlow"
          className={`absolute inset-0 rounded-xl ${isSuper ? 'bg-red-600/10' : 'bg-white/5'} blur-md`}
        />
      )}
      <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-glow' : ''}`} />
      <span className="relative z-10">{item.label}</span>
      {isActive && <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-white absolute right-4" />}
    </motion.button>
  );

  return (
    <>
      {/* MOBILE BACKDROP */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR CONTAINER */}
      <motion.aside
        className={`fixed inset-y-0 left-0 w-72 glass-panel border-r-0 z-50 pt-24 pb-6 m-0 md:m-4 rounded-r-3xl md:rounded-3xl h-full md:h-[calc(100vh-2rem)] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full relative">

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden"
          >
            <X />
          </button>

          <div className="flex-1 overflow-y-auto py-2 px-4 space-y-1 custom-scrollbar">

            {/* Sidebar Logo */}
            <div className="px-4 mb-6 mt-2 flex flex-col items-center text-center">
              <img
                src="https://i.postimg.cc/Qtzp5v4x/ncss-crest-Nalanda-College-Science-Society-300x300-removebg-preview.png"
                alt="NCSS Logo"
                className="h-20 w-auto object-contain mb-3 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]"
              />
              <span className="font-bold text-sm tracking-tight text-white/80 leading-tight">NCSS-MONEY MANAGEMENT</span>
            </div>

            <div className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 mt-6">Dashboard</div>
            {menuItems.map(item => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}

            {/* Transparency Link */}
            <motion.button
              whileHover={{ scale: 1.02, x: 5 }}
              onClick={() => { navigate(RoutePath.TRANSPARENCY); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white font-bold text-sm transition-all"
            >
              <Shield className="w-5 h-5" />
              Transparency
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </motion.button>

            {/* Generate ID Link (Admin & Super Admin) */}
            {(isSuperAdmin || ['MEMBER_ADMIN', 'admin'].includes(role || '')) && (
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                onClick={() => { navigate(RoutePath.GENERATE_ID); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold text-sm transition-all"
              >
                <Shield className="w-5 h-5" />
                Generate ID (Admin)
              </motion.button>
            )}

            {/* Super Admin Only Items */}
            {isSuperAdmin && (
              <>
                <div className="text-xs font-bold text-gray-500 uppercase px-4 mt-8 mb-2">Super Admin</div>
                {superOnlyItems.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    onClick={() => item.id === 'bills' ? navigate(RoutePath.BILLS) : setActiveTab(item.id)}
                    isSuper={true}
                  />
                ))}
              </>
            )}
          </div>

          <div className="px-4 pt-4 border-t border-white/10 space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(RoutePath.HOME)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 font-bold text-sm transition-colors"
            >
              <Home className="w-5 h-5" /> Return to Website
            </motion.button>
            <NavItem
              item={{ label: 'Sign Out', icon: LogOut }}
              isActive={false}
              onClick={handleLogout}
              isDanger={true}
            />
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;