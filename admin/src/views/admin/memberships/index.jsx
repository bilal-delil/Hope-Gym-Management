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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
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

export default function MembershipsPage() {
  const plans = useApiList('/membership-plans?limit=100');
  const memberships = useApiList('/memberships?limit=100');
  const members = useApiList('/members?limit=100');
  const toast = useToast();

  const planModal = useDisclosure();
  const membershipModal = useDisclosure();
  const viewModal = useDisclosure();
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingMembership, setEditingMembership] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewKind, setViewKind] = useState('plan');

  const deletePlanCtrl = useConfirmDelete({
    title: 'Delete plan',
    getMessage: (row) => `Delete plan "${row.name}"?`,
    onDelete: async (row) => {
      await api.delete(`/membership-plans/${row.id}`);
      plans.reload();
    },
  });

  const deleteMembershipCtrl = useConfirmDelete({
    title: 'Delete membership',
    getMessage: (row) =>
      `Delete membership for ${row.first_name || ''} ${row.last_name || ''} (${
        row.plan_name
      })?`,
    onDelete: async (row) => {
      await api.delete(`/memberships/${row.id}`);
      memberships.reload();
    },
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    billingPeriod: 'monthly',
    durationDays: 30,
    price: 49.99,
    isActive: true,
  });
  const [membershipForm, setMembershipForm] = useState({
    memberId: '',
    planId: '',
    startDate: new Date().toISOString().slice(0, 10),
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      billingPeriod: 'monthly',
      durationDays: 30,
      price: 49.99,
      isActive: true,
    });
    planModal.onOpen();
  };

  const openEditPlan = (row) => {
    setEditingPlan(row);
    setPlanForm({
      name: row.name || '',
      billingPeriod: row.billing_period || 'monthly',
      durationDays: row.duration_days || 30,
      price: row.price || 0,
      isActive: row.is_active !== false,
    });
    planModal.onOpen();
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const payload = {
        name: planForm.name,
        billingPeriod: planForm.billingPeriod,
        durationDays: Number(planForm.durationDays),
        price: Number(planForm.price),
        isActive: planForm.isActive,
      };
      if (editingPlan) {
        await api.put(`/membership-plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/membership-plans', payload);
      }
      toast({ title: 'Plan saved', status: 'success', duration: 2000 });
      planModal.onClose();
      plans.reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const openCreateMembership = () => {
    setEditingMembership(null);
    setMembershipForm({
      memberId: '',
      planId: '',
      startDate: new Date().toISOString().slice(0, 10),
      status: 'active',
    });
    membershipModal.onOpen();
  };

  const openEditMembership = (row) => {
    setEditingMembership(row);
    setMembershipForm({
      memberId: row.member_id || '',
      planId: row.plan_id || '',
      startDate: row.start_date
        ? String(row.start_date).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      status: row.status || 'active',
    });
    membershipModal.onOpen();
  };

  const saveMembership = async () => {
    setSaving(true);
    try {
      if (editingMembership) {
        await api.put(`/memberships/${editingMembership.id}`, {
          planId: membershipForm.planId,
          startDate: membershipForm.startDate,
          status: membershipForm.status,
        });
      } else {
        await api.post('/memberships', membershipForm);
      }
      toast({ title: 'Membership saved', status: 'success', duration: 2000 });
      membershipModal.onClose();
      memberships.reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const openViewPlan = (row) => {
    setViewKind('plan');
    setViewing(row);
    viewModal.onOpen();
  };

  const openViewMembership = (row) => {
    setViewKind('membership');
    setViewing(row);
    viewModal.onOpen();
  };

  return (
    <PageShell
      title='Memberships'
      subtitle='Plans and member subscriptions'
      loading={plans.loading || memberships.loading}
      error={plans.error || memberships.error}>
      <Tabs colorScheme='brand'>
        <TabList>
          <Tab>Plans</Tab>
          <Tab>Assignments</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px='0'>
            <Button mb='16px' colorScheme='brand' onClick={openCreatePlan}>
              Add plan
            </Button>
            <DataTableCard
              rows={plans.rows}
              onView={openViewPlan}
              onEdit={openEditPlan}
              onDelete={deletePlanCtrl.requestDelete}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'billing_period', label: 'Period' },
                { key: 'duration_days', label: 'Days' },
                { key: 'price', label: 'Price' },
                {
                  key: 'active_members',
                  label: 'Active members',
                  render: (row) => row.active_members ?? 0,
                },
                {
                  key: 'is_active',
                  label: 'Status',
                  render: (row) => (
                    <StatusBadge value={row.is_active ? 'active' : 'inactive'} />
                  ),
                },
              ]}
            />
          </TabPanel>
          <TabPanel px='0'>
            <Button mb='16px' colorScheme='brand' onClick={openCreateMembership}>
              Assign membership
            </Button>
            <DataTableCard
              rows={memberships.rows}
              onView={openViewMembership}
              onEdit={openEditMembership}
              onDelete={deleteMembershipCtrl.requestDelete}
              columns={[
                {
                  key: 'member',
                  label: 'Member',
                  render: (row) =>
                    `${row.first_name || ''} ${row.last_name || ''}`.trim() ||
                    row.member_code,
                },
                { key: 'plan_name', label: 'Plan' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <StatusBadge value={row.status} />,
                },
                { key: 'start_date', label: 'Start' },
                { key: 'end_date', label: 'End' },
              ]}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <RecordViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        title={viewKind === 'plan' ? 'Plan details' : 'Membership details'}
        fields={
          !viewing
            ? []
            : viewKind === 'plan'
              ? [
                  { label: 'Name', value: viewing.name },
                  { label: 'Billing period', value: viewing.billing_period },
                  { label: 'Duration days', value: viewing.duration_days },
                  { label: 'Price', value: viewing.price },
                  {
                    label: 'Active members',
                    value: viewing.active_members ?? 0,
                  },
                  {
                    label: 'Status',
                    value: viewing.is_active ? 'active' : 'inactive',
                    type: 'status',
                  },
                  {
                    label: 'Description',
                    value: viewing.description,
                    fullWidth: true,
                  },
                ]
              : [
                  {
                    label: 'Member',
                    value: `${viewing.first_name || ''} ${
                      viewing.last_name || ''
                    }`.trim(),
                  },
                  { label: 'Code', value: viewing.member_code },
                  { label: 'Plan', value: viewing.plan_name },
                  { label: 'Status', value: viewing.status, type: 'status' },
                  {
                    label: 'Start',
                    value: viewing.start_date,
                    type: 'date',
                  },
                  { label: 'End', value: viewing.end_date, type: 'date' },
                ]
        }
      />

      <ConfirmDeleteDialog
        isOpen={deletePlanCtrl.isOpen}
        onClose={deletePlanCtrl.onClose}
        onConfirm={deletePlanCtrl.confirmDelete}
        title={deletePlanCtrl.title}
        message={deletePlanCtrl.message}
        isLoading={deletePlanCtrl.loading}
      />
      <ConfirmDeleteDialog
        isOpen={deleteMembershipCtrl.isOpen}
        onClose={deleteMembershipCtrl.onClose}
        onConfirm={deleteMembershipCtrl.confirmDelete}
        title={deleteMembershipCtrl.title}
        message={deleteMembershipCtrl.message}
        isLoading={deleteMembershipCtrl.loading}
      />

      <Modal isOpen={planModal.isOpen} onClose={planModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingPlan ? 'Edit plan' : 'Add plan'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={1} gap='12px'>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={planForm.name}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Billing period</FormLabel>
                <Select
                  value={planForm.billingPeriod}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, billingPeriod: e.target.value }))
                  }>
                  <option value='monthly'>monthly</option>
                  <option value='quarterly'>quarterly</option>
                  <option value='semi_annual'>semi_annual</option>
                  <option value='annual'>annual</option>
                  <option value='custom'>custom</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Duration days</FormLabel>
                <Input
                  type='number'
                  value={planForm.durationDays}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, durationDays: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Price</FormLabel>
                <Input
                  type='number'
                  value={planForm.price}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, price: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Active</FormLabel>
                <Select
                  value={planForm.isActive ? 'true' : 'false'}
                  onChange={(e) =>
                    setPlanForm((p) => ({
                      ...p,
                      isActive: e.target.value === 'true',
                    }))
                  }>
                  <option value='true'>active</option>
                  <option value='false'>inactive</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter gap='8px'>
            <Button variant='ghost' onClick={planModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme='brand' isLoading={saving} onClick={savePlan}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={membershipModal.isOpen} onClose={membershipModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingMembership ? 'Edit membership' : 'Assign membership'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={1} gap='12px'>
              {!editingMembership ? (
                <FormControl>
                  <FormLabel>Member</FormLabel>
                  <Select
                    placeholder='Select member'
                    value={membershipForm.memberId}
                    onChange={(e) =>
                      setMembershipForm((p) => ({
                        ...p,
                        memberId: e.target.value,
                      }))
                    }>
                    {members.rows.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({m.member_code})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
              <FormControl>
                <FormLabel>Plan</FormLabel>
                <Select
                  placeholder='Select plan'
                  value={membershipForm.planId}
                  onChange={(e) =>
                    setMembershipForm((p) => ({ ...p, planId: e.target.value }))
                  }>
                  {plans.rows.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Start date</FormLabel>
                <Input
                  type='date'
                  value={membershipForm.startDate}
                  onChange={(e) =>
                    setMembershipForm((p) => ({
                      ...p,
                      startDate: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={membershipForm.status}
                  onChange={(e) =>
                    setMembershipForm((p) => ({
                      ...p,
                      status: e.target.value,
                    }))
                  }>
                  <option value='active'>active</option>
                  <option value='expired'>expired</option>
                  <option value='cancelled'>cancelled</option>
                  <option value='pending'>pending</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter gap='8px'>
            <Button variant='ghost' onClick={membershipModal.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme='brand'
              isLoading={saving}
              onClick={saveMembership}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
}
