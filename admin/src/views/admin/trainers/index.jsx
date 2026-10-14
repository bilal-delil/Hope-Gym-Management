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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialties: '',
  status: 'active',
};

export default function TrainersPage() {
  const { rows, loading, error, reload } = useApiList('/trainers?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewModal = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete trainer',
    getMessage: (row) => `Delete ${row.first_name} ${row.last_name}?`,
    onDelete: async (row) => {
      await api.delete(`/trainers/${row.id}`);
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
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      email: row.email || '',
      phone: row.phone || '',
      specialties: (row.specialties || []).join(', '),
      status: row.status || 'active',
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
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        specialties: form.specialties
          ? form.specialties.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        status: form.status,
      };
      if (editing) {
        await api.put(`/trainers/${editing.id}`, payload);
      } else {
        await api.post('/trainers', payload);
      }
      toast({ title: 'Trainer saved', status: 'success', duration: 2000 });
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
      onAction={openCreate}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onView={openView}
        onEdit={openEdit}
        onDelete={deleteCtrl.requestDelete}
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

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title='Trainer details'
        fields={
          viewing
            ? [
                {
                  label: 'Name',
                  value: `${viewing.first_name} ${viewing.last_name}`,
                },
                { label: 'Email', value: viewing.email },
                { label: 'Phone', value: viewing.phone },
                {
                  label: 'Specialties',
                  value: viewing.specialties,
                  type: 'list',
                  fullWidth: true,
                },
                { label: 'Status', value: viewing.status, type: 'status' },
                { label: 'Bio', value: viewing.bio, fullWidth: true },
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
          <ModalHeader>{editing ? 'Edit trainer' : 'Add trainer'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {['firstName', 'lastName', 'email', 'phone', 'specialties'].map(
              (key) => (
                <FormControl key={key} mb='12px'>
                  <FormLabel>{key}</FormLabel>
                  <Input
                    value={form[key]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                  />
                </FormControl>
              )
            )}
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }>
                <option value='active'>active</option>
                <option value='inactive'>inactive</option>
                <option value='on_leave'>on_leave</option>
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
