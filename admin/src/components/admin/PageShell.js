import React from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

export default function PageShell({
  title,
  subtitle,
  actionLabel,
  onAction,
  loading,
  error,
  children,
}) {
  const textColor = useColorModeValue('navy.700', 'white');
  const subColor = useColorModeValue('secondaryGray.600', 'gray.400');

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex
        mb='24px'
        align={{ base: 'start', md: 'center' }}
        justify='space-between'
        direction={{ base: 'column', md: 'row' }}
        gap='12px'>
        <Box>
          <Heading size='lg' color={textColor}>
            {title}
          </Heading>
          {subtitle ? (
            <Text mt='4px' color={subColor} fontSize='sm'>
              {subtitle}
            </Text>
          ) : null}
        </Box>
        {actionLabel && onAction ? (
          <Button colorScheme='brand' onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Flex>

      {loading ? (
        <Flex justify='center' py='80px'>
          <Spinner size='lg' color='brand.500' />
        </Flex>
      ) : error ? (
        <Text color='red.400'>{error}</Text>
      ) : (
        children
      )}
    </Box>
  );
}
