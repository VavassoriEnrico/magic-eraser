import { Badge, Text, type BadgeProps, type TextProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

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
      <Text color={tone === "error" ? "red.400" : "green.400"} fontSize="sm" {...textProps}>
        {children}
      </Text>
    );
  }

  return (
    <Badge
      colorScheme={tone === "error" ? "red" : "green"}
      variant="subtle"
      p={2}
      borderRadius="md"
      alignSelf="start"
      {...badgeProps}
    >
      {children}
    </Badge>
  );
}
