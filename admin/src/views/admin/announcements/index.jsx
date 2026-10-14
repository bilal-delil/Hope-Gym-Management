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
  Switch,
  Textarea,
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
  title: '',
  body: '',
  priority: 'normal',
  isPinned: false,
};

export default function AnnouncementsPage() {
  const { rows, loading, error, reload } = useApiList('/announcements?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewModal = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete announcement',
    getMessage: (row) => `Delete announcement "${row.title}"?`,
    onDelete: async (row) => {
      await api.delete(`/announcements/${row.id}`);
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
      title: row.title || '',
      body: row.body || '',
      priority: row.priority || 'normal',
      isPinned: Boolean(row.is_pinned),
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
      if (editing) {
        await api.put(`/announcements/${editing.id}`, form);
      } else {
        await api.post('/announcements', form);
      }
      toast({ title: 'Announcement saved', status: 'success', duration: 2000 });
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
      title='Announcements'
      subtitle='Broadcast notices to members'
      actionLabel='New announcement'
      onAction={openCreate}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onView={openView}
        onEdit={openEdit}
        onDelete={deleteCtrl.requestDelete}
        columns={[
          { key: 'title', label: 'Title' },
          {
            key: 'priority',
            label: 'Priority',
            render: (row) => <StatusBadge value={row.priority} />,
          },
          {
            key: 'is_pinned',
            label: 'Pinned',
            render: (row) => (row.is_pinned ? 'Yes' : 'No'),
          },
          {
            key: 'starts_at',
            label: 'Starts',
            render: (row) => new Date(row.starts_at).toLocaleString(),
          },
        ]}
      />

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title='Announcement details'
        fields={
          viewing
            ? [
                { label: 'Title', value: viewing.title },
                { label: 'Priority', value: viewing.priority, type: 'status' },
                { label: 'Pinned', value: viewing.is_pinned, type: 'bool' },
                {
                  label: 'Starts',
                  value: viewing.starts_at,
                  type: 'datetime',
                },
                { label: 'Ends', value: viewing.ends_at, type: 'datetime' },
                { label: 'Body', value: viewing.body, fullWidth: true },
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

      <Modal isOpen={isOpen} onClose={onClose} size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editing ? 'Edit announcement' : 'New announcement'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb='12px'>
              <FormLabel>Title</FormLabel>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Body</FormLabel>
              <Textarea
                rows={5}
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              />
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Priority</FormLabel>
              <Select
                value={form.priority}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priority: e.target.value }))
                }>
                <option value='low'>low</option>
                <option value='normal'>normal</option>
                <option value='high'>high</option>
                <option value='urgent'>urgent</option>
              </Select>
            </FormControl>
            <FormControl display='flex' alignItems='center'>
              <FormLabel mb='0'>Pinned</FormLabel>
              <Switch
                isChecked={form.isPinned}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isPinned: e.target.checked }))
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
