# 📱 Guide d'Installation PWA - GestiHôtel

## ✅ Application Prête !

Votre application **GestiHôtel** est maintenant installable comme une application native sur mobile et tablette !

**URL de test** : **http://192.168.1.27:4173**

---

## 📲 Comment Installer sur Android

### **Méthode 1 : Chrome (Recommandé)**

1. Ouvrez **Chrome** sur votre téléphone Android
2. Accédez à **http://192.168.1.27:4173**
3. Une **bannière d'installation** apparaîtra automatiquement en bas de l'écran :
   ```
   [+] Ajouter GestiHôtel à l'écran d'accueil
   ```
4. Cliquez sur **"Ajouter"** ou **"Installer"**
5. L'icône de l'app apparaîtra sur votre écran d'accueil

### **Méthode 2 : Menu Chrome**

Si la bannière n'apparaît pas :

1. Ouvrez le **menu** de Chrome (⋮ en haut à droite)
2. Sélectionnez **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
3. Confirmez l'installation

---

## 🍎 Comment Installer sur iOS (iPhone/iPad)

### **Safari uniquement** (Chrome/Firefox ne supportent pas les PWA sur iOS)

1. Ouvrez **Safari** sur votre iPhone/iPad
2. Accédez à **http://192.168.1.27:4173**
3. Cliquez sur l'icône **Partager** (□↑ en bas au centre)
4. Faites défiler et sélectionnez **"Sur l'écran d'accueil"**
5. Donnez un nom (pré-rempli : "GestiHôtel")
6. Cliquez sur **"Ajouter"**
7. L'icône apparaîtra sur votre écran d'accueil

**Note iOS** : L'icône utilisera automatiquement `apple-touch-icon-180x180.png` (icône iOS optimisée)

---

## 💻 Comment Installer sur Desktop

### **Chrome/Edge/Opera**

1. Ouvrez l'application dans **Chrome** ou **Edge**
2. Une **icône d'installation** (+) apparaîtra dans la barre d'adresse
3. Cliquez sur l'icône
4. Cliquez sur **"Installer"**
5. L'application s'ouvrira dans une fenêtre dédiée

### **Firefox**

Firefox ne supporte pas encore l'installation PWA directement, mais vous pouvez :
- Créer un raccourci sur le bureau
- Utiliser un autre navigateur pour l'installation

---

## ✨ Fonctionnalités PWA Activées

### 🔄 **Mise à jour automatique**
- L'app se met à jour automatiquement en arrière-plan
- Vous serez notifié quand une nouvelle version est disponible

### 💾 **Mode hors ligne**
- Cache intelligent des pages et ressources
- Synchronisation automatique quand la connexion revient

### 📦 **Cache optimisé**
- **Firestore API** : Cache 24h avec stratégie NetworkFirst
- **Firebase Storage** : Cache 30 jours avec stratégie CacheFirst
- **Images** : Cache 7 jours
- **Fonts** : Cache 1 an

### 📱 **Expérience Native**
- Écran de démarrage personnalisé
- Pas de barre d'adresse
- Icône sur l'écran d'accueil
- Mode portrait par défaut
- Notifications push (si activées)

---

## 🔍 Vérifier l'Installation

### Sur Mobile

1. Allez sur votre **écran d'accueil**
2. Recherchez l'icône **GestiHôtel** (icône bleue avec lettre "G")
3. Appuyez pour ouvrir l'application
4. L'app s'ouvre **en plein écran** (sans barre d'adresse)

### Sur Desktop

1. L'app apparaît dans votre **liste d'applications**
2. Elle s'ouvre dans une **fenêtre dédiée**
3. Vous pouvez l'épingler à la barre des tâches

---

## 🛠️ Dépannage

### **La bannière d'installation n'apparaît pas**

**Causes possibles** :
1. ❌ App déjà installée
2. ❌ Connexion HTTP (pas HTTPS) - Normal en local
3. ❌ Service Worker bloqué par le navigateur
4. ❌ Navigateur incompatible

**Solutions** :
- Utilisez le **menu du navigateur** → "Installer l'application"
- Videz le cache : Paramètres → Confidentialité → Effacer les données
- Sur iOS : Utilisez **Safari uniquement**

### **L'icône est cassée/blanche**

- Rechargez l'application
- Réinstallez l'app
- Vérifiez que vous accédez bien à l'URL correcte

### **Erreur "Impossible d'installer"**

- Vérifiez votre connexion réseau
- Assurez-vous d'être sur le **même réseau WiFi** que le serveur
- Redémarrez le navigateur

---

## 📋 Checklist de Test

- [ ] Banner d'installation apparaît sur Android/Chrome
- [ ] Installation réussie sur Android
- [ ] Installation réussie sur iOS/Safari
- [ ] Icône correcte sur l'écran d'accueil
- [ ] Application s'ouvre en plein écran
- [ ] Pas de barre d'adresse visible
- [ ] Écran de démarrage avec logo affiché
- [ ] Navigation fluide
- [ ] Mode hors ligne fonctionne (couper le WiFi et recharger)
- [ ] Mise à jour automatique fonctionne

---

## 🚀 Déploiement en Production

Pour rendre l'app installable pour vos clients en production :

### **1. Hébergement HTTPS Requis**

Les PWA nécessitent **HTTPS** en production. Options :

- **Firebase Hosting** (gratuit + SSL auto) ✅ Recommandé
- **Vercel** (gratuit + SSL auto)
- **Netlify** (gratuit + SSL auto)
- **Votre serveur** avec certificat SSL

### **2. Domaine Personnalisé (Optionnel)**

Pour un branding professionnel :
```
https://app.votre-hotel.fr
ou
https://gestion.votre-hotel.fr
```

### **3. Configuration Firebase Hosting**

```bash
# Déployer en production
npm run build
firebase deploy --only hosting
```

L'app sera accessible à :
```
https://votre-projet.web.app
ou
https://votre-domaine.com
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez la console du navigateur (F12)
2. Testez sur un autre appareil
3. Vérifiez que le service worker est enregistré :
   - Chrome DevTools → Application → Service Workers

---

## 🎉 C'est Tout !

Votre application **GestiHôtel** est maintenant une vraie PWA installable sur tous les appareils !

**Profitez de l'expérience native** sans passer par les app stores. 📱✨
