import { useEffect, useState } from "react";
import {
  Button,
  Box,
  Grid,
  Input,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { BiLogOut, BiSave } from "react-icons/bi";

import { PageHeader } from "../components/common/PageHeader";
import { GlassPanel } from "../components/common/GlassPanel";
import { isSupabaseConfigured } from "../lib/supabase";
import { requireSupabase } from "../api/client";
import { getErrorMessage } from "../utils/errors";

async function onLogout() {
  const supabase = requireSupabase();
  await supabase.auth.signOut();
  window.history.pushState({}, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function ProfilePage() {
  const textColor = useColorModeValue("rgba(245,241,235,0.92)", "whiteAlpha.900");
  const sectionLabel = useColorModeValue("rgba(245,241,235,0.6)", "whiteAlpha.600");
  const mutedColor = useColorModeValue("rgba(245,241,235,0.76)", "whiteAlpha.800");
  const inputBg = useColorModeValue("#222222", "whiteAlpha.100");
  const inputBorder = useColorModeValue("rgba(255,255,255,0.14)", "whiteAlpha.200");

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const supabase = requireSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          throw authError;
        }
        if (!authData.user) {
          throw new Error("User not authenticated");
        }

        const user = authData.user;
        const fallbackEmail = user.email ?? "";
        setEmail(fallbackEmail);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: fallbackEmail || null,
            },
            { onConflict: "id" },
          )
          .select("name, surname, username, email")
          .single();

        if (profileError) {
          throw profileError;
        }

        if (cancelled) return;
        setUsername(profile.username ?? "");
        setName(profile.name ?? "");
        setSurname(profile.surname ?? "");
        setEmail(profile.email ?? fallbackEmail);
      } catch (caughtError) {
        if (cancelled) return;
        setError(getErrorMessage(caughtError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveProfile() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const supabase = requireSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw authError;
      }
      if (!authData.user) {
        throw new Error("User not authenticated");
      }

      const user = authData.user;
      const normalizedName = name.trim() || null;
      const normalizedSurname = surname.trim() || null;
      const normalizedUsername = username.trim() || null;

      const { data: updated, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? email ?? null,
            name: normalizedName,
            surname: normalizedSurname,
            username: normalizedUsername,
          },
          { onConflict: "id" },
        )
        .select("name, surname, username, email")
        .single();

      if (profileError) {
        throw profileError;
      }

      setUsername(updated.username ?? "");
      setName(updated.name ?? "");
      setSurname(updated.surname ?? "");
      setEmail(updated.email ?? user.email ?? "");
      setMessage("Profile saved");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={6} color={textColor}>
      <PageHeader
        title="Profile"
        description="Account details."
        eyebrowColor={sectionLabel}
        descriptionColor={mutedColor}
      />

      {!isSupabaseConfigured ? (
        <Text color={mutedColor}>
          Supabase is not configured yet. Add `VITE_SUPABASE_URL` and
          `VITE_SUPABASE_ANON_KEY` to enable login and profile features.
        </Text>
      ) : null}

      <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={8} alignItems="start">
        <VStack align="stretch" spacing={4}>
          <GlassPanel
            h="210px"
            borderRadius="8px"
            bg={useColorModeValue("#222222", "linear-gradient(180deg, rgba(214,228,247,0.24) 0%, rgba(109,125,148,0.14) 100%)")}
            borderColor={useColorModeValue("rgba(255,255,255,0.12)", undefined)}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              inset="0"
              bg={useColorModeValue(
                "radial-gradient(circle at 50% 15%, rgba(216,194,164,0.14), transparent 45%)",
                "radial-gradient(circle at 50% 15%, rgba(255,255,255,0.22), transparent 45%)",
              )}
            />
            <Box
              position="absolute"
              bottom="10px"
              left="50%"
              transform="translateX(-50%)"
              w="86px"
              h="86px"
              borderRadius="8px"
              bg={useColorModeValue("rgba(216,194,164,0.1)", "rgba(255,255,255,0.16)")}
              border={useColorModeValue("2px solid rgba(216,194,164,0.18)", "2px solid rgba(255,255,255,0.18)")}
            />
            <Box
              position="absolute"
              bottom="86px"
              left="50%"
              transform="translateX(-50%)"
              w="58px"
              h="58px"
              borderRadius="8px"
              bg={useColorModeValue("rgba(216,194,164,0.12)", "rgba(255,255,255,0.2)")}
              border={useColorModeValue("2px solid rgba(216,194,164,0.2)", "2px solid rgba(255,255,255,0.22)")}
            />
          </GlassPanel>

          <Button
            alignSelf="start"
            variant="outline"
            leftIcon={<BiLogOut />}
            px={6}
            onClick={() => void onLogout()}
            isDisabled={!isSupabaseConfigured}
          >
            Logout
          </Button>
        </VStack>

        <VStack align="stretch" spacing={3}>
          <FieldBlock
            label="Username"
            value={username}
            onChange={setUsername}
            textColor={textColor}
            inputBg={inputBg}
            inputBorder={inputBorder}
            disabled={loading || saving}
          />

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
            <FieldBlock
              label="Name"
              value={name}
              onChange={setName}
              textColor={textColor}
              inputBg={inputBg}
              inputBorder={inputBorder}
              disabled={loading || saving}
            />
            <FieldBlock
              label="Surname"
              value={surname}
              onChange={setSurname}
              textColor={textColor}
              inputBg={inputBg}
              inputBorder={inputBorder}
              disabled={loading || saving}
            />
          </Grid>

          <FieldBlock
            label="Email address"
            value={email}
            onChange={() => {}}
            textColor={textColor}
            inputBg={inputBg}
            inputBorder={inputBorder}
            disabled
          />

          {message ? (
            <Text color="green.400" fontSize="sm">
              {message}
            </Text>
          ) : null}
          {error ? (
            <Text color="red.400" fontSize="sm">
              {error}
            </Text>
          ) : null}

          <Button
            alignSelf="start"
            leftIcon={<BiSave />}
            onClick={() => void onSaveProfile()}
            isLoading={saving}
            isDisabled={loading}
          >
            Save profile
          </Button>
        </VStack>
      </Grid>
    </Stack>
  );
}

interface FieldBlockProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textColor: string;
  inputBg: string;
  inputBorder: string;
  disabled?: boolean;
}

function FieldBlock({
  label,
  value,
  onChange,
  textColor,
  inputBg,
  inputBorder,
  disabled = false,
}: FieldBlockProps) {
  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="sm" color={textColor}>
        {label}
      </Text>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="sm"
        bg={inputBg}
        borderColor={inputBorder}
        color={textColor}
        disabled={disabled}
        _hover={{ borderColor: inputBorder }}
        _focusVisible={{
          borderColor: "rgba(216,194,164,0.52)",
          boxShadow: "0 0 0 1px rgba(216,194,164,0.26)",
        }}
      />
    </VStack>
  );
}
