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

export default function ContentFeedPage() {
  const { rows, loading, error, reload } = useApiList('/content?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    excerpt: '',
    status: 'published',
  });
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/content', form);
      toast({ title: 'Post created', status: 'success', duration: 2000 });
      onClose();
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/content/${row.id}`);
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    }
  };

  return (
    <PageShell
      title='Content Feed'
      subtitle='Publish tips, news, and gym updates'
      actionLabel='New post'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onDelete={remove}
        columns={[
          { key: 'title', label: 'Title' },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge value={row.status} />,
          },
          { key: 'author_name', label: 'Author' },
          {
            key: 'published_at',
            label: 'Published',
            render: (row) =>
              row.published_at
                ? new Date(row.published_at).toLocaleString()
                : '—',
          },
        ]}
      />

      <Modal isOpen={isOpen} onClose={onClose} size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New content post</ModalHeader>
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
              <FormLabel>Excerpt</FormLabel>
              <Input
                value={form.excerpt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, excerpt: e.target.value }))
                }
              />
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Body</FormLabel>
              <Textarea
                rows={6}
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }>
                <option value='draft'>draft</option>
                <option value='published'>published</option>
                <option value='archived'>archived</option>
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
