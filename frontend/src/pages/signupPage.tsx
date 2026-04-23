import { FormEvent, useState } from "react";
import { Box, Button, Input, Stack, Text, useColorMode } from "@chakra-ui/react";
import logoBlack from "../assets/me_logo_black.png";
import logoWhite from "../assets/me_logo_white.png";
import { isSupabaseConfigured } from "../lib/supabase";
import { requireSupabase } from "../api/client";

export default function SignupPage() {
  const { colorMode } = useColorMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const logoSource = colorMode === "dark" ? logoWhite : logoBlack;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const supabase = requireSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.user?.id) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email ?? email.trim(),
          },
          { onConflict: "id" },
        );

        if (profileError) {
          setMessage(profileError.message);
          return;
        }
      }

      window.history.pushState({}, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      setMessage("Unable to sign up right now.");
    } finally {
      setSubmitting(false);
    }
  }

  function goToLogin() {
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button type="button" className="auth-back-btn" onClick={goBack} aria-label="Go back">
          ←
        </button>

        <div className="auth-logo-wrap">
          <img className="auth-logo-image" src={logoSource} alt="Magic Eraser" />
        </div>

        <Text className="auth-title">Create account</Text>
        <Text className="auth-subtitle">Sign up to start managing your images.</Text>

        {!isSupabaseConfigured ? (
          <Text className="auth-message">
            Supabase is not configured yet. Add `VITE_SUPABASE_URL` and
            `VITE_SUPABASE_ANON_KEY` to the frontend environment.
          </Text>
        ) : null}

        <Box as="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            <Input
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="auth-input"
              isDisabled={!isSupabaseConfigured}
            />
            <Input
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="auth-input"
              isDisabled={!isSupabaseConfigured}
            />
            <Input
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              required
              className="auth-input"
              isDisabled={!isSupabaseConfigured}
            />
            <Button
              type="submit"
              className="auth-submit-btn"
              isLoading={submitting}
              isDisabled={!isSupabaseConfigured}
            >
              {submitting ? "Signing up..." : "Sign up"}
            </Button>
          </Stack>
        </Box>

        {message ? <Text className="auth-message">{message}</Text> : null}

        <Text className="auth-footer-text">
          Already have an account?{" "}
          <button type="button" className="auth-inline-link" onClick={goToLogin}>
            Log in
          </button>
        </Text>
      </div>
    </div>
  );
}
