import React, { useEffect, useState } from 'react';
import { SimpleGrid, Stat, StatLabel, StatNumber, Text } from '@chakra-ui/react';
import Card from 'components/card/Card';
import PageShell from 'components/admin/PageShell';
import DataTableCard from 'components/admin/DataTableCard';
import api from 'lib/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const result = await api.get('/reports/summary');
        setSummary(result.data);
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
      subtitle='Operational summary across members, payments, and attendance'
      loading={loading}
      error={error}>
      {summary ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap='16px' mb='24px'>
            <Card p='20px'>
              <Stat>
                <StatLabel>Total members</StatLabel>
                <StatNumber>{summary.members?.total_members ?? 0}</StatNumber>
              </Stat>
            </Card>
            <Card p='20px'>
              <Stat>
                <StatLabel>Revenue</StatLabel>
                <StatNumber>
                  ${Number(summary.payments?.total_revenue || 0).toFixed(2)}
                </StatNumber>
              </Stat>
            </Card>
            <Card p='20px'>
              <Stat>
                <StatLabel>Check-ins</StatLabel>
                <StatNumber>{summary.attendance?.checkin_count ?? 0}</StatNumber>
              </Stat>
            </Card>
            <Card p='20px'>
              <Stat>
                <StatLabel>Sessions</StatLabel>
                <StatNumber>
                  {summary.classes?.scheduled_sessions ?? 0}
                </StatNumber>
              </Stat>
            </Card>
          </SimpleGrid>

          <Text mb='12px' fontWeight='700'>
            Top plans
          </Text>
          <DataTableCard
            rows={(summary.topPlans || []).map((p, idx) => ({
              ...p,
              id: p.name || idx,
            }))}
            columns={[
              { key: 'name', label: 'Plan' },
              { key: 'memberships', label: 'Memberships' },
              { key: 'revenue', label: 'Revenue' },
            ]}
          />

          <Text mt='24px' mb='12px' fontWeight='700'>
            Recent payments
          </Text>
          <DataTableCard
            rows={summary.recentPayments || []}
            columns={[
              {
                key: 'member',
                label: 'Member',
                render: (row) => `${row.first_name} ${row.last_name}`,
              },
              { key: 'amount', label: 'Amount' },
              { key: 'method', label: 'Method' },
              { key: 'status', label: 'Status' },
              {
                key: 'paid_at',
                label: 'Paid at',
                render: (row) =>
                  row.paid_at ? new Date(row.paid_at).toLocaleString() : '—',
              },
            ]}
          />
        </>
      ) : null}
    </PageShell>
  );
}
