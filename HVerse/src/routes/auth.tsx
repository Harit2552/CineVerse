import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Clapperboard, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In or Create an Account | CineVerse Cinemas" },
      {
        name: "description",
        content:
          "Sign in to CineVerse Cinemas to pay for your seats, view your tickets and manage your bookings.",
      },
      { property: "og:title", content: "Sign in to CineVerse Cinemas" },
      { property: "og:description", content: "Your tickets, your seats, your account." },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value) return "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const destination = safePath(redirect);

  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) {
      void supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email ?? "",
          full_name: (user.user_metadata?.["full_name"] as string) ?? "",
          phone: (user.user_metadata?.["phone"] as string) ?? "",
        })
        .then(() => undefined);
      navigate({ to: destination, replace: true });
    }
  }, [user, loading, destination, navigate]);

  function validate(isSignUp: boolean) {
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next["email"] = "Enter a valid email address";
    if (password.length < 6) next["password"] = "Password must be at least 6 characters";
    if (isSignUp) {
      if (fullName.trim().length < 2) next["fullName"] = "Please enter your full name";
      if (!/^[0-9+\-\s]{8,15}$/.test(phone)) next["phone"] = "Enter a valid phone number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    if (!validate(false)) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back to CineVerse");
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (!validate(true)) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${destination}`,
        data: { full_name: fullName, phone },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      return;
    }
    toast.success("Account created");
  }

  if (checkEmail) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <MailCheck className="size-12 text-primary" aria-hidden="true" />
        <h1 className="mt-6 font-display text-3xl tracking-wide">Confirm your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it and you&apos;ll
          come straight back to finish your booking.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <span className="marquee-bg mx-auto flex size-12 items-center justify-center rounded-2xl text-primary-foreground">
          <Clapperboard className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-3xl tracking-wide">Your CineVerse account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to pay for seats and keep every ticket in one place.
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form className="mt-6 space-y-4" onSubmit={handleSignIn} noValidate>
              <Field label="Email" id="email" error={errors["email"]}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password" id="password" error={errors["password"]}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form className="mt-6 space-y-4" onSubmit={handleSignUp} noValidate>
              <Field label="Full name" id="fullName" error={errors["fullName"]}>
                <Input
                  id="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Harit Choudhary"
                />
              </Field>
              <Field label="Email" id="signup-email" error={errors["email"]}>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Phone" id="phone" error={errors["phone"]}>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>
              <Field label="Password" id="signup-password" error={errors["password"]}>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
