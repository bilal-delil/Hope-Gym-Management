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
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import PageShell from 'components/admin/PageShell';
import DataTableCard, { StatusBadge } from 'components/admin/DataTableCard';
import useApiList from 'hooks/useApiList';
import api from 'lib/api';

export default function AnnouncementsPage() {
  const { rows, loading, error, reload } = useApiList('/announcements?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    priority: 'normal',
    isPinned: false,
  });
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/announcements', form);
      toast({ title: 'Announcement created', status: 'success', duration: 2000 });
      onClose();
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${row.id}`);
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    }
  };

  return (
    <PageShell
      title='Announcements'
      subtitle='Broadcast notices to members'
      actionLabel='New announcement'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onDelete={remove}
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

      <Modal isOpen={isOpen} onClose={onClose} size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New announcement</ModalHeader>
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
            <FormControl>
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
