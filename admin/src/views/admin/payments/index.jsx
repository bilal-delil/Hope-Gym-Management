import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Image,
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

export default function PaymentsPage() {
  const { rows, loading, error, reload } = useApiList('/payments?limit=100');
  const members = useApiList('/members?limit=100');
  const createModal = useDisclosure();
  const reviewModal = useDisclosure();
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    memberId: '',
    amount: '',
    method: 'bank_transfer',
    reference: '',
    proofImage: null,
  });
  const toast = useToast();

  const submitPayment = async () => {
    if (!form.proofImage) {
      toast({ title: 'Proof image is required', status: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      body.append('memberId', form.memberId);
      body.append('amount', form.amount);
      body.append('method', form.method);
      if (form.reference) body.append('reference', form.reference);
      body.append('proofImage', form.proofImage);
      await api.upload('/payments', body);
      toast({ title: 'Payment submitted', status: 'success', duration: 2000 });
      createModal.onClose();
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const approve = async (row) => {
    try {
      await api.post(`/payments/${row.id}/approve`);
      toast({ title: 'Payment approved', status: 'success', duration: 2000 });
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    }
  };

  const openDecline = (row) => {
    setSelected(row);
    setRejectionReason('');
    reviewModal.onOpen();
  };

  const decline = async () => {
    setSaving(true);
    try {
      await api.post(`/payments/${selected.id}/decline`, { rejectionReason });
      toast({ title: 'Payment declined', status: 'success', duration: 2000 });
      reviewModal.onClose();
      reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title='Payments'
      subtitle='Review payment screenshots — approve or decline'
      actionLabel='Submit payment'
      onAction={createModal.onOpen}
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
          { key: 'amount', label: 'Amount' },
          { key: 'method', label: 'Method' },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge value={row.status} />,
          },
          {
            key: 'proof',
            label: 'Proof',
            render: (row) =>
              row.proof_image_url ? (
                <Image
                  src={row.proof_image_url}
                  alt='proof'
                  maxH='48px'
                  borderRadius='8px'
                  cursor='pointer'
                  onClick={() => window.open(row.proof_image_url, '_blank')}
                />
              ) : (
                '—'
              ),
          },
          {
            key: 'created_at',
            label: 'Submitted',
            render: (row) => new Date(row.created_at).toLocaleString(),
          },
        ]}
        extraActions={(row) =>
          row.status === 'pending' ? (
            <>
              <Button size='sm' colorScheme='green' onClick={() => approve(row)}>
                Approve
              </Button>
              <Button size='sm' colorScheme='red' variant='outline' onClick={() => openDecline(row)}>
                Decline
              </Button>
            </>
          ) : null
        }
      />

      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit payment proof</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb='12px'>
              <FormLabel>Member</FormLabel>
              <Select
                placeholder='Select member'
                value={form.memberId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, memberId: e.target.value }))
                }>
                {members.rows.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Amount</FormLabel>
              <Input
                type='number'
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
              />
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Method</FormLabel>
              <Select
                value={form.method}
                onChange={(e) =>
                  setForm((p) => ({ ...p, method: e.target.value }))
                }>
                <option value='bank_transfer'>bank_transfer</option>
                <option value='mobile_money'>mobile_money</option>
                <option value='cash'>cash</option>
                <option value='card'>card</option>
                <option value='other'>other</option>
              </Select>
            </FormControl>
            <FormControl mb='12px'>
              <FormLabel>Reference</FormLabel>
              <Input
                value={form.reference}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reference: e.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Proof screenshot</FormLabel>
              <Input
                type='file'
                accept='image/*'
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    proofImage: e.target.files?.[0] || null,
                  }))
                }
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap='8px'>
            <Button variant='ghost' onClick={createModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme='brand' isLoading={saving} onClick={submitPayment}>
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={reviewModal.isOpen} onClose={reviewModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Decline payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Reason</FormLabel>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap='8px'>
            <Button variant='ghost' onClick={reviewModal.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme='red'
              isLoading={saving}
              isDisabled={rejectionReason.trim().length < 3}
              onClick={decline}>
              Decline
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
}
