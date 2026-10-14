import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import {
  MdPeople,
  MdCheckCircle,
  MdCardMembership,
  MdPersonAdd,
  MdPayment,
  MdWarning,
} from 'react-icons/md';
import Card from 'components/card/Card';
import DataTableCard, { StatusBadge } from 'components/admin/DataTableCard';
import api from 'lib/api';

export default function DashboardPage() {
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.get('/dashboard/overview');
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Flex pt='120px' justify='center'>
        <Spinner size='lg' color='brand.500' />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box pt='120px'>
        <Text color='red.400'>{error}</Text>
      </Box>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3, '2xl': 6 }}
        gap='20px'
        mb='20px'>
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdPeople} color={brandColor} />}
            />
          }
          name='Total Members'
          value={String(kpis.total_members ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdCheckCircle} color={brandColor} />
              }
            />
          }
          name='Active Members'
          value={String(kpis.active_members ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdWarning} color={brandColor} />}
            />
          }
          name='Expired Memberships'
          value={String(kpis.expired_memberships ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon
                  w='32px'
                  h='32px'
                  as={MdCardMembership}
                  color={brandColor}
                />
              }
            />
          }
          name="Today's Check-ins"
          value={String(kpis.todays_checkins ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdPersonAdd} color={brandColor} />
              }
            />
          }
          name='New Members'
          value={String(kpis.new_members ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdPayment} color={brandColor} />}
            />
          }
          name='Monthly Revenue'
          value={`$${Number(kpis.monthly_revenue || 0).toLocaleString()}`}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px' mb='20px'>
        <Card p='20px'>
          <Text color={textColor} fontWeight='700' mb='12px'>
            Monthly revenue
          </Text>
          <Text mb='8px' fontSize='sm'>
            Growth: {data?.monthlyRevenue?.growthPercent ?? 0}%
          </Text>
          {(data?.monthlyRevenue?.series || []).map((item) => (
            <Flex key={item.label} justify='space-between' py='6px'>
              <Text>{item.label}</Text>
              <Text fontWeight='600'>${Number(item.revenue).toFixed(2)}</Text>
            </Flex>
          ))}
        </Card>
        <Card p='20px'>
          <Text color={textColor} fontWeight='700' mb='12px'>
            Membership status
          </Text>
          <Text>
            Active: {data?.membershipStatus?.activePercent ?? 0}% (
            {data?.membershipStatus?.active ?? 0})
          </Text>
          <Text mt='8px'>
            Expired: {data?.membershipStatus?.expiredPercent ?? 0}% (
            {data?.membershipStatus?.expired ?? 0})
          </Text>
          <Text mt='16px' fontWeight='700'>
            Pending payments: {kpis.pending_payments ?? 0}
          </Text>
        </Card>
      </SimpleGrid>

      <DataTableCard
        rows={data?.membershipPlans || []}
        emptyText='No membership plans yet'
        columns={[
          { key: 'name', label: 'Plan' },
          {
            key: 'progress',
            label: 'Share',
            render: (row) => `${row.progress || 0}%`,
          },
          { key: 'quantity', label: 'Active qty' },
          {
            key: 'date',
            label: 'As of',
            render: (row) =>
              row.date ? new Date(row.date).toLocaleDateString() : '—',
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => (
              <StatusBadge value={row.is_active === false ? 'inactive' : 'active'} />
            ),
          },
        ]}
      />
    </Box>
  );
}

