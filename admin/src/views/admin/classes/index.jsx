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
  name: '',
  category: '',
  durationMinutes: 60,
  capacity: 20,
  difficulty: 'beginner',
  status: 'active',
};

export default function ClassesPage() {
  const { rows, loading, error, reload } = useApiList('/classes?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewModal = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete class',
    getMessage: (row) => `Delete class "${row.name}"? Scheduled sessions may be affected.`,
    onDelete: async (row) => {
      await api.delete(`/classes/${row.id}`);
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
      name: row.name || '',
      category: row.category || '',
      durationMinutes: row.duration_minutes || 60,
      capacity: row.capacity || 20,
      difficulty: row.difficulty || 'beginner',
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
        ...form,
        durationMinutes: Number(form.durationMinutes),
        capacity: Number(form.capacity),
      };
      if (editing) {
        await api.put(`/classes/${editing.id}`, payload);
      } else {
        await api.post('/classes', payload);
      }
      toast({ title: 'Class saved', status: 'success', duration: 2000 });
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
      onAction={openCreate}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onView={openView}
        onEdit={openEdit}
        onDelete={deleteCtrl.requestDelete}
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

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title='Class details'
        fields={
          viewing
            ? [
                { label: 'Name', value: viewing.name },
                { label: 'Category', value: viewing.category },
                { label: 'Duration (min)', value: viewing.duration_minutes },
                { label: 'Capacity', value: viewing.capacity },
                { label: 'Difficulty', value: viewing.difficulty },
                { label: 'Status', value: viewing.status, type: 'status' },
                {
                  label: 'Description',
                  value: viewing.description,
                  fullWidth: true,
                },
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
          <ModalHeader>{editing ? 'Edit class' : 'Add class'}</ModalHeader>
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
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }>
                <option value='active'>active</option>
                <option value='inactive'>inactive</option>
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
