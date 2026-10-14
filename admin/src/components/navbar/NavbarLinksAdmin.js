import {
  Avatar,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  useColorMode,
} from '@chakra-ui/react';
import { ItemContent } from 'components/menu/ItemContent';
import { SearchBar } from 'components/navbar/searchBar/SearchBar';
import { SidebarResponsive } from 'components/sidebar/Sidebar';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotificationsNone } from 'react-icons/md';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import routes from 'routes';
import { useAuth } from 'contexts/AuthContext';
import api from 'lib/api';

export default function HeaderLinks(props) {
  const { secondary } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const sidebarRoutes = routes.filter(
    (route) => route.layout === '/admin' && !route.hideInSidebar
  );

  useEffect(() => {
    api
      .get('/notifications?limit=8')
      .then((result) => setNotifications(result.data || []))
      .catch(() => setNotifications([]));
  }, []);

  const navbarIcon = useColorModeValue('gray.400', 'white');
  const menuBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorBrand = useColorModeValue('brand.700', 'brand.400');
  const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');
  const shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
    '14px 17px 40px 4px rgba(112, 144, 176, 0.06)'
  );

  return (
    <Flex
      w={{ sm: '100%', md: 'auto' }}
      alignItems='center'
      flexDirection='row'
      bg={menuBg}
      flexWrap={secondary ? { base: 'wrap', md: 'nowrap' } : 'unset'}
      p='10px'
      borderRadius='30px'
      boxShadow={shadow}>
      <SearchBar
        mb={secondary ? { base: '10px', md: 'unset' } : 'unset'}
        me='10px'
        borderRadius='30px'
        placeholder='Search members…'
      />
      <SidebarResponsive routes={sidebarRoutes} />

      <Menu>
        <MenuButton p='0px'>
          <Icon
            mt='6px'
            as={MdNotificationsNone}
            color={navbarIcon}
            w='18px'
            h='18px'
            me='10px'
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p='20px'
          borderRadius='20px'
          bg={menuBg}
          border='none'
          mt='22px'
          me={{ base: '30px', md: 'unset' }}
          minW={{ base: 'unset', md: '400px', xl: '450px' }}
          maxW={{ base: '360px', md: 'unset' }}>
          <Flex w='100%' mb='20px'>
            <Text fontSize='md' fontWeight='600' color={textColor}>
              Notifications
            </Text>
            <Text
              fontSize='sm'
              fontWeight='500'
              color={textColorBrand}
              ms='auto'
              cursor='pointer'
              onClick={() =>
                api.post('/notifications/read-all').then(() =>
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, is_read: true }))
                  )
                )
              }>
              Mark all read
            </Text>
          </Flex>
          <Flex flexDirection='column'>
            {notifications.length === 0 ? (
              <Text fontSize='sm' color={textColor}>
                No notifications yet
              </Text>
            ) : (
              notifications.map((item) => (
                <MenuItem
                  key={item.id}
                  _hover={{ bg: 'none' }}
                  _focus={{ bg: 'none' }}
                  px='0'
                  borderRadius='8px'
                  mb='10px'>
                  <ItemContent
                    info={item.title}
                    body={item.body}
                    time={
                      item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : null
                    }
                  />
                </MenuItem>
              ))
            )}
          </Flex>
        </MenuList>
      </Menu>

      <Button
        variant='no-hover'
        bg='transparent'
        p='0px'
        minW='unset'
        minH='unset'
        h='18px'
        w='max-content'
        onClick={toggleColorMode}>
        <Icon
          me='10px'
          h='18px'
          w='18px'
          color={navbarIcon}
          as={colorMode === 'light' ? IoMdMoon : IoMdSunny}
        />
      </Button>

      <Menu>
        <MenuButton p='0px'>
          <Avatar
            _hover={{ cursor: 'pointer' }}
            color='white'
            name={user?.fullName || 'Admin'}
            src={user?.avatarUrl || undefined}
            bg='#11047A'
            size='sm'
            w='40px'
            h='40px'
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p='0px'
          mt='10px'
          borderRadius='20px'
          bg={menuBg}
          border='none'>
          <Flex w='100%' mb='0px'>
            <Text
              ps='20px'
              pt='16px'
              pb='10px'
              w='100%'
              borderBottom='1px solid'
              borderColor={borderColor}
              fontSize='sm'
              fontWeight='700'
              color={textColor}>
              {user?.fullName || user?.email || 'Admin'}
            </Text>
          </Flex>
          <Flex flexDirection='column' p='10px'>
            <MenuItem
              _hover={{ bg: 'none' }}
              _focus={{ bg: 'none' }}
              borderRadius='8px'
              px='14px'
              onClick={() => navigate('/admin/profile')}>
              <Text fontSize='sm'>Profile</Text>
            </MenuItem>
            <MenuItem
              _hover={{ bg: 'none' }}
              _focus={{ bg: 'none' }}
              borderRadius='8px'
              px='14px'
              onClick={() => navigate('/admin/settings')}>
              <Text fontSize='sm'>Settings</Text>
            </MenuItem>
            <MenuItem
              _hover={{ bg: 'none' }}
              _focus={{ bg: 'none' }}
              color='red.400'
              borderRadius='8px'
              px='14px'
              onClick={() => {
                logout();
                navigate('/auth/sign-in');
              }}>
              <Text fontSize='sm'>Log out</Text>
            </MenuItem>
          </Flex>
        </MenuList>
      </Menu>
    </Flex>
  );
}

HeaderLinks.propTypes = {
  variant: PropTypes.string,
  fixed: PropTypes.bool,
  secondary: PropTypes.bool,
  onOpen: PropTypes.func,
};
