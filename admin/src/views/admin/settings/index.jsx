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
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import PageShell from 'components/admin/PageShell';
import DataTableCard from 'components/admin/DataTableCard';
import useApiList from 'hooks/useApiList';
import api from 'lib/api';

export default function SettingsPage() {
  const { rows, loading, error, reload } = useApiList('/settings');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    key: '',
    value: '{}',
    description: '',
  });
  const toast = useToast();

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
      subtitle='Gym-wide configuration keys'
      actionLabel='Upsert setting'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        columns={[
          { key: 'key', label: 'Key' },
          {
            key: 'value',
            label: 'Value',
            render: (row) => JSON.stringify(row.value),
          },
          { key: 'description', label: 'Description' },
        ]}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upsert setting</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb='12px'>
              <FormLabel>Key</FormLabel>
              <Input
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              />
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Value (JSON)</FormLabel>
              <Textarea
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
