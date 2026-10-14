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
  Select,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import PageShell from 'components/admin/PageShell';
import DataTableCard, { StatusBadge } from 'components/admin/DataTableCard';
import useApiList from 'hooks/useApiList';
import api from 'lib/api';

export default function SchedulePage() {
  const { rows, loading, error, reload } = useApiList('/schedules?limit=100');
  const classes = useApiList('/classes?limit=100');
  const trainers = useApiList('/trainers?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    classId: '',
    trainerId: '',
    startsAt: '',
    room: '',
  });
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/schedules', {
        classId: form.classId,
        trainerId: form.trainerId || null,
        startsAt: new Date(form.startsAt).toISOString(),
        room: form.room || null,
      });
      toast({ title: 'Session scheduled', status: 'success', duration: 2000 });
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
      title='Schedule'
      subtitle='Upcoming class sessions'
      actionLabel='Schedule session'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        columns={[
          { key: 'class_name', label: 'Class' },
          {
            key: 'trainer',
            label: 'Trainer',
            render: (row) =>
              row.trainer_first_name
                ? `${row.trainer_first_name} ${row.trainer_last_name}`
                : '—',
          },
          {
            key: 'starts_at',
            label: 'Starts',
            render: (row) => new Date(row.starts_at).toLocaleString(),
          },
          { key: 'room', label: 'Room' },
          {
            key: 'booked_count',
            label: 'Booked',
            render: (row) => `${row.booked_count || 0}/${row.capacity || '—'}`,
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
          <ModalHeader>Schedule session</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb='12px'>
              <FormLabel>Class</FormLabel>
              <Select
                placeholder='Select class'
                value={form.classId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, classId: e.target.value }))
                }>
                {classes.rows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Trainer</FormLabel>
              <Select
                placeholder='Optional'
                value={form.trainerId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, trainerId: e.target.value }))
                }>
                {trainers.rows.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Starts at</FormLabel>
              <Input
                type='datetime-local'
                value={form.startsAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startsAt: e.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Room</FormLabel>
              <Input
                value={form.room}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room: e.target.value }))
                }
              />
            </FormControl>
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
