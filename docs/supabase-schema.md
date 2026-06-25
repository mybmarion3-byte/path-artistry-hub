# Schema Supabase V1

Booker dispose deja d'une base Supabase V1 dans `supabase/migrations`.
Cette etape prepare la base, sans remplacer le store Zustand ni les donnees mock.

## Tables V1

| Table | Role |
| --- | --- |
| `profiles` | Profil de l'utilisateur Supabase : nom, avatar, telephone. |
| `user_roles` | Roles applicatifs : `client`, `pro`, `admin`. |
| `pros` | Fiche publique d'un professionnel. |
| `pro_services` | Prestations proposees par un professionnel. |
| `client_addresses` | Adresses enregistrees par un client. |
| `bookings` | Reservations entre un client, un pro et une prestation, avec statut de paiement. |
| `favorites` | Pros favoris d'un client. |
| `reviews` | Avis client apres une reservation. |
| `messages` | Messages directs entre un expediteur et un destinataire. |

La table `conversations` existe aussi dans les migrations initiales pour regrouper les discussions client/pro.
La V1 ajoute `messages.receiver_id` afin de permettre une lecture directe par expediteur/destinataire.

## Relations principales

- `profiles.id` reference `auth.users.id`.
- `user_roles.user_id` reference `profiles.id`.
- `pros.user_id` reference `profiles.id`.
- `pro_services.pro_id` reference `pros.id`.
- `client_addresses.user_id` reference `profiles.id`.
- `bookings.client_id` reference `profiles.id`.
- `bookings.pro_id` reference `pros.id`.
- `bookings.service_id` reference `pro_services.id`.
- `bookings.address_id` reference `client_addresses.id`.
- `bookings.payment_status` suit l'etat de paiement sans brancher Stripe.
- `favorites.user_id` et `reviews.client_id` reference `profiles.id`.
- `messages.sender_id` reference `profiles.id`.
- `messages.receiver_id` reference `profiles.id`.

## Enums

Roles :

- `client`
- `pro`
- `admin`

Le projet conserve aussi l'enum historique `app_role`, deja utilisee par les migrations initiales.
La migration V1 ajoute `user_role` comme alias de compatibilite pour le vocabulaire produit.

Statuts de reservation :

- `pending`
- `confirmed`
- `cancelled`
- `completed`

Modes de prestation :

- `home`
- `establishment`
- `video`

Note : le code frontend utilise encore la valeur historique `studio` pour le libelle "En etablissement".
La migration ajoute `establishment` cote base, mais ne renomme pas encore la valeur utilisee par l'interface afin d'eviter une rupture transverse.
Le remplacement complet de `studio` par `establishment` devra etre fait dans une PR separee.

Statuts de paiement :

- `pending`
- `paid`
- `failed`
- `refunded`

## RLS

Les regles RLS actuelles couvrent les principes V1 :

- un utilisateur peut lire et modifier son propre profil ;
- un utilisateur peut lire ses propres roles ;
- un pro peut modifier sa fiche `pros` ;
- un pro peut gerer ses propres prestations ;
- un client peut gerer ses propres adresses ;
- un client peut creer ses propres reservations ;
- un client peut lire ses propres reservations ;
- un pro peut lire et mettre a jour les reservations qui le concernent ;
- un client peut gerer ses favoris ;
- un client peut laisser un avis sur ses propres reservations terminees ;
- les messages directs sont lisibles uniquement par l'expediteur et le destinataire ;
- un admin peut lire et gerer les donnees transverses necessaires au support et a l'administration.

La fonction securisee `public.has_role(user_id, role)` sert aux politiques admin.
Elle existe pour `app_role` et la migration V1 ajoute une surcharge compatible avec `user_role`.

## Auth trigger

`public.handle_new_user()` cree automatiquement :

- une ligne `profiles` ;
- une ligne `user_roles`.

L'inscription publique accepte seulement `client` ou `pro`.
Le role `admin` doit etre ajoute manuellement dans Supabase.

## Appliquer les migrations

Depuis Supabase CLI :

```bash
supabase db push
```

Ou depuis l'interface Supabase :

1. ouvrir SQL Editor ;
2. executer les migrations dans l'ordre ;
3. verifier que RLS est active sur les tables publiques ;
4. verifier que le role `admin` n'est jamais attribue par le formulaire public.

## Ce qui n'est pas encore fait

- Les ecrans ne lisent pas encore toutes ces tables.
- Les donnees mock Zustand ne sont pas supprimees.
- La reservation reelle persistante sera branchee dans une PR separee.
