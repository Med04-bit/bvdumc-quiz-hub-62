import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — BVDUMC Quiz Society" },
      {
        name: "description",
        content:
          "Sign in or create an account to access the BVDUMC Quiz Society quiz operations console.",
      },
      { property: "og:title", content: "Sign in — BVDUMC Quiz Society" },
      {
        property: "og:description",
        content: "Member access to the BVDUMC Quiz Society quiz operations console.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [signupPending, setSignupPending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setSignupPending(true);
    toast.success("Account created. Check your email to confirm your address.");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResetSent(true);
    toast.success("Password reset link sent.");
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="brand-gradient hidden flex-col justify-between p-10 text-primary-foreground lg:flex">
        <BrandMark />
        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-tight font-semibold">
            A single console for every quiz the society runs.
          </h1>
          <p className="mt-4 text-sm text-primary-foreground/75">
            Events, participants, teams, question banks, live scoring and certificates — built for
            Bharati Vidyapeeth Deemed University Medical College, Pune.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">Phase 1 — Foundation release</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <BrandMark tone="light" />
          </div>

          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="surface-panel mt-4 space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold">Member sign in</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use your society account to open the console.
                </p>
              </div>
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={loading}
              >
                Continue with Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="surface-panel mt-4 space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold">Create an account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  New members join as Participant. An admin can upgrade your role later.
                </p>
              </div>
              {signupPending ? (
                <p className="rounded-md bg-secondary p-4 text-sm text-secondary-foreground">
                  Almost done — open the confirmation link we emailed to <strong>{email}</strong>,
                  then sign in.
                </p>
              ) : (
                <form className="space-y-4" onSubmit={handleSignUp}>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full name</Label>
                    <Input
                      id="signup-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="reset" className="surface-panel mt-4 space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold">Reset your password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll email you a secure link to set a new password.
                </p>
              </div>
              {resetSent ? (
                <p className="rounded-md bg-secondary p-4 text-sm text-secondary-foreground">
                  Reset link sent to <strong>{email}</strong>.
                </p>
              ) : (
                <form className="space-y-4" onSubmit={handleReset}>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}
