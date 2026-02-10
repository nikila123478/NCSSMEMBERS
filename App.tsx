import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { StoreProvider } from './context/StoreContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GenericPage from './pages/GenericPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Transparency from './pages/Transparency';
import Gallery from './pages/Gallery';
import News from './pages/News';
import Bills from './pages/admin/Bills';
import FundsManagement from './pages/FundsManagement';
import UserManagement from './pages/UserManagement';
import RequestsAdmin from './pages/RequestsAdmin';
import SiteEditor from './pages/SiteEditor';
import GalleryAdmin from './pages/GalleryAdmin';
import MonthlyReport from './pages/admin/MonthlyReport';
import NewsAdmin from './pages/NewsAdmin';
import AdminChat from './pages/AdminChat';
import GenerateID from './pages/admin/GenerateID';
import VerifyID from './pages/public/VerifyID';
import AllIDs from './pages/admin/AllIDs';
import Notifications from './pages/admin/Notifications';
import Profile from './pages/Profile';
import { RoutePath } from './types';
import ProtectedRoute from './components/ProtectedRoute';
import SimpleAuthRoute from './components/SimpleAuthRoute';
import About from './pages/About';
import Contact from './pages/Contact';
import Help from './pages/Help';
import MemberDashboard from './pages/MemberDashboard';

// Wrapper for page transitions
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="flex-grow flex flex-col"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path={RoutePath.HOME} element={<PageWrapper><Home /></PageWrapper>} />
        <Route path={RoutePath.LOGIN} element={<PageWrapper><Login /></PageWrapper>} />
        <Route path={RoutePath.SIGNUP} element={<PageWrapper><Signup /></PageWrapper>} />
        <Route path={RoutePath.TRANSPARENCY} element={<PageWrapper><Transparency /></PageWrapper>} />
        <Route path={RoutePath.GALLERY} element={<PageWrapper><Gallery /></PageWrapper>} />
        <Route path={RoutePath.NEWS} element={<PageWrapper><News /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
        <Route path="/help" element={<PageWrapper><Help /></PageWrapper>} />

        <Route path="/profile" element={
          <PageWrapper>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </PageWrapper>
        } />

        {/* --- PROTECTED ADMIN ROUTES --- */}
        <Route path={RoutePath.DASHBOARD} element={
          <PageWrapper>
            {/* Admin Dashboard: Only Admins */}
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'SUPER_ADMIN', 'MEMBER_ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          </PageWrapper>
        } />

        {/* --- PROTECTED MEMBER ROUTES --- */}
        <Route path="/member/dashboard" element={
          <PageWrapper>
            {/* Member Dashboard: Members AND Admins allowed */}
            <ProtectedRoute allowedRoles={['member', 'USER', 'admin', 'super_admin', 'SUPER_ADMIN', 'MEMBER_ADMIN']}>
              <MemberDashboard />
            </ProtectedRoute>
          </PageWrapper>
        } />

        {/* Other Admin Tools */}
        <Route path={RoutePath.FUNDS} element={
          <PageWrapper>
            <ProtectedRoute>
              <FundsManagement />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.USERS} element={
          <PageWrapper>
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.REQUESTS} element={
          <PageWrapper>
            <ProtectedRoute>
              <RequestsAdmin />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.SITE_EDITOR} element={
          <PageWrapper>
            <ProtectedRoute>
              <SiteEditor />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.GALLERY_ADMIN} element={
          <PageWrapper>
            <ProtectedRoute>
              <GalleryAdmin />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.NEWS_ADMIN} element={
          <PageWrapper>
            <ProtectedRoute>
              <NewsAdmin />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.CHAT} element={
          <PageWrapper>
            <ProtectedRoute>
              <AdminChat />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.BILLS} element={
          <PageWrapper>
            <ProtectedRoute>
              <Bills />
            </ProtectedRoute>
          </PageWrapper>
        } />
        <Route path={RoutePath.MONTHLY_REPORT} element={
          <PageWrapper>
            <ProtectedRoute>
              <MonthlyReport />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.GENERATE_ID} element={
          <PageWrapper>
            <SimpleAuthRoute>
              <GenerateID />
            </SimpleAuthRoute>
          </PageWrapper>
        } />

        <Route path={RoutePath.ALL_IDS} element={
          <PageWrapper>
            <ProtectedRoute>
              <AllIDs />
            </ProtectedRoute>
          </PageWrapper>
        } />

        <Route path="/admin/notifications" element={
          <PageWrapper>
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          </PageWrapper>
        } />

        {/* PUBLIC ROUTE FOR ID VERIFICATION */}
        <Route path={RoutePath.VERIFY_ID} element={<PageWrapper><VerifyID /></PageWrapper>} />

      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Router>
        {/* Global Theme: Black Background, White Text, Min-Height Screen */}
        <div className="antialiased min-h-screen flex flex-col font-outfit bg-black text-white">
          <Navbar />
          <AnimatedRoutes />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default App;