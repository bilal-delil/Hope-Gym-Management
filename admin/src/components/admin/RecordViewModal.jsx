import React from 'react';
import {
  Box,
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { StatusBadge } from './DataTableCard';

function formatValue(value, type) {
  if (value == null || value === '') return '—';
  if (type === 'datetime') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  }
  if (type === 'date') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  if (type === 'bool') return value ? 'Yes' : 'No';
  if (type === 'list') {
    if (Array.isArray(value)) return value.join(', ') || '—';
    return String(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function RecordViewModal({
  isOpen,
  onClose,
  title = 'Details',
  fields = [],
  imageUrl,
  imageLabel = 'Proof image',
  footer,
}) {
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('secondaryGray.900', 'white');
  const boxBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='xl' scrollBehavior='inside'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {imageUrl ? (
            <Box mb='20px'>
              <Text fontSize='sm' color={labelColor} mb='8px'>
                {imageLabel}
              </Text>
              <Box
                borderRadius='16px'
                overflow='hidden'
                bg={boxBg}
                borderWidth='1px'
                p='8px'>
                <Image
                  src={imageUrl}
                  alt={imageLabel}
                  maxH='420px'
                  w='100%'
                  objectFit='contain'
                  borderRadius='12px'
                  cursor='zoom-in'
                  onClick={() => window.open(imageUrl, '_blank')}
                />
              </Box>
              <Button
                mt='10px'
                size='sm'
                variant='outline'
                onClick={() => window.open(imageUrl, '_blank')}>
                Open full image
              </Button>
            </Box>
          ) : null}

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing='14px'>
            {fields.map((field) => (
              <Box
                key={field.key || field.label}
                gridColumn={field.fullWidth ? { md: '1 / -1' } : undefined}>
                <Text fontSize='xs' textTransform='uppercase' color={labelColor}>
                  {field.label}
                </Text>
                {field.type === 'status' ? (
                  <Box mt='4px'>
                    <StatusBadge value={field.value} />
                  </Box>
                ) : (
                  <Text mt='4px' color={valueColor} whiteSpace='pre-wrap'>
                    {formatValue(field.value, field.type)}
                  </Text>
                )}
              </Box>
            ))}
          </SimpleGrid>
        </ModalBody>
        <ModalFooter gap='8px'>
          {footer}
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
