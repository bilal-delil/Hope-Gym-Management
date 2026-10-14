import React from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import Card from 'components/card/Card';

export default function DataTableCard({
  columns,
  rows,
  emptyText = 'No records found',
  onEdit,
  onDelete,
  extraActions,
}) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  return (
    <Card flexDirection='column' w='100%' px='0px' overflowX={{ sm: 'scroll', lg: 'hidden' }}>
      <Box p='20px'>
        {rows.length === 0 ? (
          <Text color={textColor}>{emptyText}</Text>
        ) : (
          <Table variant='simple' color='gray.500'>
            <Thead>
              <Tr>
                {columns.map((column) => (
                  <Th key={column.key} borderColor={borderColor} color='gray.400'>
                    {column.label}
                  </Th>
                ))}
                {(onEdit || onDelete || extraActions) && (
                  <Th borderColor={borderColor} color='gray.400'>
                    Actions
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  {columns.map((column) => (
                    <Td key={column.key} borderColor={borderColor} color={textColor}>
                      {column.render
                        ? column.render(row)
                        : row[column.key] ?? '—'}
                    </Td>
                  ))}
                  {(onEdit || onDelete || extraActions) && (
                    <Td borderColor={borderColor}>
                      <Flex gap='8px' wrap='wrap'>
                        {extraActions ? extraActions(row) : null}
                        {onEdit ? (
                          <Button size='sm' variant='outline' onClick={() => onEdit(row)}>
                            Edit
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            size='sm'
                            colorScheme='red'
                            variant='outline'
                            onClick={() => onDelete(row)}>
                            Delete
                          </Button>
                        ) : null}
                      </Flex>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Card>
  );
}

export function StatusBadge({ value }) {
  const scheme =
    value === 'active' || value === 'completed' || value === 'published'
      ? 'green'
      : value === 'pending' || value === 'scheduled'
        ? 'orange'
        : value === 'declined' || value === 'expired' || value === 'cancelled'
          ? 'red'
          : 'gray';

  return <Badge colorScheme={scheme}>{value}</Badge>;
}
