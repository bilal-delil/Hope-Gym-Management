import React, { useState } from 'react';
import {
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
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/profile', form);
      await refreshMe();
      toast({ title: 'Profile updated', status: 'success', duration: 2000 });
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title='Profile' subtitle='Your admin account details'>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap='20px'>
        <Card p='24px'>
          <Text color={textColor} fontWeight='700' mb='16px'>
            Account
          </Text>
          <Text mb='8px'>Email: {user?.email}</Text>
          <Text mb='8px'>Role: {user?.role}</Text>
          <Text mb='20px'>
            Google linked: {user?.googleLinked ? 'Yes' : 'No'}
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
          <Text mb='20px' fontSize='sm'>
            Authentication is Google-only. Sign out to switch accounts.
          </Text>
          <Button colorScheme='red' variant='outline' onClick={logout}>
            Sign out
          </Button>
        </Card>
      </SimpleGrid>
    </PageShell>
  );
}
