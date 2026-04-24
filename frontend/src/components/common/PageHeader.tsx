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
  eyebrow = "",
  title,
  description,
  descriptionColor,
  eyebrowColor,
  titleProps,
  children,
  ...stackProps
}: PageHeaderProps) {
  return (
    <VStack align="stretch" spacing={3} {...stackProps}>
      {eyebrow ? (
        <Text
          color={eyebrowColor ?? "rgba(226, 232, 240, 0.72)"}
          fontSize="xs"
          letterSpacing="0.16em"
          textTransform="uppercase"
          fontWeight="700"
          _dark={{ color: eyebrowColor ?? "rgba(226, 232, 240, 0.72)" }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        fontSize={{ base: "3xl", md: "4xl" }}
        fontWeight="800"
        letterSpacing="-0.05em"
        lineHeight="0.95"
        {...titleProps}
      >
        {title}
      </Text>
      {description ? (
        <Text
          maxW="68ch"
          color={descriptionColor ?? "rgba(15, 23, 42, 0.72)"}
          _dark={{ color: descriptionColor ?? "rgba(226, 232, 240, 0.7)" }}
        >
          {description}
        </Text>
      ) : null}
      {children ? <Box pt={1}>{children}</Box> : null}
    </VStack>
  );
}
