import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../services/authService';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;
