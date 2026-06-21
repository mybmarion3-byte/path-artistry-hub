# Refonte du tunnel de réservation Booker

Reconstruction complète du composant `BookingDialog` pour gérer deux parcours adaptatifs selon le mode choisi. **Aucun autre fichier non lié n'est modifié** (sidebar, page de recherche, ETA temps réel, etc. restent intacts).

## Périmètre

- `src/lib/booker-store.ts` : ajout des données nécessaires (établissements, adresses client, lien pros ↔ établissements). Pas de retrait de l'existant.
- `src/components/app/HomeScreen.tsx` : remplacement de `BookingDialog` (lignes 802-978) par un nouveau tunnel multi-étapes.

## Données ajoutées au store

```text
BusinessLocation
  id, name, photo, address, distanceKm, nextSlot
  proIds: string[]         // pros qui y travaillent

ClientAddress
  id, label (Domicile | Hôtel | Bureau | Custom), address, kind

Pro (étendu, non breaking)
  businessIds?: string[]   // établissements rattachés
```

Trois établissements seed : Salon Paris 17, Salon Boulogne, Coworking Opéra (déjà mentionnés dans la demande). Trois adresses client seed : Domicile (Paris 17e), Hôtel Le Meurice, Bureau La Défense.

## Tunnel adaptatif

Après l'étape « Prestation », question pivot :

> Comment souhaitez-vous être reçu ?  🏠 À domicile · 🏢 En établissement · 💻 En visio

### Parcours « À domicile » (pro mobile)
1. Prestation
2. Mode → `home`
3. Adresse client (liste des adresses sauvegardées + « Ajouter une nouvelle adresse » : Hôtel / Bureau / Personnalisée) — affiche distance, ETA, zone couverte
4. Créneau
5. Infos complémentaires (téléphone, digicode, commentaires)
6. Paiement + récap (pro, prestation, adresse, créneau, ETA, prix)

### Parcours « En établissement »
1. Prestation
2. Choix de l'établissement (photo, nom, adresse, distance, prochaine dispo)
3. Choix du collaborateur (Peu importe / spécifique — photo, note, spécialités, prochaine dispo)
4. Créneau (agenda de l'établissement)
5. Infos complémentaires (téléphone, commentaires)
6. Paiement + récap (établissement, collaborateur, prestation, créneau, prix)

### Parcours « Visio »
1. Prestation
2. Mode → `video`
3. Créneau
4. Infos complémentaires (téléphone, commentaires)
5. Paiement + récap

## Détails techniques

- État local du dialog : `{ step, service, mode, businessId?, collaboratorId?, addressId?, customAddress?, slotIso, phone, digicode, comments }`.
- `Stepper` dynamique selon le nombre d'étapes du parcours actif.
- ETA réutilise la même formule que la page de recherche (`max(5, distance*6 + 6 + jitter)`).
- Aucun changement aux types `Booking` existants — on enrichit `Booking` côté création avec `address` / `businessName` optionnels (champs ajoutés sans casser les usages existants).
- Style cohérent avec l'existant : `rounded-[20px]`, vert émeraude pour les CTA « maintenant », violet Booker sinon, ombres douces.

## UX — ce que l'utilisateur voit

- Une seule question oriente tout : « Comment souhaitez-vous être reçu ? »
- Le tunnel s'adapte ; le client ne voit jamais la complexité base.
- Récap final clair, paiement simulé (toast + redirection `/reservations` comme aujourd'hui).

## Hors périmètre (volontairement intact)

- Sidebar, layout, page de recherche, ETA live, panneau de réservation à droite, page pro, etc.
- Pas de migration DB (Lovable Cloud non activé) — modèle stocké en mémoire via le store Zustand existant.
