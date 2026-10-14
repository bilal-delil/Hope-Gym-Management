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
import ConfirmDeleteDialog from 'components/admin/ConfirmDeleteDialog';
import RecordViewModal from 'components/admin/RecordViewModal';
import useApiList from 'hooks/useApiList';
import useConfirmDelete from 'hooks/useConfirmDelete';
import api from 'lib/api';

export default function AttendancePage() {
  const { rows, loading, error, reload } = useApiList('/attendance?limit=100');
  const members = useApiList('/members?limit=100');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewModal = useDisclosure();
  const [memberId, setMemberId] = useState('');
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete attendance',
    getMessage: (row) =>
      `Delete attendance for ${row.first_name} ${row.last_name} on ${new Date(
        row.checked_in_at
      ).toLocaleString()}?`,
    onDelete: async (row) => {
      await api.delete(`/attendance/${row.id}`);
      reload();
    },
  });

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

  const openView = (row) => {
    setViewing(row);
    viewModal.onOpen();
  };

  return (
    <PageShell
      title='Attendance'
      subtitle='Check-ins from front desk and member PWA (source column)'
      actionLabel='Check in'
      onAction={onOpen}
      loading={loading}
      error={error}>
      <DataTableCard
        rows={rows}
        onView={openView}
        onDelete={deleteCtrl.requestDelete}
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

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title='Attendance details'
        fields={
          viewing
            ? [
                {
                  label: 'Member',
                  value: `${viewing.first_name} ${viewing.last_name}`,
                },
                { label: 'Code', value: viewing.member_code },
                {
                  label: 'Checked in',
                  value: viewing.checked_in_at,
                  type: 'datetime',
                },
                {
                  label: 'Checked out',
                  value: viewing.checked_out_at,
                  type: 'datetime',
                },
                { label: 'Source', value: viewing.source },
                { label: 'Notes', value: viewing.notes, fullWidth: true },
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
