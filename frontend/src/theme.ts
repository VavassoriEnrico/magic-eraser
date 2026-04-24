import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Manrope', 'Segoe UI', sans-serif",
    body: "'Manrope', 'Segoe UI', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "transparent",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "6px",
        fontWeight: "700",
        letterSpacing: "-0.01em",
        borderWidth: "1px",
      },
      sizes: {
        sm: {
          h: "36px",
          px: 3.5,
          fontSize: "sm",
        },
        md: {
          h: "42px",
          px: 4,
          fontSize: "sm",
        },
      },
      variants: {
        solid: {
          bg: "#eef3f7",
          color: "#1f2937",
          borderColor: "rgba(148, 163, 184, 0.36)",
          boxShadow: "none",
          _hover: { bg: "#f5f8fb", borderColor: "rgba(148, 163, 184, 0.48)" },
          _active: { bg: "#e4ebf2" },
          _dark: {
            bg: "#1b2430",
            color: "#f0f6fc",
            borderColor: "rgba(240, 246, 252, 0.16)",
            boxShadow: "none",
            _hover: {
              bg: "#24303d",
              borderColor: "rgba(240, 246, 252, 0.24)",
            },
            _active: { bg: "#16202a" },
          },
        },
        outline: {
          borderWidth: "1px",
          borderColor: "rgba(148, 163, 184, 0.34)",
          bg: "rgba(255,255,255,0.02)",
          color: "inherit",
          boxShadow: "none",
          _hover: { bg: "rgba(255,255,255,0.04)", borderColor: "rgba(148, 163, 184, 0.48)" },
          _active: { bg: "rgba(255,255,255,0.06)" },
          _dark: {
            borderColor: "rgba(240, 246, 252, 0.16)",
            bg: "#161b22",
            _hover: {
              bg: "#1c2128",
              borderColor: "rgba(240, 246, 252, 0.24)",
            },
            _active: { bg: "rgba(255,255,255,0.07)" },
          },
        },
        ghost: {
          color: "inherit",
          boxShadow: "none",
          _hover: { bg: "rgba(255,255,255,0.04)" },
          _active: { bg: "rgba(255,255,255,0.06)" },
        },
      },
      defaultProps: {
        variant: "solid",
      },
    },
    Input: {
      defaultProps: {
        variant: "filled",
      },
      variants: {
        filled: {
          field: {
            borderRadius: "6px",
            bg: "#f1f5f9",
            border: "1px solid rgba(148,163,184,0.34)",
            _hover: { bg: "#f8fafc", borderColor: "rgba(148,163,184,0.46)" },
            _focusVisible: {
              bg: "#f8fafc",
              borderColor: "#94a3b8",
              boxShadow: "0 0 0 1px rgba(148,163,184,0.42)",
            },
            _dark: {
              bg: "#151b23",
              border: "1px solid rgba(240,246,252,0.14)",
              _hover: { bg: "#1b2430", borderColor: "rgba(240,246,252,0.22)" },
              _focusVisible: {
                bg: "#1b2430",
                borderColor: "rgba(240,246,252,0.3)",
                boxShadow: "0 0 0 1px rgba(240,246,252,0.18)",
              },
            },
          },
        },
      },
    },
    Select: {
      variants: {
        filled: {
          field: {
            borderRadius: "6px",
            bg: "#f1f5f9",
            border: "1px solid rgba(148,163,184,0.34)",
            _focusVisible: {
              borderColor: "#94a3b8",
              boxShadow: "0 0 0 1px rgba(148,163,184,0.42)",
            },
            _dark: {
              bg: "#151b23",
              border: "1px solid rgba(240,246,252,0.14)",
            },
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: "6px",
        px: 2.5,
        py: 1,
        textTransform: "none",
        fontWeight: "600",
        borderWidth: "1px",
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: "8px",
        },
      },
    },
  },
});

export default theme;
