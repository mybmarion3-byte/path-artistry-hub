# Deploiement Booker sur Vercel

Booker est une application TanStack Start avec rendu serveur. Elle doit etre deployee sur un hebergeur compatible SSR, comme Vercel.

## 1. Variables Vercel

Dans Vercel, ajoute ces variables dans Project Settings > Environment Variables :

```env
VITE_SUPABASE_URL=https://ebuxwyrjixvriznqdvdp.supabase.co
VITE_SUPABASE_ANON_KEY=ta_cle_anon_publique
SUPABASE_URL=https://ebuxwyrjixvriznqdvdp.supabase.co
SUPABASE_ANON_KEY=ta_cle_anon_publique
```

Ne jamais ajouter la cle `service_role` dans Vercel pour cette app frontend.

## 2. Migrations Supabase

Avant de tester l'app en ligne, applique les migrations SQL dans le projet Supabase `ebuxwyrjixvriznqdvdp`.

Migrations du projet :

```text
supabase/migrations/20260622141909_c23acb5c-3e2d-425d-bda7-75127517dd67.sql
supabase/migrations/20260622141925_a382d6e4-d0a2-43e5-8bbd-12f83758aff6.sql
supabase/migrations/20260622162000_v1_auth_roles_and_admin_rls.sql
```

Option simple :

1. Ouvrir Supabase.
2. Aller dans SQL Editor.
3. Creer une nouvelle query.
4. Coller le contenu des migrations dans l'ordre.
5. Cliquer sur Run.

Sans ces migrations, les tables `pros`, `pro_services` et `bookings` n'existent pas et l'app ne peut pas fonctionner correctement.

## 3. URLs Supabase Auth

Dans Supabase > Authentication > URL Configuration :

```text
Site URL = https://ton-domaine-vercel.vercel.app
```

Ajoute aussi ces Redirect URLs :

```text
http://localhost:5173
http://localhost:5173/reset-password
https://ton-domaine-vercel.vercel.app
https://ton-domaine-vercel.vercel.app/reset-password
```

Remplace `ton-domaine-vercel.vercel.app` par le vrai domaine Vercel.

## 4. Test apres deploiement

Teste dans cet ordre :

1. Page d'accueil.
2. Creation d'un compte client par e-mail.
3. Connexion / deconnexion.
4. Creation d'un compte professionnel.
5. Acces a `/pro`.
6. Ajout d'une prestation dans `/pro/prestations`.
7. Reservation client.
8. Affichage dans `/reservations`.
