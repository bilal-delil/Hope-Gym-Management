import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
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
import DataTableCard from 'components/admin/DataTableCard';
import useApiList from 'hooks/useApiList';
import api from 'lib/api';

export default function AttendancePage() {
  const { rows, loading, error, reload } = useApiList('/attendance?limit=100');
  const members = useApiList('/members?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [memberId, setMemberId] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const checkIn = async () => {
    setSaving(true);
    try {
      await api.post('/attendance/check-in', { memberId });
      toast({ title: 'Checked in', status: 'success', duration: 2000 });
      onClose();
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const checkOut = async (row) => {
    try {
      await api.post(`/attendance/${row.id}/check-out`);
      toast({ title: 'Checked out', status: 'success', duration: 2000 });
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    }
  };

  return (
    <PageShell
      title='Attendance'
      subtitle='Member check-ins and visit history'
      actionLabel='Check in'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        columns={[
          {
            key: 'member',
            label: 'Member',
            render: (row) => `${row.first_name} ${row.last_name}`,
          },
          { key: 'member_code', label: 'Code' },
          {
            key: 'checked_in_at',
            label: 'Checked in',
            render: (row) => new Date(row.checked_in_at).toLocaleString(),
          },
          {
            key: 'checked_out_at',
            label: 'Checked out',
            render: (row) =>
              row.checked_out_at
                ? new Date(row.checked_out_at).toLocaleString()
                : 'Open',
          },
          { key: 'source', label: 'Source' },
        ]}
        extraActions={(row) =>
          !row.checked_out_at ? (
            <Button size='sm' onClick={() => checkOut(row)}>
              Check out
            </Button>
          ) : null
        }
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Check in member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Member</FormLabel>
              <Select
                placeholder='Select member'
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}>
                {members.rows.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.member_code})
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter gap='8px'>
            <Button variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme='brand'
              isDisabled={!memberId}
              isLoading={saving}
              onClick={checkIn}>
              Check in
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
}
