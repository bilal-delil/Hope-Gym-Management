import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import PageShell from 'components/admin/PageShell';
import { useAuth } from 'contexts/AuthContext';
import api from 'lib/api';

export default function ProfilePage() {
  const { user, refreshMe, logout } = useAuth();
  const toast = useToast();
  const textColor = useColorModeValue('navy.700', 'white');
  const muted = useColorModeValue('gray.500', 'gray.400');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/profile', {
        fullName: form.fullName,
        phone: form.phone || null,
      });
      await refreshMe();
      toast({ title: 'Profile updated', status: 'success', duration: 2000 });
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title='Profile' subtitle='Signed-in admin account (Google auth)'>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap='20px'>
        <Card p='24px'>
          <Avatar
            name={user?.fullName || user?.email || 'Admin'}
            src={user?.avatarUrl || undefined}
            size='xl'
            mb='16px'
            bg='#11047A'
            color='white'
          />
          <Text color={textColor} fontWeight='700' mb='16px'>
            Account
          </Text>
          <Text mb='8px'>Email: {user?.email || '—'}</Text>
          <Text mb='8px'>Role: {user?.role || '—'}</Text>
          <Text mb='8px'>
            Google linked: {user?.googleLinked ? 'Yes' : 'No'}
          </Text>
          <Text mb='20px' color={muted} fontSize='sm'>
            User ID: {user?.id || '—'}
          </Text>
          <FormControl mb='12px'>
            <FormLabel>Full name</FormLabel>
            <Input
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
            />
          </FormControl>
          <FormControl mb='16px'>
            <FormLabel>Phone</FormLabel>
            <Input
              value={form.phone || ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </FormControl>
          <Button colorScheme='brand' isLoading={saving} onClick={save}>
            Save profile
          </Button>
        </Card>
        <Card p='24px'>
          <Text color={textColor} fontWeight='700' mb='16px'>
            Session
          </Text>
          <Text mb='20px' fontSize='sm' color={muted}>
            Authentication is Google-only against the allowlisted admin emails
            on the API. Sign out to switch accounts.
          </Text>
          <Button colorScheme='red' variant='outline' onClick={logout}>
            Sign out
          </Button>
        </Card>
      </SimpleGrid>
    </PageShell>
  );
}
