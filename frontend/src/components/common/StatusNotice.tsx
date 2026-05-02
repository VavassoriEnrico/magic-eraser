import { Badge, HStack, Text, type BadgeProps, type TextProps } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { BiCheckCircle, BiErrorCircle } from "react-icons/bi";

interface StatusNoticeProps {
  tone: "error" | "success";
  children: ReactNode;
  variant?: "badge" | "text";
  badgeProps?: BadgeProps;
  textProps?: TextProps;
}

export function StatusNotice({
  tone,
  children,
  variant = "badge",
  badgeProps,
  textProps,
}: StatusNoticeProps) {
  if (variant === "text") {
    return (
      <Text color={tone === "error" ? "red.300" : "green.300"} fontSize="sm" {...textProps}>
        {children}
      </Text>
    );
  }

  return (
    <Badge
      colorScheme={tone === "error" ? "red" : "green"}
      variant="subtle"
      p={2}
      borderRadius="6px"
      alignSelf="start"
      {...badgeProps}
    >
      <HStack spacing={2}>
        <span aria-hidden="true">{tone === "error" ? <BiErrorCircle /> : <BiCheckCircle />}</span>
        <span>{children}</span>
      </HStack>
    </Badge>
  );
}
