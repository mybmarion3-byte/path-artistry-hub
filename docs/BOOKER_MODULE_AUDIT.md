# Booker MVP - audit module par module

Date: 2026-06-29

## Objectif

Transformer Booker en MVP utilisable, avec Supabase comme source de vérité, sans casser le design existant.

## Etat actuel

Le projet est une application TanStack Start + Supabase. La structure frontend est maintenant plus propre qu'au départ, et plusieurs parties sont déjà connectées à Supabase.

### Déjà réel ou partiellement réel

- Authentification email/password avec Supabase.
- Création de profils dans `profiles`.
- Gestion des rôles dans `user_roles`.
- Activation d'un compte professionnel.
- Fiche professionnelle dans `pros`.
- Prestations pro dans `pro_services`.
- Recherche client basée sur les pros réels.
- Création de réservations dans `bookings`.
- Page client `/reservations`.
- Page pro `/pro/demandes`.
- Page pro `/pro/agenda`.
- Page pro `/pro/prestations`.
- Page pro `/pro/parametres`.

### Encore mock ou incomplet

- Adresses client dans le tunnel de réservation.
- Lieux d'exercice et établissements dans le tunnel.
- Créneaux disponibles côté client.
- Messages.
- Favoris.
- Avis.
- Revenus.
- Analyses.
- Calendrier client.
- Dashboard pro.
- Certaines données d'interface dans Zustand.

## Points techniques importants

### Supabase

Les migrations sont dans `supabase/migrations`.

Les migrations les plus importantes pour le MVP actuel sont:

- `20260622141909_c23acb5c-3e2d-425d-bda7-75127517dd67.sql`
- `20260625083000_mvp_database_hardening.sql`
- `20260628190000_create_pro_availability_tables.sql`

La migration des disponibilités ajoute:

- `pro_locations`
- `pro_activity_blocks`

Elle doit être appliquée dans la vraie base Supabase avant de tester `/pro/disponibilites`.

### Reservation

Le tunnel de réservation écrit maintenant dans `bookings`.

Le serveur vérifie:

- utilisateur connecté;
- pro existant;
- prestation existante si fournie;
- mode compatible avec le pro;
- adresse obligatoire pour une prestation à domicile;
- conflit de créneau.

### Risque actuel

Le tunnel utilise encore des données mock pour:

- adresses;
- établissements;
- collaborateurs;
- créneaux affichés.

Donc une réservation peut être créée, mais la disponibilité n'est pas encore totalement fiable métier.

## Ordre de travail recommandé

### 1. Stabiliser la branche actuelle

PR en cours: `fix/supabase-availability`

Objectif:

- corriger la réservation;
- afficher seulement les pros réels;
- ajouter les tables de disponibilités.

Tests:

- `npm run build`
- connexion client;
- réservation client;
- affichage dans `/reservations`;
- affichage dans `/pro/demandes`;
- acceptation pro;
- affichage dans `/pro/agenda`.

### 2. Appliquer les migrations dans Supabase

Appliquer au minimum:

- `20260625083000_mvp_database_hardening.sql`
- `20260628190000_create_pro_availability_tables.sql`

Sans cette étape, le code peut être correct mais la vraie base peut bloquer.

### 3. Connecter les adresses client

Objectif:

- remplacer `DEFAULT_ADDRESSES`;
- lire `client_addresses`;
- créer une adresse depuis le tunnel;
- réutiliser l'adresse dans `bookings.address_id`.

### 4. Connecter les disponibilités au tunnel client

Objectif:

- lire `pro_activity_blocks`;
- afficher uniquement les créneaux réellement disponibles;
- empêcher les réservations hors disponibilité.

### 5. Nettoyer le reste des mocks

Ordre conseillé:

1. Favoris.
2. Avis.
3. Messages.
4. Dashboard pro.
5. Revenus.
6. Analyses.

## Regle de travail

Une PR doit contenir une seule mission claire.

Exemple:

- PR A: adresses client.
- PR B: disponibilités dans le tunnel.
- PR C: favoris.
- PR D: avis.

Ne pas mélanger paiement, design, messages et réservation dans une seule PR.

## Prochaine action recommandée

Tester et merger la PR `fix/supabase-availability`, puis appliquer les migrations Supabase.

Ensuite, la prochaine vraie PR doit être:

`Connect client addresses to booking flow`
