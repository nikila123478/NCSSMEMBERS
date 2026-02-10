import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { RoutePath } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // Optional: If provided, strictly enforces these roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { currentUser, logout } = useStore();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        // Real-Time Role & Status Listener
        const unsubscribe = onSnapshot(doc(db, 'users', currentUser.id), (docSnap) => {
            if (!docSnap.exists()) {
                console.warn("User document deleted active session.");
                logout();
                navigate(RoutePath.LOGIN);
                return;
            }

            const data = docSnap.data();
            const role = data.role || 'USER';
            const isApproved = data.isApproved === true;

            // 1. Security Check: Approval
            // EXEMPT SUPER ADMINS from approval check
            const isSuperAdmin = ['SUPER_ADMIN', 'super_admin'].includes(role);
            if (!isApproved && !isSuperAdmin) {
                // If approval is revoked (and not super admin), kick out
                navigate(RoutePath.HOME);
                return;
            }

            // 2. Security Check: Admin Role OR Specific Allowed Roles
            let hasAccess = false;

            if (allowedRoles && allowedRoles.length > 0) {
                // strict check against allowedRoles
                if (allowedRoles.includes(role)) {
                    hasAccess = true;
                }
            } else {
                // Default legacy behavior: Check if Admin
                const isAdmin = ['SUPER_ADMIN', 'MEMBER_ADMIN', 'super_admin', 'admin'].includes(role);
                if (isAdmin) hasAccess = true;
            }

            if (!hasAccess) {
                // If downgraded or unauthorized
                // If trying to access admin panel but is member -> go to member dash
                if (role === 'member' || role === 'USER') {
                    if (location.pathname.startsWith('/admin') || location.pathname === '/dashboard') {
                        navigate('/member/dashboard');
                        return;
                    }
                }
                navigate(RoutePath.HOME); // Fallback
            }
        }, (error) => {
            console.error("Auth Listener Error:", error);
        });

        return () => unsubscribe();
    }, [currentUser, logout, navigate]);

    if (!currentUser) {
        return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
    }

    // Initial Static Check (Fast Fail)
    if (currentUser?.role) {
        if (allowedRoles && allowedRoles.length > 0) {
            if (!allowedRoles.includes(currentUser.role)) {
                // Static fail, let effect handle redirect but return null for now
                return null;
            }
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
