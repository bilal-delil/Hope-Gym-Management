import React, { useState } from 'react';
import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import api from 'lib/api';

export function SearchBar(props) {
  const { background, placeholder, borderRadius, ...rest } = props;
  const searchIconColor = useColorModeValue('gray.700', 'white');
  const inputBg = useColorModeValue('secondaryGray.300', 'navy.900');
  const inputText = useColorModeValue('gray.700', 'gray.100');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const onSearch = async (event) => {
    if (event.key !== 'Enter' || !query.trim()) return;
    try {
      const result = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
      const firstMember = result.data?.members?.[0];
      if (firstMember) {
        navigate('/admin/members');
        toast({
          title: `Found ${result.data.members.length} member(s)`,
          status: 'success',
          duration: 2500,
        });
        return;
      }
      if (result.data?.classes?.length) {
        navigate('/admin/classes');
        return;
      }
      if (result.data?.trainers?.length) {
        navigate('/admin/trainers');
        return;
      }
      toast({ title: 'No results found', status: 'info', duration: 2000 });
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 2500 });
    }
  };

  return (
    <InputGroup w={{ base: '100%', md: '200px' }} {...rest}>
      <InputLeftElement
        children={
          <IconButton
            bg='inherit'
            borderRadius='inherit'
            _hover='none'
            _active={{
              bg: 'inherit',
              transform: 'none',
              borderColor: 'transparent',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            icon={<SearchIcon color={searchIconColor} w='15px' h='15px' />}
          />
        }
      />
      <Input
        variant='search'
        fontSize='sm'
        bg={background ? background : inputBg}
        color={inputText}
        fontWeight='500'
        _placeholder={{ color: 'gray.400', fontSize: '14px' }}
        borderRadius={borderRadius ? borderRadius : '30px'}
        placeholder={placeholder ? placeholder : 'Search...'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onSearch}
      />
    </InputGroup>
  );
}
