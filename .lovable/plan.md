# Phase 1 — Booker passe de prototype mock à application fonctionnelle

Objectif : une cliente peut créer un compte, réserver un pro à une date/adresse précise, et voir la réservation persister côté client ET côté pro.

Cette phase est volontairement **technique uniquement** : pas de nouvelles fonctionnalités visuelles, pas d'IA, pas de mobile, pas de stats avancées.

---

## 1. Activation Lovable Cloud (backend)

- Activer Lovable Cloud (Supabase managé). Cela débloque DB + Auth + Storage + Server Functions.
- Configurer l'auth email/password + Google (défauts Lovable Cloud).
- Activer la protection HIBP (mots de passe compromis).

## 2. Schéma de base de données (V1)

Tables créées via migration, **toutes avec RLS + GRANTs explicites** :

```text
auth.users                  (géré par Supabase)
profiles                    (1-1 avec auth.users : nom, avatar, téléphone)
user_roles                  (enum app_role: client | pro | admin) + fonction has_role()
pros                        (fiche pro publique, FK profiles.id)
pro_services                (services offerts par chaque pro)
pro_modes                   (modes : home / studio / video)
client_addresses            (adresses du client, FK profiles.id)
bookings                    (réservations : client_id, pro_id, service_id,
                             address_id, mode, start_at, end_at, status, price)
reviews                     (FK booking_id)
favorites                   (FK client_id, pro_id)
conversations + messages    (DM client ↔ pro)
```

Règles RLS clés :
- `profiles` : chacun lit/écrit son profil ; lecture publique restreinte (nom + avatar) via vue.
- `pros`, `pro_services`, `pro_modes` : lecture publique (anon), écriture réservée au pro propriétaire.
- `client_addresses`, `favorites`, `bookings` (côté client) : `auth.uid() = client_id`.
- `bookings` côté pro : visible si `auth.uid() = pro_id` (via jointure `pros.user_id`).
- `messages` : visible aux deux participants.
- `user_roles` : lu uniquement via `has_role()` SECURITY DEFINER. Pas de stockage de rôle sur `profiles`.

Trigger : `handle_new_user()` crée une ligne `profiles` + rôle `client` par défaut.

## 3. Authentification

Pages publiques :
- `/auth` : connexion + inscription (email/password, Google via broker Lovable).
- `/auth/forgot` : envoi e-mail de réinitialisation.
- `/reset-password` : nouveau mot de passe (lecture du hash `type=recovery`).

Protection :
- Routes pro déplacées sous `src/routes/_authenticated/pro.*` (layout managé déjà fourni).
- Routes client sensibles (`reservations`, `favoris`, `messages`, `paiements`, `parametres`) déplacées aussi sous `_authenticated/`.
- Pages publiques : `/`, `/auth*`, pages légales futures.
- Le bouton « Espace pro » devient « Devenir pro » s'il n'a pas le rôle `pro`.

## 4. Server functions (remplacement progressif du store Zustand)

Toutes typées, dans `src/lib/*.functions.ts` :

- `pros.functions.ts` : `listPros`, `getPro(id)`, `listProServices(proId)`.
- `addresses.functions.ts` : `listMyAddresses`, `createAddress`, `updateAddress`, `deleteAddress`.
- `bookings.functions.ts` : `createBooking`, `listMyBookings` (client), `listProBookings` (pro), `cancelBooking`.
- `favorites.functions.ts` : `toggleFavorite`, `listFavorites`.
- Lecture publique (`listPros`) via client publishable serveur ; le reste via `requireSupabaseAuth`.

`createBooking` vérifie côté serveur :
1. Le pro existe et offre ce service + ce mode.
2. `start_at < end_at`, `start_at` dans le futur.
3. **Pas de conflit** : `SELECT 1 FROM bookings WHERE pro_id=? AND status IN ('pending','confirmed') AND tstzrange(start_at,end_at) && tstzrange(?,?)`.
4. Insert atomique. Renvoie la réservation créée.

Le `useBooker` Zustand est conservé pour l'UI éphémère (wizard en cours, filtres, vue map/list) mais **plus pour les données métier** : pros, services, bookings, addresses, favorites viennent via TanStack Query.

## 5. Découpage de HomeScreen.tsx (2 279 lignes)

Nouveaux fichiers sous `src/components/app/home/` :

```text
SearchPage.tsx              orchestrateur (remplace HomeScreen)
SearchMap.tsx               carte + pins
ProList.tsx                 liste des pros (mode liste)
ProCard.tsx                 carte unitaire d'un pro
ProDetailPanel.tsx          panneau détail/bottom-sheet pro
BookingWizard.tsx           orchestrateur du wizard
  ├ ServiceSelector.tsx
  ├ ModeSelector.tsx        (réutilise la logique pro.modes)
  ├ AddressPicker.tsx       (lit client_addresses via Query)
  ├ TimeSlotSelector.tsx    (créneaux dispos selon pro_availabilities mock + bookings réelles)
  └ PaymentSummary.tsx      (récap, pas de paiement réel cette phase)
```

`HomeScreen.tsx` devient un simple ré-export de `SearchPage` (zéro régression d'import) puis sera supprimé une fois les imports migrés.

## 6. Ce qui n'est PAS dans cette phase

- Paiement Stripe réel (récap uniquement, statut `pending`).
- Notifications push, e-mail, SMS.
- Réelle géolocalisation/Mapbox.
- Onboarding pro complet (KYC, SIRET).
- Synchro Google/Apple Calendar.
- IA, mobile (Capacitor), franchises, coworking, statistiques avancées.

## 7. Définition de « terminé » pour cette phase

Scénario E2E validé manuellement dans le preview :
1. Une nouvelle visiteuse crée un compte sur `/auth`.
2. Elle ajoute une adresse principale.
3. Elle choisit un pro, un service, le mode `home`, son adresse, un créneau libre.
4. La réservation est créée en base avec `status='pending'`.
5. Elle apparaît dans `/reservations` (côté client) ET dans `/pro/agenda` (compte pro de test).
6. Un second essai sur le même créneau est refusé par `createBooking` (conflit).

---

## Détails techniques (peu importants si tu n'es pas dev)

- Stack : TanStack Start + React 19 + Supabase managé (Lovable Cloud) + TanStack Query + Tailwind v4.
- Pas d'Edge Function : tout passe par `createServerFn` (TanStack).
- `requireSupabaseAuth` pour les fonctions protégées ; `attachSupabaseAuth` global déjà branché par l'intégration.
- `supabaseAdmin` chargé **dans le handler** uniquement, jamais au top-level d'un `.functions.ts`.
- Données mock (`PROS`, `BUSINESSES`, `DEFAULT_ADDRESSES`) injectées via **migration de seed** pour ne rien perdre visuellement.

---

Cette phase est lourde mais c'est la fondation. Une fois validée, Phase 2 (paiement Stripe + notifs + créneaux pro réels) devient possible sans tout casser.

Tu valides ce plan et j'attaque, ou tu veux ajuster (ex. réduire le scope du découpage, garder /pro hors `_authenticated` pour l'instant, sauter Google sign-in) ?
