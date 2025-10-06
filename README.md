# TraficDay 🚦

**Sécurité routière en temps réel pour la Côte d'Ivoire**

TraficDay est une application web progressive (PWA) qui permet aux usagers de la route de signaler et consulter en temps réel les obstacles routiers tels que les inondations, manifestations, embouteillages, routes fermées et contrôles de police.

![TraficDay Logo](./logo.png)

## 🌟 Fonctionnalités

- **📍 Carte interactive en temps réel** - Visualisez tous les obstacles signalés sur une carte Leaflet
- **🚨 Signalement d'obstacles** - Signalez rapidement :
  - Inondations
  - Manifestations
  - Routes fermées
  - Embouteillages
  - Police routière
- **👥 Système de confirmation** - Les alertes sont vérifiées par la communauté
- **🔔 Notifications push** - Recevez des alertes pour les obstacles dans votre zone (rayon de 1,6 km)
- **🎨 Interface adaptive** - Les couleurs changent selon le niveau de danger dans votre zone
- **📱 PWA** - Installez l'app sur votre téléphone comme une app native
- **🔐 Authentification Google** - Connexion sécurisée avec votre compte Google
- **🌍 Géolocalisation** - Votre position est suivie pour vous alerter des dangers à proximité

## 🎨 Niveaux de Danger

- **Zone sûre** 🟢 - Aucun danger signalé (Teal)
- **Vigilance normale** 🟢 - Obstacles mineurs à 5km (Vert)
- **Attention requise** 🟡 - Obstacles modérés à 2km (Jaune)
- **Danger élevé** 🟠 - Vigilance accrue à 2km (Orange)
- **Danger critique** 🔴 - Zone dangereuse à 500m (Rouge)

## 🛠️ Technologies Utilisées

- **Frontend**: HTML5, CSS3, JavaScript (ES6 modules)
- **Carte**: Leaflet.js avec OpenStreetMap
- **Backend**: Firebase
  - Firebase Authentication
  - Firebase Realtime Database
  - Firebase Cloud Functions
  - Firebase Cloud Messaging (FCM)
  - Firebase Hosting
- **PWA**: Service Worker, Web App Manifest

## 📦 Installation

### Prérequis

- Node.js 18+
- Firebase CLI
- Un projet Firebase configuré

### Étapes

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-username/traficday.git
   cd traficday
   ```

2. **Installer Firebase CLI** (si non installé)
   ```bash
   npm install -g firebase-tools
   ```

3. **Se connecter à Firebase**
   ```bash
   firebase login
   ```

4. **Installer les dépendances Cloud Functions**
   ```bash
   cd functions
   npm install
   cd ..
   ```

5. **Configurer Firebase**
   - Créez un projet Firebase sur https://console.firebase.google.com
   - Activez Authentication (Google)
   - Activez Realtime Database
   - Activez Cloud Messaging
   - Remplacez la configuration dans `public/firebase-config.js` par vos identifiants

6. **Déployer les règles de base de données**
   ```bash
   firebase deploy --only database
   ```

7. **Déployer les Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

8. **Tester localement**
   ```bash
   firebase serve --only hosting
   ```
   Ouvrez http://localhost:5000

9. **Déployer en production**
   ```bash
   firebase deploy
   ```

## 🚀 Utilisation

1. **Ouvrir l'application** sur https://votre-projet.web.app
2. **Autoriser la géolocalisation** pour voir votre position
3. **Se connecter avec Google** pour signaler des obstacles
4. **Activer les notifications** pour recevoir des alertes
5. **Signaler un obstacle** en cliquant sur le bouton ➕
6. **Confirmer les obstacles** en cliquant sur les marqueurs

## 📱 Installation PWA

### Sur Android
1. Ouvrez l'app dans Chrome
2. Appuyez sur le menu (⋮)
3. Sélectionnez "Ajouter à l'écran d'accueil"

### Sur iOS
1. Ouvrez l'app dans Safari
2. Appuyez sur le bouton Partager
3. Sélectionnez "Sur l'écran d'accueil"

## 🔔 Notifications

Les notifications sont envoyées automatiquement lorsque :
- Un obstacle est confirmé par 2+ utilisateurs
- L'obstacle est dans un rayon de 1,6 km (1 mile)

L'administrateur peut aussi envoyer des notifications manuelles depuis Firebase Console.

## 🗂️ Structure du Projet

```
traficday/
├── public/
│   ├── app.js                 # Application principale
│   ├── firebase-config.js     # Configuration Firebase
│   ├── index.html             # Page principale
│   ├── styles.css             # Styles CSS
│   ├── service-worker.js      # Service Worker PWA
│   ├── manifest.json          # Manifest PWA
│   └── icons/                 # Icônes de l'app
├── functions/
│   ├── index.js               # Cloud Functions
│   └── package.json           # Dépendances Functions
├── firebase.json              # Configuration Firebase
├── database.rules.json        # Règles de sécurité Database
├── .firebaserc                # Projets Firebase
├── LICENSE                    # Licence
├── PRIVACY.md                 # Politique de confidentialité
└── README.md                  # Ce fichier
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus d'informations.

## 🔒 Confidentialité

Consultez notre [Politique de Confidentialité](PRIVACY.md) pour savoir comment nous traitons vos données.

## 👨‍💻 Auteur

**The Day Info**
- Site web: [À venir]
- Email: contact@thedayinfo.com

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez-nous à support@thedayinfo.com

## 🙏 Remerciements

- OpenStreetMap pour les données cartographiques
- Leaflet.js pour la bibliothèque de cartes
- Firebase pour l'infrastructure backend
- La communauté open source

## 📊 Statistiques

- Version: 1.0.0
- Date de sortie: Octobre 2025
- Pays cible: Côte d'Ivoire
- Plateforme: Web (PWA)

---

© 2025 The Day Info. Tous droits réservés.

Fait avec ❤️ en Côte d'Ivoire
