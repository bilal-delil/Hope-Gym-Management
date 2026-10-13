import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { useAuth } from 'contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center minH='100vh'>
        <Spinner size='xl' color='brand.500' />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to='/auth/sign-in' replace state={{ from: location }} />;
  }

  return children;
}
