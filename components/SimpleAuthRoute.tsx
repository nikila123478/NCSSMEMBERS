import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { RoutePath } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface SimpleAuthRouteProps {
    children: React.ReactNode;
}

const SimpleAuthRoute: React.FC<SimpleAuthRouteProps> = ({ children }) => {
    const { currentUser, logout } = useStore();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(doc(db, 'users', currentUser.id), (docSnap) => {
            if (!docSnap.exists()) {
                logout();
                navigate(RoutePath.LOGIN);
                return;
            }

            const data = docSnap.data();
            const role = data.role || 'USER';
            const isSuperAdmin = ['SUPER_ADMIN', 'super_admin'].includes(role);

            if (data.isApproved !== true && !isSuperAdmin) {
                // Real-time kick if approval is revoked (unless super admin)
                navigate(RoutePath.HOME);
            }
        });

        return () => unsubscribe();
    }, [currentUser, logout, navigate]);

    if (!currentUser) {
        return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default SimpleAuthRoute;
