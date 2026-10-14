import React, { useEffect, useState } from 'react';
import {
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import PageShell from 'components/admin/PageShell';
import DataTableCard, { StatusBadge } from 'components/admin/DataTableCard';
import api from 'lib/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [summaryRes, membersRes, paymentsRes, attendanceRes] =
          await Promise.all([
            api.get('/reports/summary'),
            api.get('/reports/members'),
            api.get('/reports/payments'),
            api.get('/reports/attendance'),
          ]);
        setSummary(summaryRes.data);
        setMembers(membersRes.data || []);
        setPayments(paymentsRes.data || []);
        setAttendance(attendanceRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageShell
      title='Reports'
      subtitle='Live totals from members, payments, attendance, and classes'
      loading={loading}
      error={error}>
      {summary ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap='16px' mb='24px'>
            <Card p='20px'>
              <Stat>
                <StatLabel>Total members</StatLabel>
                <StatNumber>{summary.members?.total_members ?? 0}</StatNumber>
                <Text fontSize='sm' mt='6px'>
                  Active {summary.members?.active_members ?? 0} · Inactive{' '}
                  {summary.members?.inactive_members ?? 0}
                </Text>
              </Stat>
            </Card>
            <Card p='20px'>
              <Stat>
                <StatLabel>Revenue (completed)</StatLabel>
                <StatNumber>
                  ${Number(summary.payments?.total_revenue || 0).toFixed(2)}
                </StatNumber>
                <Text fontSize='sm' mt='6px'>
                  {summary.payments?.payment_count ?? 0} payments · avg $
                  {Number(summary.payments?.average_payment || 0).toFixed(2)}
                </Text>
              </Stat>
            </Card>
            <Card p='20px'>
              <Stat>
                <StatLabel>Check-ins</StatLabel>
                <StatNumber>{summary.attendance?.checkin_count ?? 0}</StatNumber>
                <Text fontSize='sm' mt='6px'>
                  Unique members {summary.attendance?.unique_members ?? 0}
                </Text>
              </Stat>
            </Card>
            <Card p='20px'>
              <Stat>
                <StatLabel>Sessions</StatLabel>
                <StatNumber>
                  {summary.classes?.scheduled_sessions ?? 0}
                </StatNumber>
                <Text fontSize='sm' mt='6px'>
                  Completed {summary.classes?.completed_sessions ?? 0} · Cancelled{' '}
                  {summary.classes?.cancelled_sessions ?? 0}
                </Text>
              </Stat>
            </Card>
          </SimpleGrid>

          <Tabs colorScheme='brand'>
            <TabList>
              <Tab>Top plans</Tab>
              <Tab>Recent payments</Tab>
              <Tab>Members report</Tab>
              <Tab>Payments report</Tab>
              <Tab>Attendance report</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px='0'>
                <DataTableCard
                  rows={(summary.topPlans || []).map((p, idx) => ({
                    ...p,
                    id: p.name || idx,
                  }))}
                  emptyText='No plan data yet'
                  columns={[
                    { key: 'name', label: 'Plan' },
                    { key: 'memberships', label: 'Memberships' },
                    { key: 'revenue', label: 'Revenue' },
                  ]}
                />
              </TabPanel>
              <TabPanel px='0'>
                <DataTableCard
                  rows={summary.recentPayments || []}
                  emptyText='No recent payments'
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
                      key: 'paid_at',
                      label: 'Paid at',
                      render: (row) =>
                        row.paid_at
                          ? new Date(row.paid_at).toLocaleString()
                          : '—',
                    },
                  ]}
                />
              </TabPanel>
              <TabPanel px='0'>
                <DataTableCard
                  rows={members}
                  emptyText='No members report rows'
                  columns={[
                    { key: 'member_code', label: 'Code' },
                    {
                      key: 'name',
                      label: 'Name',
                      render: (row) =>
                        `${row.first_name || ''} ${row.last_name || ''}`.trim(),
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (row) => <StatusBadge value={row.status} />,
                    },
                    { key: 'plan_name', label: 'Plan' },
                    {
                      key: 'joined_at',
                      label: 'Joined',
                      render: (row) =>
                        row.joined_at
                          ? new Date(row.joined_at).toLocaleDateString()
                          : '—',
                    },
                  ]}
                />
              </TabPanel>
              <TabPanel px='0'>
                <DataTableCard
                  rows={payments}
                  emptyText='No completed payments yet'
                  columns={[
                    {
                      key: 'member',
                      label: 'Member',
                      render: (row) =>
                        `${row.first_name || ''} ${row.last_name || ''}`.trim(),
                    },
                    { key: 'member_code', label: 'Code' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'currency', label: 'Currency' },
                    { key: 'method', label: 'Method' },
                    { key: 'reference', label: 'Reference' },
                    {
                      key: 'paid_at',
                      label: 'Paid at',
                      render: (row) =>
                        row.paid_at
                          ? new Date(row.paid_at).toLocaleString()
                          : '—',
                    },
                  ]}
                />
              </TabPanel>
              <TabPanel px='0'>
                <DataTableCard
                  rows={attendance}
                  emptyText='No attendance report rows'
                  columns={[
                    {
                      key: 'member',
                      label: 'Member',
                      render: (row) =>
                        `${row.first_name || ''} ${row.last_name || ''}`.trim(),
                    },
                    { key: 'source', label: 'Source' },
                    {
                      key: 'checked_in_at',
                      label: 'Checked in',
                      render: (row) =>
                        row.checked_in_at
                          ? new Date(row.checked_in_at).toLocaleString()
                          : '—',
                    },
                    {
                      key: 'checked_out_at',
                      label: 'Checked out',
                      render: (row) =>
                        row.checked_out_at
                          ? new Date(row.checked_out_at).toLocaleString()
                          : 'Open',
                    },
                  ]}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      ) : null}
    </PageShell>
  );
}
