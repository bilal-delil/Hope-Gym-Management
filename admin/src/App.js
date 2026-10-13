import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from 'contexts/AuthContext';
import ProtectedRoute from 'components/auth/ProtectedRoute';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export default function Main() {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ChakraProvider theme={currentTheme}>
          <Routes>
            <Route path='auth/*' element={<AuthLayout />} />
            <Route
              path='admin/*'
              element={
                <ProtectedRoute>
                  <AdminLayout
                    theme={currentTheme}
                    setTheme={setCurrentTheme}
                  />
                </ProtectedRoute>
              }
            />
            <Route path='/' element={<Navigate to='/admin/default' replace />} />
          </Routes>
        </ChakraProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
