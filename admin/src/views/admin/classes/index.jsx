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

export default function ClassesPage() {
  const { rows, loading, error, reload } = useApiList('/classes?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    durationMinutes: 60,
    capacity: 20,
    difficulty: 'beginner',
  });
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/classes', {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        capacity: Number(form.capacity),
      });
      toast({ title: 'Class created', status: 'success', duration: 2000 });
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
      title='Classes'
      subtitle='Fitness class templates'
      actionLabel='Add class'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'duration_minutes', label: 'Minutes' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'difficulty', label: 'Difficulty' },
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
          <ModalHeader>Add class</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {['name', 'category', 'durationMinutes', 'capacity', 'difficulty'].map(
              (key) => (
                <FormControl key={key} mb='12px'>
                  <FormLabel>{key}</FormLabel>
                  <Input
                    type={
                      key === 'durationMinutes' || key === 'capacity'
                        ? 'number'
                        : 'text'
                    }
                    value={form[key]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                  />
                </FormControl>
              )
            )}
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
