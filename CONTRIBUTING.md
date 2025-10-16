# Guide de Contribution

Merci de votre intérêt pour contribuer à TraficDay ! 

TraficDay est développé et maintenu par **The Day Info**. Nous accueillons les contributions de la communauté pour améliorer la sécurité routière.

## Table des matières

- [Code de Conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Configuration du développement](#configuration-du-développement)
- [Processus de Pull Request](#processus-de-pull-request)
- [Directives de codage](#directives-de-codage)
- [Signalement de bugs](#signalement-de-bugs)
- [Proposer des fonctionnalités](#proposer-des-fonctionnalités)

## Code de Conduite

### Notre engagement

Nous nous engageons à faire de la participation à ce projet une expérience sans harcèlement pour tous, indépendamment de :
- L'âge
- La taille corporelle
- Le handicap
- L'origine ethnique
- L'identité et l'expression de genre
- Le niveau d'expérience
- La nationalité
- L'apparence personnelle
- La race
- La religion
- L'identité et l'orientation sexuelles

### Nos standards

Exemples de comportements qui contribuent à créer un environnement positif :
-   Utiliser un langage accueillant et inclusif
-   Respecter les différents points de vue et expériences
-   Accepter gracieusement les critiques constructives
-   Se concentrer sur ce qui est le mieux pour la communauté
-   Faire preuve d'empathie envers les autres membres

Exemples de comportements inacceptables :
-  Langage ou imagerie sexualisés et attention sexuelle non sollicitée
-  Trolling, commentaires insultants/désobligeants
-  Harcèlement public ou privé
-  Publication d'informations privées d'autrui sans permission
-  Autres conduites considérées comme inappropriées

### Application

Les instances de comportement abusif, harcelant ou autrement inacceptable peuvent être signalées à :
**armelyara@thedayinfo.com**

## Comment contribuer

### Types de contributions recherchées

Nous recherchons des contributions dans les domaines suivants :

#### Corrections de bugs
- Résoudre les problèmes signalés
- Améliorer la stabilité de l'application
- Corriger les erreurs de sécurité

#### Nouvelles fonctionnalités
- Nouveaux types d'obstacles
- Améliorations de l'interface utilisateur
- Intégrations avec d'autres services

#### Documentation
- Améliorer le README
- Ajouter des commentaires dans le code
- Créer des tutoriels

#### Traductions
- Ajouter de nouvelles langues
- Améliorer les traductions existantes

#### Design
- Améliorer l'UI/UX
- Créer des icônes
- Optimiser les performances visuelles

## Configuration du développement

### Prérequis

- Node.js v18+ et npm
- Compte Firebase (Spark Plan minimum)
- Git

### Installation

1. **Fork le repository**
   ```bash
   # Cliquez sur "Fork" sur GitHub
   ```

2. **Cloner votre fork**
   ```bash
   git clone https://github.com/VOTRE-USERNAME/traficday.git
   cd traficday
   ```

3. **Installer les dépendances**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

4. **Configurer Firebase**
   ```bash
   # Créer un projet Firebase
   # Copier la configuration dans firebase-config.js

   # Activer les services :
   # - Authentication (Google)
   # - Realtime Database
   # - Cloud Messaging
   # - Hosting
   # - Cloud Functions
   ```

5. **Lancer le serveur de développement**
   ```bash
   firebase serve --port 5001
   ```

6. **Déployer les règles de sécurité**
   ```bash
   firebase deploy --only database
   ```

### Structure du projet

```
traficday/
├── public/              # Application front-end
│   ├── app.js          # Logique principale
│   ├── firebase-config.js  # Configuration Firebase
│   ├── index.html      # Interface principale
│   ├── styles.css      # Styles CSS
│   └── sw.js           # Service Worker (PWA)
├── functions/          # Cloud Functions
│   └── index.js        # Notifications push
├── database.rules.json # Règles Realtime Database
├── firebase.json       # Configuration Firebase
└── README.md          # Documentation
```

## Processus de Pull Request

### Avant de soumettre

1. **Vérifier qu'il n'existe pas déjà une PR similaire**
2. **Créer une issue pour discuter des changements majeurs**
3. **Tester localement**
4. **Suivre les directives de codage**

### Soumettre une PR

1. **Créer une branche**
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   # ou
   git checkout -b fix/correction-du-bug
   ```

2. **Faire vos modifications**
   ```bash
   # Écrire du code de qualité
   # Ajouter des commentaires
   # Tester thoroughly
   ```

3. **Commit avec des messages clairs**
   ```bash
   git add .
   git commit -m "feat: ajouter détection automatique de localisation"
   # ou
   git commit -m "fix: corriger affichage carte sur mobile"
   ```

   **Format des commits** :
   - `feat:` Nouvelle fonctionnalité
   - `fix:` Correction de bug
   - `docs:` Documentation
   - `style:` Formatage, point-virgules manquants, etc.
   - `refactor:` Refactorisation du code
   - `test:` Ajout de tests
   - `chore:` Maintenance

4. **Push vers votre fork**
   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```

5. **Créer la Pull Request**
   - Aller sur GitHub
   - Cliquer sur "New Pull Request"
   - Remplir le template :
     ```markdown
     ## Description
     [Décrire vos changements]

     ## Type de changement
     - [ ] Correction de bug
     - [ ] Nouvelle fonctionnalité
     - [ ] Breaking change
     - [ ] Documentation

     ## Tests effectués
     - [ ] Tests locaux
     - [ ] Tests sur mobile
     - [ ] Tests des notifications

     ## Checklist
     - [ ] Code suit les directives de style
     - [ ] Commentaires ajoutés si nécessaire
     - [ ] Documentation mise à jour
     - [ ] Aucun warning dans la console
     ```

### Revue de code

- Un mainteneur The Day Info examinera votre PR
- Des modifications peuvent être demandées
- Une fois approuvée, votre PR sera mergée

## Directives de codage

### JavaScript

```javascript
// Bon
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Rayon de la Terre en km
    // ... logique claire et commentée
}

// Mauvais
function calc(a,b,c,d) {
    let x=6371;
    // ... code non commenté
}
```

**Règles** :
- Utiliser `const` par défaut, `let` si nécessaire, jamais `var`
- Noms de variables descriptifs en camelCase
- Commenter les logiques complexes
- Pas de `console.log` en production (utiliser des flags de dev)
- Gérer tous les cas d'erreur

### CSS

```css
/* Bon */
.report-button {
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: linear-gradient(to right, var(--green-500), var(--green-600));
}

/* Mauvais */
.btn {
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: #43938A; /* Utiliser les variables CSS */
}
```

**Règles** :
- Utiliser les variables CSS (`:root`)
- Classes descriptives
- Mobile-first approach
- Éviter `!important`

### Firebase

```javascript
// Bon
try {
    const obstacleRef = ref(database, `obstacles/${obstacleId}`);
    await update(obstacleRef, { active: false });
} catch (error) {
    console.error('Erreur désactivation obstacle:', error);
    throw error;
}

// Mauvais
update(ref(database, `obstacles/${obstacleId}`), { active: false });
```

**Règles** :
- Toujours utiliser try-catch
- Respecter les règles de sécurité
- Indexer les requêtes fréquentes
- Éviter les lectures/écritures excessives

## Signalement de bugs

### Avant de signaler

1. **Vérifier les issues existantes**
2. **Tester sur la dernière version**
3. **Reproduire le bug de manière fiable**

### Template de bug report

```markdown
**Description**
[Décrire clairement le bug]

**Étapes pour reproduire**
1. Aller sur '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement attendu**
[Ce qui devrait se passer]

**Comportement actuel**
[Ce qui se passe réellement]

**Captures d'écran**
[Si applicable]

**Environnement**
- OS: [ex. iOS 15, Android 12]
- Navigateur: [ex. Chrome 120, Safari 17]
- Version: [ex. 1.0.0]

**Logs de console**
```
[Coller les erreurs de console]
```
```

## Proposer des fonctionnalités

### Template de feature request

```markdown
**Fonctionnalité proposée**
[Décrire la fonctionnalité]

**Problème résolu**
[Quel problème cette fonctionnalité résout-elle ?]

**Solution proposée**
[Comment devrait-elle fonctionner ?]

**Alternatives considérées**
[Autres approches envisagées]

**Impact utilisateur**
[Comment cela affecte les utilisateurs ?]

**Complexité technique**
- [ ] Simple (quelques heures)
- [ ] Moyenne (quelques jours)
- [ ] Complexe (plusieurs semaines)
```

## Priorités de développement

### 🔴 Haute priorité
- Bugs de sécurité
- Crashes de l'application
- Perte de données utilisateur

### 🟠 Priorité moyenne
- Bugs UI/UX
- Problèmes de performance
- Fonctionnalités demandées par plusieurs utilisateurs

### 🟢 Basse priorité
- Améliorations mineures
- Optimisations non critiques
- Nice-to-have features

## Questions et support

- **Email** : support@traficday.com
- **Issues GitHub** : Pour les bugs et features
- **Discussions** : Pour les questions générales

## Reconnaissance

Les contributeurs seront ajoutés au fichier CONTRIBUTORS.md et mentionnés dans les release notes.

## Licence

En contribuant à TraficDay, vous acceptez que vos contributions soient sous [licence MIT](LICENSE).

---

**Merci de contribuer à rendre les routes plus sûres !**

© 2025 TraficDay by The Day Info.
