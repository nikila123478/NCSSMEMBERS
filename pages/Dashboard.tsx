import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { RoutePath } from '../types';
import { useNavigate } from 'react-router-dom';
import DashboardHome from '../components/DashboardHome';
import FundsManagement from './FundsManagement';
import UserManagement from './UserManagement';
import SiteEditor from './SiteEditor';
import GalleryAdmin from './GalleryAdmin';
import NewsAdmin from './NewsAdmin';
import Sidebar from '../components/Sidebar';
import RequestsAdmin from './RequestsAdmin';
import AdminChat from './AdminChat';
import NotificationsAdmin from './admin/Notifications';
import EventManager from './EventManager';
import { Bell, Calendar, Lock, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { currentUser, sendNotification } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [notifyMsg, setNotifyMsg] = useState('');

  // Real-Time Clock State Removed


  useEffect(() => {
    if (!currentUser) {
      navigate(RoutePath.LOGIN);
    }
  }, [currentUser, navigate]);

  // Clock Timer Removed


  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const restrictedTabs = ['approve-requests', 'users', 'news-admin', 'gallery-admin', 'site-editor', 'notify', 'meetings'];

  if (!isSuperAdmin && restrictedTabs.includes(activeTab)) {
    setActiveTab('overview');
  }

  // --- MEMBER PROTECTION LOGIC ---
  const { access } = useStore();
  useEffect(() => {
    // If not super admin/admin (so, normal member) AND not approved
    const isMember = ['USER', 'member'].includes(currentUser?.role || '');
    const isApproved = currentUser?.isApproved === true;

    if (isMember && !isApproved) {
      // Kick them back to home
      navigate(RoutePath.HOME);
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-black text-white pt-32 md:pt-36 flex relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black pointer-events-none" />

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={currentUser.role} />

      {/* Main Content */}
      <main className="relative z-10 flex-1 md:ml-[20rem] p-6 lg:p-10 animate-fade-in pb-24 min-h-screen">

        {/* Real-Time Clock Header REMOVED */}


        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <DashboardHome />}
          {activeTab === 'events' && <EventManager />}
          {activeTab === 'funds' && <FundsManagement />}

          {isSuperAdmin && (
            <>
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'site-editor' && <SiteEditor />}
              {activeTab === 'gallery-admin' && <GalleryAdmin />}
              {activeTab === 'news-admin' && <NewsAdmin />}
              {activeTab === 'approve-requests' && <RequestsAdmin />}

              {activeTab === 'meetings' && (
                <div className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center h-96 text-gray-400">
                  <Calendar className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-xl font-bold">Meetings Module</h3>
                  <p>Coming Soon</p>
                </div>
              )}

              {activeTab === 'notify' && <NotificationsAdmin />}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;