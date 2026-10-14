import React, { useMemo, useState } from 'react';
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
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import PageShell from 'components/admin/PageShell';
import DataTableCard from 'components/admin/DataTableCard';
import ConfirmDeleteDialog from 'components/admin/ConfirmDeleteDialog';
import RecordViewModal from 'components/admin/RecordViewModal';
import useApiList from 'hooks/useApiList';
import useConfirmDelete from 'hooks/useConfirmDelete';
import api from 'lib/api';

const emptyForm = {
  key: '',
  value: '{}',
  description: '',
};

export default function SettingsPage() {
  const { rows, loading, error, reload } = useApiList('/settings');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewModal = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete setting',
    getMessage: (row) => `Delete setting key "${row.key}"?`,
    onDelete: async (row) => {
      await api.delete(`/settings/${row.key}`);
      reload();
    },
  });

  const tableRows = useMemo(
    () =>
      (rows || []).map((row) => ({
        ...row,
        id: row.id || row.key,
      })),
    [rows]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      key: row.key || '',
      value: JSON.stringify(row.value ?? {}, null, 2),
      description: row.description || '',
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
      let parsed;
      try {
        parsed = JSON.parse(form.value);
      } catch {
        throw new Error('Value must be valid JSON');
      }
      await api.put('/settings', {
        key: form.key,
        value: parsed,
        description: form.description || null,
      });
      toast({ title: 'Setting saved', status: 'success', duration: 2000 });
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
      title='Settings'
      subtitle='Live gym configuration stored in the database'
      actionLabel='Add / update setting'
      onAction={openCreate}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={tableRows}
        onView={openView}
        onEdit={openEdit}
        onDelete={deleteCtrl.requestDelete}
        emptyText='No settings yet. Seed data or add gym_name, currency, etc.'
        columns={[
          { key: 'key', label: 'Key' },
          {
            key: 'value',
            label: 'Value',
            render: (row) => {
              const text = JSON.stringify(row.value);
              return text.length > 80 ? `${text.slice(0, 80)}…` : text;
            },
          },
          { key: 'description', label: 'Description' },
          {
            key: 'updated_at',
            label: 'Updated',
            render: (row) =>
              row.updated_at ? new Date(row.updated_at).toLocaleString() : '—',
          },
        ]}
      />

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title='Setting details'
        fields={
          viewing
            ? [
                { label: 'Key', value: viewing.key },
                { label: 'Description', value: viewing.description },
                {
                  label: 'Value',
                  value: JSON.stringify(viewing.value, null, 2),
                  fullWidth: true,
                },
                {
                  label: 'Updated',
                  value: viewing.updated_at,
                  type: 'datetime',
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

      <Modal isOpen={isOpen} onClose={onClose} size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editing ? `Edit ${editing.key}` : 'Upsert setting'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb='12px'>
              <FormLabel>Key</FormLabel>
              <Input
                value={form.key}
                isReadOnly={Boolean(editing)}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              />
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Value (JSON)</FormLabel>
              <Textarea
                rows={8}
                fontFamily='mono'
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
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
