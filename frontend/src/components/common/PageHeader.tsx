import { Box, Text, VStack, type StackProps, type TextProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface PageHeaderProps extends StackProps {
  eyebrow?: string;
  title: string;
  description?: string;
  descriptionColor?: string;
  eyebrowColor?: string;
  titleProps?: TextProps;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow = "Workspace",
  title,
  description,
  descriptionColor,
  eyebrowColor,
  titleProps,
  children,
  ...stackProps
}: PageHeaderProps) {
  return (
    <VStack align="stretch" spacing={1} {...stackProps}>
      {eyebrow ? (
        <Text
          color={eyebrowColor ?? "gray.500"}
          fontSize="sm"
          letterSpacing="0.12em"
          textTransform="uppercase"
          _dark={{ color: eyebrowColor ?? "whiteAlpha.600" }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="semibold" letterSpacing="-0.03em" {...titleProps}>
        {title}
      </Text>
      {description ? (
        <Text color={descriptionColor ?? "gray.600"} _dark={{ color: descriptionColor ?? "whiteAlpha.700" }}>
          {description}
        </Text>
      ) : null}
      {children ? <Box pt={1}>{children}</Box> : null}
    </VStack>
  );
}
