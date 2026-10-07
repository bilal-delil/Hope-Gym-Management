import React from "react";
import { Box, Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { MdConstruction } from "react-icons/md";

export default function ComingSoon({ pageName }) {
  const textColor = useColorModeValue("navy.700", "white");
  const subColor = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const iconBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="60vh"
        gap="24px">
        <Flex
          w="80px"
          h="80px"
          bg={iconBg}
          borderRadius="20px"
          align="center"
          justify="center">
          <Icon as={MdConstruction} w="40px" h="40px" color={brandColor} />
        </Flex>
        <Text
          fontSize={{ base: "24px", md: "32px" }}
          fontWeight="800"
          color={textColor}
          textAlign="center">
          {pageName || "Coming Soon"}
        </Text>
        <Text
          fontSize="16px"
          color={subColor}
          textAlign="center"
          maxW="400px"
          lineHeight="1.7">
          This section is currently under development. Check back soon — it's
          on the way.
        </Text>
      </Flex>
    </Box>
  );
}
