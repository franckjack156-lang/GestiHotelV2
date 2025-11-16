# 🐛 Debug du Theme Toggle

**Date**: 2025-11-15
**Problème**: Le bouton switch de thème dans le header ne fonctionne pas

---

## 🔍 Diagnostic Effectué

### 1. Vérifications Structurelles ✅

**Fichiers vérifiés**:
- ✅ [src/shared/components/theme/ThemeToggle.tsx](src/shared/components/theme/ThemeToggle.tsx) - Composant correct
- ✅ [src/shared/contexts/ThemeContext.tsx](src/shared/contexts/ThemeContext.tsx) - Context correct
- ✅ [src/shared/components/layouts/Header.tsx](src/shared/components/layouts/Header.tsx) - Import et utilisation corrects
- ✅ [src/app/main.tsx](src/app/main.tsx) - ThemeProvider bien wrappé
- ✅ [tailwind.config.js](tailwind.config.js) - darkMode: ['class'] configuré
- ✅ [src/styles/globals.css](src/styles/globals.css) - Variables CSS dark mode présentes

### 2. Architecture du Système de Thème

```
main.tsx
  └─ ThemeProvider (Context)
       └─ App
            └─ Header
                 └─ ThemeToggle (Composant)
```

**Flow de changement de thème**:
1. User clique sur un item du dropdown (ThemeToggle)
2. `handleThemeChange()` appelé
3. `setTheme()` du context appelé
4. State `theme` mis à jour
5. `actualTheme` recalculé
6. useEffect déclenché
7. Classes CSS appliquées au `<html>`

### 3. Logs de Debug Ajoutés

**Dans ThemeToggle.tsx**:
```typescript
const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
  console.log('🎨 Changement de thème:', { from: theme, to: newTheme });
  setTheme(newTheme);
};
```

**Dans ThemeContext.tsx**:
```typescript
const setTheme = (newTheme: Theme) => {
  console.log('📝 ThemeContext.setTheme appelé:', { current: theme, new: newTheme, actualTheme });
  setThemeState(newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  console.log('✅ Thème changé et sauvegardé dans localStorage');
};

// Dans l'effet
useEffect(() => {
  console.log('🎨 Application du thème au DOM:', actualTheme);
  // ...
  console.log('✅ Classes DOM:', root.classList.toString());
}, [actualTheme]);
```

---

## 🧪 Tests à Effectuer

### Test 1: Vérifier le Dropdown
1. Lancer l'app: `npm run dev`
2. Ouvrir la console du navigateur (F12)
3. Cliquer sur l'icône soleil/lune dans le header
4. **Attendu**: Le dropdown s'ouvre avec 3 options (Clair, Sombre, Système)

### Test 2: Vérifier les Logs
1. Avec la console ouverte, cliquer sur "Sombre"
2. **Attendu dans la console**:
   ```
   🎨 Changement de thème: { from: "light", to: "dark" }
   📝 ThemeContext.setTheme appelé: { current: "light", new: "dark", actualTheme: "light" }
   ✅ Thème changé et sauvegardé dans localStorage
   🎨 Application du thème au DOM: dark
   ✅ Classes DOM: dark [autres classes...]
   ```

### Test 3: Vérifier l'Application Visuelle
1. Après avoir cliqué sur "Sombre"
2. Inspecter l'élément `<html>` (F12 > Elements)
3. **Attendu**: `<html class="dark ...">` (doit contenir la classe "dark")
4. **Visuel**: L'interface doit passer en mode sombre

### Test 4: Vérifier la Persistance
1. Changer le thème en "Sombre"
2. Rafraîchir la page (F5)
3. **Attendu**: Le thème reste en mode sombre

### Test 5: Vérifier localStorage
1. Ouvrir DevTools > Application > Local Storage
2. Chercher la clé `gestihotel-theme`
3. **Attendu**: Valeur = "dark" (ou "light" ou "system" selon le choix)

---

## 🔧 Solutions Possibles selon les Résultats

### Scénario A: Les logs n'apparaissent pas
**Problème**: Le clic sur le dropdown ne fonctionne pas
**Solutions**:
1. Vérifier qu'il n'y a pas d'autre élément qui capture le clic
2. Vérifier les z-index du dropdown
3. Essayer de cliquer directement sur le texte "Sombre"

### Scénario B: Les logs apparaissent mais pas de changement visuel
**Problème**: Le thème change dans le state mais pas dans le DOM
**Solutions**:
1. Vérifier la console pour des erreurs CSS
2. Vérifier que Tailwind CSS est bien compilé avec le mode dark
3. Forcer un rebuild: `npm run build && npm run dev`

### Scénario C: La classe "dark" est appliquée mais pas de changement visuel
**Problème**: Les styles dark mode ne sont pas définis
**Solutions**:
1. Vérifier que globals.css est bien importé
2. Vérifier la configuration Tailwind
3. Nettoyer le cache: `rm -rf node_modules/.vite && npm run dev`

### Scénario D: Ça fonctionne au premier clic puis plus rien
**Problème**: Event listener non nettoyé ou state corrompu
**Solutions**:
1. Vérifier les useEffect dans ThemeContext
2. Vérifier qu'il n'y a pas de re-render infini

---

## 📋 Checklist de Vérification

- [ ] Le dropdown s'ouvre bien au clic
- [ ] Les 3 options sont visibles (Clair, Sombre, Système)
- [ ] Le clic sur une option déclenche les logs
- [ ] Les logs montrent le bon flow de changement
- [ ] La classe est appliquée au `<html>`
- [ ] L'interface change visuellement
- [ ] Le thème persiste après refresh
- [ ] localStorage contient la bonne valeur

---

## 🎯 Prochaine Étape

**Lancer l'application et tester**:
```bash
npm run dev
```

Puis suivre les tests ci-dessus et me donner le résultat !

Si un problème persiste :
1. Copier les logs de la console
2. Me dire à quelle étape ça bloque
3. Me montrer le résultat dans les DevTools

---

**Note**: Les console.log ajoutés sont temporaires et peuvent être retirés une fois le problème résolu.
