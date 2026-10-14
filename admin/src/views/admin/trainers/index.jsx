import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import PageShell from 'components/admin/PageShell';
import DataTableCard, { StatusBadge } from 'components/admin/DataTableCard';
import useApiList from 'hooks/useApiList';
import api from 'lib/api';

export default function TrainersPage() {
  const { rows, loading, error, reload } = useApiList('/trainers?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialties: '',
  });
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/trainers', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        specialties: form.specialties
          ? form.specialties.split(',').map((s) => s.trim())
          : [],
      });
      toast({ title: 'Trainer created', status: 'success', duration: 2000 });
      onClose();
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title='Trainers'
      subtitle='Staff trainers and specialties'
      actionLabel='Add trainer'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        columns={[
          {
            key: 'name',
            label: 'Name',
            render: (row) => `${row.first_name} ${row.last_name}`,
          },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          {
            key: 'specialties',
            label: 'Specialties',
            render: (row) => (row.specialties || []).join(', ') || '—',
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge value={row.status} />,
          },
        ]}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add trainer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {Object.keys(form).map((key) => (
              <FormControl key={key} mb='12px'>
                <FormLabel>{key}</FormLabel>
                <Input
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                />
              </FormControl>
            ))}
          </ModalBody>
          <ModalFooter gap='8px'>
            <Button variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme='brand' isLoading={saving} onClick={save}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
}
