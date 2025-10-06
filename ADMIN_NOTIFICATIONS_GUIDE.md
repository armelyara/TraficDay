# Guide d'Envoi de Notifications Admin - TraficDay

**Version:** 3.0.0
**Pour:** Administrateurs The Day Info
**Dernière mise à jour:** 2025-10-06

---

## Vue d'ensemble

TraficDay dispose de **2 systèmes de notifications** :

### 1. 🤖 Notifications Automatiques
- **Déclenchées par:** Le système quand 2+ utilisateurs confirment un obstacle
- **Cibles:** Utilisateurs dans un rayon de 1,6 km
- **Contenu:** "⚠️ [Type obstacle] signalé - [Description] - [X] confirmations"
- **Gestion:** Aucune action admin requise

### 2. 👨‍💼 Notifications Manuelles (Admin)
- **Déclenchées par:** Admin depuis Firebase Console
- **Cibles:** Tous les utilisateurs OU utilisateurs d'une zone spécifique
- **Contenu:** Message personnalisé par l'admin
- **Gestion:** Via Firebase Console FCM

---

## Comment Envoyer une Notification (Admin)

### Prérequis
- Compte Google avec accès admin à Firebase Console
- Projet: **traficday-91045**

### Étapes

#### 1. Accéder à Firebase Console
1. Allez sur https://console.firebase.google.com/
2. Connectez-vous avec votre compte admin
3. Sélectionnez le projet **"traficday-91045"**

#### 2. Ouvrir Cloud Messaging
1. Dans le menu de gauche, cliquez sur **"Messaging"** ou **"Cloud Messaging"**
2. Cliquez sur **"Nouvelle campagne"** ou **"Send your first message"**

#### 3. Composer le Message

**Notification:**
- **Titre:** (max 50 caractères)
  - Exemple: `⚠️ Alerte Inondation - Cocody`
- **Texte:** (max 200 caractères)
  - Exemple: `Route fermée entre Angré et Riviera. Évitez la zone. Détours disponibles.`
- **Image:** (optionnel)
  - URL d'une image d'illustration
- **Nom de la campagne:** (interne, non visible par les utilisateurs)
  - Exemple: `alerte_inondation_cocody_2025_10_06`

Cliquez sur **"Suivant"**

#### 4. Sélectionner la Cible

TraficDay utilise des **topics** pour cibler les utilisateurs :

| Topic | Cible | Utilisation |
|-------|-------|-------------|
| `all` | **Tous les utilisateurs** | Alertes nationales, maintenance app, annonces importantes |
| `abidjan` | **Utilisateurs à Abidjan** | Alertes spécifiques à Abidjan |
| `yamoussoukro` | **Utilisateurs à Yamoussoukro** | Alertes spécifiques à Yamoussoukro |
| `bouake` | **Utilisateurs à Bouaké** | Alertes spécifiques à Bouaké |
| `sanpedro` | **Utilisateurs à San-Pédro** | Alertes spécifiques à San-Pédro |
| `korhogo` | **Utilisateurs à Korhogo** | Alertes spécifiques à Korhogo |
| `cotedivoire` | **Autres zones de Côte d'Ivoire** | Alertes pour zones non spécifiées |

**Sélection:**
1. Choisir **"Utilisateur par sujet"**
2. Entrer le nom du topic (ex: `abidjan`)
3. Cliquer **"Suivant"**

#### 5. Paramètres Avancés (Optionnels)

**Programmation:**
- **Maintenant:** Envoi immédiat
- **Planifier:** Choisir date et heure

**Expiration:**
- Durée de validité de la notification (par défaut: 4 semaines)

**Options supplémentaires:**
- **Son:** Activer/désactiver le son de notification
- **Priorité:** Normal ou Élevé

Cliquez sur **"Suivant"**

#### 6. Réviser et Publier

1. Vérifiez les informations
2. Cliquez sur **"Publier"**
3. ✅ Notification envoyée !

---

## Exemples de Cas d'Usage

### Cas 1: Alerte Inondation Locale

**Scénario:** Fortes pluies à Cocody, routes inondées

**Notification:**
- **Titre:** `⚠️ Inondation - Cocody`
- **Texte:** `Routes impraticables quartier Angré. Évitez la zone jusqu'à 18h.`
- **Cible:** `abidjan`
- **Quand:** Immédiatement

**Résultat:** Tous les utilisateurs à Abidjan reçoivent l'alerte

---

### Cas 2: Manifestation Nationale

**Scénario:** Manifestation prévue dans plusieurs villes

**Notification:**
- **Titre:** `🚨 Manifestation - Routes bloquées`
- **Texte:** `Circulation perturbée dans les grandes villes. Privilégiez le télétravail.`
- **Cible:** `all`
- **Quand:** 1 heure avant le début

**Résultat:** Tous les utilisateurs de l'app reçoivent l'alerte

---

### Cas 3: Maintenance de l'Application

**Scénario:** Mise à jour prévue ce soir

**Notification:**
- **Titre:** `🔧 Maintenance TraficDay`
- **Texte:** `Mise à jour ce soir 23h-1h. Nouvelles fonctionnalités disponibles demain!`
- **Cible:** `all`
- **Quand:** 2 heures avant

**Résultat:** Tous les utilisateurs sont informés

---

### Cas 4: Route Fermée Zone Spécifique

**Scénario:** Travaux routiers à Yamoussoukro

**Notification:**
- **Titre:** `🚧 Travaux - Route fermée`
- **Texte:** `Axe Yamoussoukro-Bouaké fermé jusqu'au 15/10. Déviation par N3.`
- **Cible:** `yamoussoukro`
- **Quand:** Immédiatement

