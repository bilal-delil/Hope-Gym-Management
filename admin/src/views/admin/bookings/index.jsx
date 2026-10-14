import React, { useState } from 'react';
import { Select, useDisclosure, useToast } from '@chakra-ui/react';
import PageShell from 'components/admin/PageShell';
import DataTableCard from 'components/admin/DataTableCard';
import ConfirmDeleteDialog from 'components/admin/ConfirmDeleteDialog';
import RecordViewModal from 'components/admin/RecordViewModal';
import useApiList from 'hooks/useApiList';
import useConfirmDelete from 'hooks/useConfirmDelete';
import api from 'lib/api';

export default function BookingsPage() {
  const { rows, loading, error, reload } = useApiList('/bookings?limit=100');
  const viewModal = useDisclosure();
  const [viewing, setViewing] = useState(null);
  const toast = useToast();

  const deleteCtrl = useConfirmDelete({
    title: 'Delete booking',
    getMessage: (row) =>
      `Delete booking for ${row.first_name} ${row.last_name} — ${row.class_name}?`,
    onDelete: async (row) => {
      await api.delete(`/bookings/${row.id}`);
      reload();
    },
  });

  const setStatus = async (row, status) => {
    try {
      await api.put(`/bookings/${row.id}`, { status });
      toast({ title: 'Booking updated', status: 'success', duration: 2000 });
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
      title='Bookings'
      subtitle='Class bookings from admin and the member PWA'
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
          { key: 'class_name', label: 'Class' },
          {
            key: 'starts_at',
            label: 'Session',
            render: (row) =>
              row.starts_at ? new Date(row.starts_at).toLocaleString() : '—',
          },
          {
            key: 'booked_at',
            label: 'Booked at',
            render: (row) =>
              row.booked_at ? new Date(row.booked_at).toLocaleString() : '—',
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => (
              <Select
                size='sm'
                maxW='140px'
                value={row.status}
                onChange={(e) => setStatus(row, e.target.value)}>
                <option value='booked'>booked</option>
                <option value='attended'>attended</option>
                <option value='cancelled'>cancelled</option>
                <option value='no_show'>no_show</option>
              </Select>
            ),
          },
        ]}
      />

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title='Booking details'
        fields={
          viewing
            ? [
                {
                  label: 'Member',
                  value: `${viewing.first_name} ${viewing.last_name}`,
                },
                { label: 'Code', value: viewing.member_code },
                { label: 'Email', value: viewing.member_email },
                { label: 'Class', value: viewing.class_name },
                { label: 'Room', value: viewing.room },
                {
                  label: 'Session starts',
                  value: viewing.starts_at,
                  type: 'datetime',
                },
                {
                  label: 'Booked at',
                  value: viewing.booked_at,
                  type: 'datetime',
                },
                { label: 'Status', value: viewing.status, type: 'status' },
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
    </PageShell>
  );
}
