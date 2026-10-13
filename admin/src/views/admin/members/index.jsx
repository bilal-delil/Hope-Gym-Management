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
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import PageShell from 'components/admin/PageShell';
import DataTableCard, { StatusBadge } from 'components/admin/DataTableCard';
import useApiList from 'hooks/useApiList';
import api from 'lib/api';

const emptyForm = {
  memberCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  status: 'active',
};

export default function MembersPage() {
  const { rows, loading, error, reload } = useApiList('/members?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

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
      status: row.status || 'active',
    });
    onOpen();
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/members/${editing.id}`, form);
      } else {
        await api.post('/members', form);
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

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.first_name} ${row.last_name}?`)) return;
    try {
      await api.delete(`/members/${row.id}`);
      toast({ title: 'Member deleted', status: 'success', duration: 2000 });
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    }
  };

  return (
    <PageShell
      title='Members'
      subtitle='Manage gym member profiles and status'
      actionLabel='Add member'
      onAction={openCreate}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onEdit={openEdit}
        onDelete={remove}
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
              ].map(([key, label]) => (
                <FormControl key={key}>
                  <FormLabel>{label}</FormLabel>
                  <Input
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </FormControl>
              ))}
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