**Résultat:** Seuls les utilisateurs à Yamoussoukro reçoivent l'alerte

---

## Bonnes Pratiques

### ✅ À Faire

1. **Messages clairs et concis**
   - Titre court et informatif
   - Texte direct avec action claire

2. **Utiliser les emojis appropriés**
   - ⚠️ Avertissement
   - 🚨 Urgence
   - 🚧 Travaux
   - 🌊 Inondation
   - 🚗 Embouteillage

3. **Cibler précisément**
   - Alerte locale → Topic spécifique
   - Alerte nationale → Topic `all`

4. **Timing approprié**
   - Urgences: Immédiat
   - Préventif: Planifier à l'avance

5. **Tester avant envoi massif**
   - Envoyer d'abord à un petit groupe test si possible

### ❌ À Éviter

1. **Spam de notifications**
   - Max 3 notifications par jour sauf urgence
   - Espacer les envois de minimum 1 heure

2. **Messages trop longs**
   - Titre: max 50 caractères
   - Texte: max 200 caractères

3. **Informations non vérifiées**
   - Toujours vérifier la source avant diffusion

4. **Notifications non urgentes**
   - Éviter les notifications pour infos mineures

5. **Envoyer au mauvais moment**
   - Éviter 22h-7h sauf urgence critique

---

## Zones Géographiques Supportées

### Coordonnées Approximatives

| Ville | Latitude Min | Latitude Max | Longitude Min | Longitude Max | Topic |
|-------|--------------|--------------|---------------|---------------|-------|
| **Abidjan** | 5.2 | 5.5 | -4.2 | -3.8 | `abidjan` |
| **Yamoussoukro** | 6.7 | 6.9 | -5.4 | -5.2 | `yamoussoukro` |
| **Bouaké** | 7.6 | 7.8 | -5.1 | -4.9 | `bouake` |
| **San-Pédro** | 4.7 | 4.8 | -6.7 | -6.6 | `sanpedro` |
| **Korhogo** | 9.4 | 9.5 | -5.7 | -5.6 | `korhogo` |
| **Autres zones** | - | - | - | - | `cotedivoire` |

**Note:** Les utilisateurs sont automatiquement abonnés au topic de leur zone selon leur géolocalisation.

---

## Statistiques et Suivi

### Voir les Résultats d'une Campagne

1. Firebase Console → **Messaging**
2. Onglet **"Campagnes"**
3. Sélectionner votre campagne
4. Consulter:
   - **Envois:** Nombre de notifications envoyées
   - **Ouvertures:** Nombre d'utilisateurs ayant ouvert l'app
   - **Taux d'ouverture:** Pourcentage d'engagement

### Métriques Clés

- **Taux d'ouverture optimal:** > 20%
- **Taux de clics:** > 10%
- **Temps de réponse:** < 5 secondes

---

## Dépannage

### Problème: Notification non reçue

**Solutions:**
1. Vérifier que le topic existe et a des abonnés
2. Vérifier l'orthographe du nom du topic
3. Attendre 30 secondes (délai de propagation FCM)
4. Vérifier les paramètres de notification de l'utilisateur

### Problème: Mauvais ciblage

**Solutions:**
1. Vérifier le topic sélectionné
2. Consulter les abonnements dans Firebase Realtime Database:
   - Path: `fcmTopics/[topic_name]`

### Problème: Message tronqué

**Solutions:**
1. Réduire la longueur du titre (< 50 caractères)
2. Réduire la longueur du texte (< 200 caractères)
3. Utiliser des abréviations appropriées

---

## Sécurité et Permissions

### Qui Peut Envoyer des Notifications?

Seuls les comptes avec **rôle Editor ou Owner** sur le projet Firebase peuvent accéder à Cloud Messaging.

### Comment Ajouter un Admin?

1. Firebase Console → **Paramètres du projet** (⚙️)
2. Onglet **"Utilisateurs et autorisations"**
3. Cliquer **"Ajouter un membre"**
4. Entrer l'email de l'admin
5. Sélectionner le rôle: **"Editor"**
6. Cliquer **"Ajouter un membre"**

### Comment Retirer un Admin?

1. Firebase Console → **Paramètres du projet** (⚙️)
2. Onglet **"Utilisateurs et autorisations"**
3. Cliquer sur **•••** à droite du nom
4. Sélectionner **"Supprimer le membre"**

---

## Contact et Support

### Questions sur l'Envoi de Notifications

**Email:** support@thedayinfo.com
**Réponse sous:** 24h

### Urgence Technique

**Email:** tech@thedayinfo.com
**Réponse sous:** 2h (pendant heures ouvrables)

### Signaler un Abus

**Email:** abuse@thedayinfo.com

---

## Checklist Avant Envoi

Avant de cliquer sur "Publier", vérifiez:

- [ ] Le titre est clair et concis (< 50 caractères)
- [ ] Le message est informatif et actionnable (< 200 caractères)
- [ ] Le topic cible est correct
- [ ] L'heure d'envoi est appropriée
- [ ] L'information est vérifiée et exacte
- [ ] Le ton est professionnel
- [ ] Les emojis sont appropriés
- [ ] Pas de fautes d'orthographe

---

## Ressources Supplémentaires

- [Documentation Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Best Practices FCM](https://firebase.google.com/docs/cloud-messaging/best-practices)
- [Politique de Confidentialité TraficDay](PRIVACY.md)

---

**Version:** 3.0.0
**Dernière modification:** 2025-10-06
© 2025 The Day Info
