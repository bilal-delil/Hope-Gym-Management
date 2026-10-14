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
import ConfirmDeleteDialog from 'components/admin/ConfirmDeleteDialog';
import RecordViewModal from 'components/admin/RecordViewModal';
import useApiList from 'hooks/useApiList';
import useConfirmDelete from 'hooks/useConfirmDelete';
import api from 'lib/api';

const emptyForm = {
  classId: '',
  trainerId: '',
  startsAt: '',
  room: '',
  status: 'scheduled',
};

function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function SchedulePage() {
  const { rows, loading, error, reload } = useApiList('/schedules?limit=100');
  const classes = useApiList('/classes?limit=100');
  const trainers = useApiList('/trainers?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewModal = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete session',
    getMessage: (row) =>
      `Delete scheduled session "${row.class_name}" on ${new Date(
        row.starts_at
      ).toLocaleString()}? Bookings for this session will also be removed.`,
    onDelete: async (row) => {
      await api.delete(`/schedules/${row.id}`);
      reload();
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      classId: row.class_id || '',
      trainerId: row.trainer_id || '',
      startsAt: toLocalInput(row.starts_at),
      room: row.room || '',
      status: row.status || 'scheduled',
    });
    onOpen();
  };

  const openView = (row) => {
    setViewing(row);
    viewModal.onOpen();
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        classId: form.classId,
        trainerId: form.trainerId || null,
        startsAt: new Date(form.startsAt).toISOString(),
        room: form.room || null,
        status: form.status,
      };
      if (editing) {
        await api.put(`/schedules/${editing.id}`, {
          trainerId: payload.trainerId,
          startsAt: payload.startsAt,
          room: payload.room,
          status: payload.status,
        });
      } else {
        await api.post('/schedules', payload);
      }
      toast({ title: 'Session saved', status: 'success', duration: 2000 });
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
      subtitle='Upcoming class sessions (bookings also tracked under Bookings)'
      actionLabel='Schedule session'
      onAction={openCreate}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onView={openView}
        onEdit={openEdit}
        onDelete={deleteCtrl.requestDelete}
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

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title='Session details'
        fields={
          viewing
            ? [
                { label: 'Class', value: viewing.class_name },
                {
                  label: 'Trainer',
                  value: viewing.trainer_first_name
                    ? `${viewing.trainer_first_name} ${viewing.trainer_last_name}`
                    : null,
                },
                {
                  label: 'Starts',
                  value: viewing.starts_at,
                  type: 'datetime',
                },
                { label: 'Ends', value: viewing.ends_at, type: 'datetime' },
                { label: 'Room', value: viewing.room },
                {
                  label: 'Booked',
                  value: `${viewing.booked_count || 0}/${viewing.capacity || '—'}`,
                },
                { label: 'Status', value: viewing.status, type: 'status' },
                { label: 'Notes', value: viewing.notes, fullWidth: true },
              ]
            : []
        }
      />

      <ConfirmDeleteDialog
        isOpen={deleteCtrl.isOpen}
        onClose={deleteCtrl.onClose}
        onConfirm={deleteCtrl.confirmDelete}
        title={deleteCtrl.title}
        message={deleteCtrl.message}
        isLoading={deleteCtrl.loading}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editing ? 'Edit session' : 'Schedule session'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!editing ? (
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
            ) : null}
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
            <FormControl mb='12px'>
              <FormLabel>Room</FormLabel>
              <Input
                value={form.room}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room: e.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }>
                <option value='scheduled'>scheduled</option>
                <option value='cancelled'>cancelled</option>
                <option value='completed'>completed</option>
              </Select>
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
