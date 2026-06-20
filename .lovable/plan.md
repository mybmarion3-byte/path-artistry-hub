## Booker V1 — Parcours client complet

Construction du vrai parcours client end-to-end sur la page d'accueil et les pages liées, avec moteur de matching et mode "demande instantanée".

### 1. Moteur de matching (`src/lib/matching.ts`)
Fonction qui répond : "Qui peut prendre cette demande, où, et quand ?"
Entrées : `{ category, location, when: 'now'|'today'|date, atHome }`
Calcule pour chaque pro :
- compatibilité catégorie/prestation
- distance (déjà dans le store)
- prochaine disponibilité réelle (parsée depuis `availability`)
- mode (domicile/établissement/visio)
- score de pertinence (distance + dispo + note)
Retourne pros triés + statut lisible : "Disponible maintenant", "Dans 12 min", "À 14h30", "Demain 10h"…

### 2. Données enrichies (`booker-store.ts`)
Ajouter au type `Pro` :
- `services: { id, name, duration, price }[]` (plusieurs prestations par pro)
- `modes: ('home'|'studio'|'video')[]`
- `nextSlots: string[]` (créneaux ISO des prochaines dispos)
- `experience`, `portfolio[]`

Ajouter au store :
- `requests: InstantRequest[]` (demandes instantanées envoyées)
- `createRequest()`, `acceptRequest()` (simulation pro accepte après délai)
- `searchQuery`, `setSearchQuery`
- `when: 'now'|'today'|date`, `setWhen`

### 3. Recherche (HomeScreen — barre du haut)
Barre de recherche fonctionnelle :
- input prestation (autocomplete sur catégories/services)
- sélecteur lieu (Paris 17e par défaut, éditable)
- sélecteur quand (Maintenant / Aujourd'hui / Date)
- toggle "à domicile"
Déclenche le moteur de matching → met à jour la liste + la carte.

### 4. Carte avec statuts précis
Sur chaque pin et chaque carte de la liste :
- Badge dispo précis ("Maintenant", "Dans 12 min", "14h30", "Demain 10h")
- Couleur selon statut (vert/orange/gris)
- Prix de départ
- Distance
Bouton vue : Carte / Liste / IA Match (déjà présent, à rendre fonctionnel).

### 5. Profil pro détaillé (drawer/sheet)
Clic sur un pro → ouvre une fiche complète :
- Photo, bio, expérience, note, avis
- Liste des prestations avec prix + durée (sélectionnable)
- Modes de prestation (domicile/établissement/visio)
- Prochaines dispos (créneaux cliquables)
- Boutons : "Réserver ce créneau" / "Envoyer un message" / "Ajouter aux favoris"

### 6. Tunnel de réservation (Dialog en 3 étapes)
1. **Prestation** : choix du service + mode
2. **Créneau** : date + heure (créneaux générés)
3. **Confirmation** : récap (pro, presta, lieu, prix, frais service) + bouton "Confirmer"
→ Crée booking, toast succès, redirige vers `/reservations`.

### 7. Demande instantanée (mode "Uber")
Bouton CTA visible sur Home : "Envoyer une demande à plusieurs pros".
Ouvre un Dialog :
- prestation, lieu, date/heure, budget, commentaire
Soumission :
- Crée `InstantRequest` (status: 'pending')
- Affiche écran d'attente avec compteur de pros notifiés
- Après 3-6s : simulation → un pro "accepte" (toast + booking auto créé)
- Page `/reservations` affiche la nouvelle réservation

### 8. Pages connexes mises à jour
- `/reservations` : déjà ok, ajouter actions Annuler / Laisser un avis
- `/favoris` : fonctionnelle via `favorites` du store
- `/messages` : envoi de message depuis le profil pro

### Détails techniques
- Stack : Zustand + TanStack Router + shadcn (Dialog, Sheet, Tabs, Calendar, Toast déjà installés)
- Pas de backend : tout en mémoire (Zustand)
- Simulation "pro accepte" via `setTimeout`
- Toasts via `sonner` (déjà installé)
- Aucune dépendance nouvelle nécessaire

### Hors scope V1 (repoussé, comme demandé dans le brief)
Espace pro, CRM, statistiques avancées, paiement réel, coworking, équipes, multi-villes, IA réelle.
