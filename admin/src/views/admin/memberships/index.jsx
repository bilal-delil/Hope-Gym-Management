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
import useApiList from 'hooks/useApiList';
import api from 'lib/api';

export default function MembershipsPage() {
  const plans = useApiList('/membership-plans?limit=100');
  const memberships = useApiList('/memberships?limit=100');
  const members = useApiList('/members?limit=100');
  const toast = useToast();

  const planModal = useDisclosure();
  const membershipModal = useDisclosure();
  const [planForm, setPlanForm] = useState({
    name: '',
    billingPeriod: 'monthly',
    durationDays: 30,
    price: 49.99,
  });
  const [membershipForm, setMembershipForm] = useState({
    memberId: '',
    planId: '',
    startDate: new Date().toISOString().slice(0, 10),
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const savePlan = async () => {
    setSaving(true);
    try {
      await api.post('/membership-plans', {
        ...planForm,
        durationDays: Number(planForm.durationDays),
        price: Number(planForm.price),
      });
      toast({ title: 'Plan created', status: 'success', duration: 2000 });
      planModal.onClose();
      plans.reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const saveMembership = async () => {
    setSaving(true);
    try {
      await api.post('/memberships', membershipForm);
      toast({ title: 'Membership assigned', status: 'success', duration: 2000 });
      membershipModal.onClose();
      memberships.reload();
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
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
            <Button mb='16px' colorScheme='brand' onClick={planModal.onOpen}>
              Add plan
            </Button>
            <DataTableCard
              rows={plans.rows}
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
            <Button
              mb='16px'
              colorScheme='brand'
              onClick={membershipModal.onOpen}>
              Assign membership
            </Button>
            <DataTableCard
              rows={memberships.rows}
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

      <Modal isOpen={planModal.isOpen} onClose={planModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add plan</ModalHeader>
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
          <ModalHeader>Assign membership</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={1} gap='12px'>
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
