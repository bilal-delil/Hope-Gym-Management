import { Flex, Text, useColorModeValue } from '@chakra-ui/react';
import React from 'react';

export function ItemContent({ info, body, time }) {
  const textColor = useColorModeValue('navy.700', 'white');
  const muted = useColorModeValue('gray.500', 'gray.400');

  return (
    <Flex flexDirection='column' w='100%'>
      <Text
        mb='4px'
        fontWeight='bold'
        color={textColor}
        fontSize={{ base: 'sm', md: 'md' }}>
        {info}
      </Text>
      {body ? (
        <Text fontSize='sm' color={muted} noOfLines={2}>
          {body}
        </Text>
      ) : null}
      {time ? (
        <Text fontSize='xs' color={muted} mt='4px'>
          {time}
        </Text>
      ) : null}
    </Flex>
  );
}
