# Authentification Supabase

Cette PR prépare une authentification simple pour Booker sans remplacer les données mock.

## Variables attendues

Le fichier `.env` local doit contenir :

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

L'ancien nom `VITE_SUPABASE_PUBLISHABLE_KEY` reste accepté en secours pour compatibilité avec Lovable, mais `VITE_SUPABASE_ANON_KEY` est le nom à utiliser maintenant.

## Rôles prévus

Booker prévoit trois rôles :

- `client`
- `pro`
- `admin`

L'inscription publique permet seulement de créer un compte `client` ou `pro`.
Le rôle `admin` doit être attribué manuellement côté Supabase, jamais depuis le formulaire public.

## Comportement actuel

- `/auth` permet la connexion, l'inscription et le mot de passe oublié.
- `/reset-password` permet de définir un nouveau mot de passe après l'e-mail Supabase.
- Les routes `/pro` demandent maintenant une session active.
- Les données de réservation et les données métier restent mockées pour l'instant.

## Prochaine étape

La prochaine PR peut créer ou vérifier les tables V1 et les règles RLS nécessaires avant de remplacer progressivement les données mock.
