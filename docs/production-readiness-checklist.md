# Booker production readiness checklist

Cette checklist sert a valider la PR #19 avant merge et deploiement.

## 1. Verification locale

- Lancer `npm run build`.
- Lancer `npx tsc --noEmit`.
- Ouvrir l'application en local sur `http://localhost:5173`.
- Verifier que toutes les routes principales repondent :
  - `/`
  - `/auth`
  - `/reservations`
  - `/favoris`
  - `/avis`
  - `/messages`
  - `/analyses`
  - `/pro`
  - `/pro/parametres`
  - `/pro/prestations`
  - `/pro/disponibilites`
  - `/pro/demandes`
  - `/pro/agenda`
  - `/pro/clients`
  - `/pro/revenus`
  - `/pro/messages`

## 2. Parcours client

- Creer ou connecter un compte client.
- Completer le profil client si necessaire.
- Rechercher un professionnel depuis l'accueil.
- Ouvrir le tunnel de reservation.
- Ajouter ou selectionner une adresse.
- Creer une reservation.
- Verifier que la reservation apparait dans `/reservations`.
- Ajouter un favori depuis la recherche.
- Verifier `/favoris`.
- Envoyer ou consulter un message dans `/messages`.
- Laisser un avis apres une reservation terminee si disponible.
- Verifier `/avis`.
- Verifier `/analyses`.

## 3. Parcours professionnel

- Creer ou connecter un compte pro.
- Verifier que la fiche pro existe dans `pros`.
- Completer `/pro/parametres`.
- Ajouter ou modifier des prestations dans `/pro/prestations`.
- Ajouter des lieux et disponibilites dans `/pro/disponibilites`.
- Verifier les demandes dans `/pro/demandes`.
- Accepter une demande.
- Verifier que le rendez-vous apparait dans `/pro/agenda`.
- Verifier que le client apparait dans `/pro/clients`.
- Verifier les revenus dans `/pro/revenus`.
- Verifier les messages dans `/pro/messages`.

## 4. Supabase

- Verifier que les variables locales existent :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Ne jamais commiter `.env` ou `.env.local`.
- Verifier que les tables existent :
  - `profiles`
  - `user_roles`
  - `pros`
  - `pro_services`
  - `client_addresses`
  - `bookings`
  - `favorites`
  - `reviews`
  - `conversations`
  - `messages`
  - `pro_locations`
  - `pro_activity_blocks`
- Verifier les RLS :
  - un client lit ses propres donnees
  - un pro lit les donnees liees a sa fiche pro
  - un client peut creer une reservation
  - un pro peut accepter/refuser ses demandes
  - les messages sont limites aux participants

## 5. Vercel

- Corriger le blocage d'acces Vercel si le check affiche :
  `Git author must have access to the project on Vercel to create deployments`.
- Verifier que les variables d'environnement Vercel sont renseignees :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Relancer le check Vercel de la PR.
- Ne passer la PR en `Ready for review` que lorsque Vercel est vert.

## 6. Decision merge

La PR peut etre mergee seulement si :

- le build local passe
- TypeScript passe
- les routes principales fonctionnent localement
- Supabase reel contient les tables attendues
- Vercel est vert ou le blocage Vercel est compris et accepte
- le parcours client/pro principal a ete teste

## 7. Apres PR #19

- Ameliorer l'onboarding pro guide.
- Renforcer la qualite des profils pros.
- Ajouter une vraie logique de disponibilite dans le tunnel client.
- Ajouter les etats de paiement uniquement quand Stripe sera prioritaire.
- Ajouter des tests automatises de parcours critique.
