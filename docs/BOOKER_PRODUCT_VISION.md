# Booker - vision produit

Date: 2026-06-29

## Promesse

Booker permet a un client de trouver rapidement un professionnel disponible autour de lui, puis de reserver une prestation sans devoir appeler plusieurs personnes.

La promesse principale:

> Voir les professionnels disponibles autour de soi, connaitre leur prochaine disponibilite, et reserver simplement.

## Probleme client

Aujourd'hui, une personne qui cherche une coiffeuse, une estheticienne, une prothesiste ongulaire, un masseur, un coach ou un autre professionnel doit souvent:

- chercher sur Google;
- comparer plusieurs profils;
- appeler ou envoyer des messages;
- attendre une reponse;
- verifier les disponibilites;
- comprendre si le professionnel se deplace;
- comparer les prix;
- regarder les avis;
- savoir ou la prestation peut se faire.

Booker doit simplifier ce parcours.

## Experience client cible

Le client doit pouvoir:

- voir les professionnels proches;
- voir leur distance;
- voir leur zone d'intervention;
- voir leur prochaine disponibilite;
- voir leurs modes de prestation: domicile, etablissement, visio;
- voir le prix de depart;
- voir la note et les avis;
- choisir une prestation;
- choisir une adresse ou un lieu;
- reserver;
- retrouver sa reservation dans son espace client.

## Experience pro cible

Le professionnel doit pouvoir:

- creer un compte professionnel;
- completer son profil public;
- renseigner ses prestations;
- renseigner ses lieux d'exercice;
- renseigner ses disponibilites;
- recevoir des demandes de reservation;
- accepter ou refuser une demande;
- retrouver ses rendez-vous dans son agenda.

## MVP prioritaire

Le MVP ne doit pas tout faire. Il doit prouver un parcours simple:

1. Un professionnel configure son profil.
2. Il ajoute ses prestations.
3. Il ajoute ses disponibilites.
4. Un client trouve ce professionnel.
5. Le client reserve.
6. Le pro recoit la demande.
7. Le pro confirme.
8. Le client voit sa reservation.
9. Le pro voit le rendez-vous dans son agenda.

## A ne pas prioriser maintenant

- Paiement Stripe.
- IA.
- Mobile natif.
- Franchises.
- Coworkings avances.
- Statistiques avancees.
- Messagerie complete.
- Revenus detailles.

## Direction technique

Supabase doit devenir la source de verite pour:

- utilisateurs;
- profils;
- roles;
- professionnels;
- prestations;
- lieux;
- disponibilites;
- reservations;
- adresses client.

Zustand peut rester temporairement pour l'interface et les mocks restants, mais chaque prochaine PR doit retirer un morceau de mock utile.

## Ordre de construction conseille

1. Stabiliser reservation et disponibilites.
2. Connecter les adresses client a Supabase.
3. Connecter les disponibilites au tunnel de reservation.
4. Nettoyer le dashboard pro.
5. Connecter favoris et avis.
6. Connecter messages.
7. Preparer paiement plus tard.

## Regle produit

Chaque fonctionnalite doit aider directement l'un de ces deux objectifs:

- permettre au client de reserver plus vite;
- permettre au pro d'etre trouve et de gerer ses demandes.

Si une fonctionnalite ne sert pas encore ces objectifs, elle attend.
