import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  Box,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/auth.png';
import { useAuth } from 'contexts/AuthContext';

export default function SignIn() {
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const { loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/admin/default', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (!loading && isAuthenticated) {
    return <Navigate to='/admin/default' replace />;
  }

  const handleSuccess = async (response) => {
    if (!response?.credential) {
      toast({ title: 'Google sign-in failed', status: 'error' });
      return;
    }
    setBusy(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/admin/default', { replace: true });
    } catch (err) {
      toast({
        title: err.message || 'Google sign-in failed',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      <Flex
        maxW={{ base: '100%', md: 'max-content' }}
        w='100%'
        mx={{ base: 'auto', lg: '0px' }}
        me='auto'
        h='100%'
        alignItems='start'
        justifyContent='center'
        mb={{ base: '30px', md: '60px' }}
        px={{ base: '25px', md: '0px' }}
        mt={{ base: '40px', md: '14vh' }}
        flexDirection='column'>
        <Box me='auto'>
          <Heading color={textColor} fontSize='36px' mb='10px'>
            Hope Gym
          </Heading>
          <Text
            mb='36px'
            ms='4px'
            color={textColorSecondary}
            fontWeight='400'
            fontSize='md'>
            Sign in with Google to manage the gym
          </Text>
        </Box>
        <Flex
          zIndex='2'
          direction='column'
          w={{ base: '100%', md: '420px' }}
          maxW='100%'
          background='transparent'
          borderRadius='15px'
          mx={{ base: 'auto', lg: 'unset' }}
          me='auto'
          mb={{ base: '20px', md: 'auto' }}
          opacity={busy ? 0.7 : 1}
          pointerEvents={busy ? 'none' : 'auto'}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() =>
              toast({ title: 'Google sign-in was cancelled', status: 'warning' })
            }
            useOneTap={false}
            theme='outline'
            size='large'
            width='100%'
            text='signin_with'
            shape='rectangular'
          />
          <Text mt='20px' fontSize='sm' color={textColorSecondary}>
            Only allowlisted admin Google accounts can access this dashboard.
          </Text>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}
