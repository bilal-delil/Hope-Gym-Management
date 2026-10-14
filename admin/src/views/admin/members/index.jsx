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
  SimpleGrid,
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
  memberCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
  status: 'active',
};

export default function MembersPage() {
  const { rows, loading, error, reload } = useApiList('/members?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewModal = useDisclosure();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete member',
    getMessage: (row) =>
      `Delete ${row.first_name} ${row.last_name} (${row.member_code})? Related memberships and attendance may be affected.`,
    onDelete: async (row) => {
      await api.delete(`/members/${row.id}`);
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
      memberCode: row.member_code || '',
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      email: row.email || '',
      phone: row.phone || '',
      dateOfBirth: row.date_of_birth
        ? String(row.date_of_birth).slice(0, 10)
        : '',
      gender: row.gender || '',
      address: row.address || '',
      emergencyContactName: row.emergency_contact_name || '',
      emergencyContactPhone: row.emergency_contact_phone || '',
      notes: row.notes || '',
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
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.address || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
        notes: form.notes || null,
      };
      if (editing) {
        await api.put(`/members/${editing.id}`, payload);
      } else {
        await api.post('/members', payload);
      }
      toast({ title: 'Member saved', status: 'success', duration: 2000 });
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
      title='Members'
      subtitle='Manage gym member profiles (includes PWA self-updates)'
      actionLabel='Add member'
      onAction={openCreate}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onView={openView}
        onEdit={openEdit}
        onDelete={deleteCtrl.requestDelete}
        columns={[
          { key: 'member_code', label: 'Code' },
          {
            key: 'name',
            label: 'Name',
            render: (row) => `${row.first_name} ${row.last_name}`,
          },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
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
        title='Member details'
        fields={
          viewing
            ? [
                { label: 'Code', value: viewing.member_code },
                {
                  label: 'Name',
                  value: `${viewing.first_name} ${viewing.last_name}`,
                },
                { label: 'Email', value: viewing.email },
                { label: 'Phone', value: viewing.phone },
                {
                  label: 'Date of birth',
                  value: viewing.date_of_birth,
                  type: 'date',
                },
                { label: 'Gender', value: viewing.gender },
                { label: 'Address', value: viewing.address, fullWidth: true },
                {
                  label: 'Emergency contact',
                  value: viewing.emergency_contact_name,
                },
                {
                  label: 'Emergency phone',
                  value: viewing.emergency_contact_phone,
                },
                { label: 'Status', value: viewing.status, type: 'status' },
                { label: 'Notes', value: viewing.notes, fullWidth: true },
                {
                  label: 'Joined',
                  value: viewing.joined_at,
                  type: 'datetime',
                },
                {
                  label: 'Updated',
                  value: viewing.updated_at,
                  type: 'datetime',
                },
              ]
            : []
        }
        footer={
          viewing ? (
            <Button
              variant='outline'
              onClick={() => {
                viewModal.onClose();
                openEdit(viewing);
              }}>
              Edit
            </Button>
          ) : null
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
          <ModalHeader>{editing ? 'Edit member' : 'Add member'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap='16px'>
              {[
                ['memberCode', 'Member code'],
                ['firstName', 'First name'],
                ['lastName', 'Last name'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['dateOfBirth', 'Date of birth', 'date'],
                ['gender', 'Gender'],
                ['emergencyContactName', 'Emergency contact'],
                ['emergencyContactPhone', 'Emergency phone'],
              ].map(([key, label, type]) => (
                <FormControl key={key}>
                  <FormLabel>{label}</FormLabel>
                  <Input
                    type={type || 'text'}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </FormControl>
              ))}
              <FormControl gridColumn={{ md: '1 / -1' }}>
                <FormLabel>Address</FormLabel>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl gridColumn={{ md: '1 / -1' }}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }>
                  <option value='active'>active</option>
                  <option value='inactive'>inactive</option>
                  <option value='suspended'>suspended</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter gap='8px'>
            <Button variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme='brand' onClick={save} isLoading={saving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
}
