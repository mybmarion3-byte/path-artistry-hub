import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getPrimaryAuthRole, type SignupRole } from "@/lib/auth-roles";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  head: () => ({ meta: [{ title: "Booker — Connexion" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("client");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect || "/" });
    });
  }, [navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role: signupRole },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Compte créé. Vérifiez votre e-mail pour confirmer l'inscription.");
          setMode("signin");
          return;
        }
        toast.success("Compte créé ! Vous êtes connectée.");
        navigate({ to: redirect || (signupRole === "pro" ? "/pro" : "/") });
      } else if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const role = getPrimaryAuthRole(data.user ?? null);
        navigate({ to: redirect || (role === "pro" ? "/pro" : "/") });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("E-mail de réinitialisation envoyé.");
        setMode("signin");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'authentification");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error("Connexion Google impossible");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-emerald-50">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-1">
          <Link to="/" className="text-2xl font-bold tracking-tight">Booker</Link>
          <h1 className="text-xl font-semibold">
            {mode === "signin" && "Connexion"}
            {mode === "signup" && "Créer un compte"}
            {mode === "forgot" && "Mot de passe oublié"}
          </h1>
        </div>

        {mode !== "forgot" && (
          <>
            <Button type="button" variant="outline" className="w-full" onClick={google} disabled>
              Google bientôt disponible
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          {mode === "signup" && (
            <div>
              <Label>Type de compte</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(["client", "pro"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSignupRole(role)}
                    className={`h-10 rounded-xl border text-sm font-medium transition ${
                      signupRole === role
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {role === "client" ? "Client" : "Professionnel"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {mode !== "forgot" && (
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "…" : mode === "signup" ? "Créer mon compte" : mode === "signin" ? "Se connecter" : "Envoyer le lien"}
          </Button>
        </form>

        <div className="text-sm text-center space-y-2 text-muted-foreground">
          {mode === "signin" && (
            <>
              <button className="underline" onClick={() => setMode("forgot")}>Mot de passe oublié ?</button>
              <div>Pas encore de compte ? <button className="underline" onClick={() => setMode("signup")}>Créer un compte</button></div>
            </>
          )}
          {mode === "signup" && (
            <div>Déjà un compte ? <button className="underline" onClick={() => setMode("signin")}>Se connecter</button></div>
          )}
          {mode === "forgot" && (
            <button className="underline" onClick={() => setMode("signin")}>Retour à la connexion</button>
          )}
        </div>
      </Card>
    </div>
  );
}
