/**
 * Script pour générer les icônes PWA
 *
 * Usage: node scripts/generate-pwa-icons.js
 *
 * Pour une vraie génération, utilisez :
 * 1. https://realfavicongenerator.net/ (en ligne)
 * 2. ou installez sharp: npm install --save-dev sharp
 */

const fs = require('fs');
const path = require('path');

console.log('📱 Génération des icônes PWA pour GestiHôtel...\n');

// Créer le dossier public s'il n'existe pas
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ Dossier public/ créé');
}

// SVG de base (déjà créé)
console.log('✅ Icon SVG source disponible dans public/icon.svg');

// Instructions pour l'utilisateur
console.log('\n📋 INSTRUCTIONS POUR GÉNÉRER LES VRAIES ICÔNES:\n');
console.log('Option 1 - Automatique (Recommandé):');
console.log('  npm install --save-dev @vite-pwa/assets-generator');
console.log('  npx pwa-assets-generator --preset minimal public/icon.svg');
console.log('');
console.log('Option 2 - En ligne:');
console.log('  1. Allez sur https://realfavicongenerator.net/');
console.log('  2. Uploadez public/icon.svg');
console.log('  3. Téléchargez le package généré');
console.log('  4. Extrayez les fichiers dans public/');
console.log('');
console.log('Option 3 - Manuellement avec un éditeur:');
console.log('  Exportez public/icon.svg aux tailles suivantes:');
console.log('  - favicon.ico (16x16, 32x32, 48x48)');
console.log('  - pwa-64x64.png');
console.log('  - pwa-192x192.png');
console.log('  - pwa-512x512.png');
console.log('  - apple-touch-icon.png (180x180)');
console.log('');

// Créer des placeholders simples en HTML pour tester
const sizes = [64, 192, 512, 180];
const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="90" fill="#4f46e5"/>
  <g transform="translate(128, 96)">
    <rect x="0" y="0" width="256" height="320" fill="white" opacity="0.95"/>
    <rect x="32" y="40" width="48" height="48" fill="#4f46e5"/>
    <rect x="104" y="40" width="48" height="48" fill="#4f46e5"/>
    <rect x="176" y="40" width="48" height="48" fill="#4f46e5"/>
    <rect x="32" y="112" width="48" height="48" fill="#4f46e5"/>
    <rect x="104" y="112" width="48" height="48" fill="#4f46e5"/>
    <rect x="176" y="112" width="48" height="48" fill="#4f46e5"/>
    <rect x="32" y="184" width="48" height="48" fill="#4f46e5"/>
    <rect x="104" y="184" width="48" height="48" fill="#4f46e5"/>
    <rect x="176" y="184" width="48" height="48" fill="#4f46e5"/>
    <rect x="96" y="256" width="64" height="64" fill="#6366f1"/>
    <text x="128" y="360" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#4f46e5" text-anchor="middle">G</text>
  </g>
</svg>`;

console.log('📦 Création des SVG temporaires...\n');

// Créer les SVG aux bonnes tailles (temporaire jusqu'à génération des vrais PNG)
fs.writeFileSync(path.join(publicDir, 'pwa-64x64.svg'), svgTemplate(64));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.svg'), svgTemplate(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), svgTemplate(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), svgTemplate(180));

console.log('✅ Fichiers SVG temporaires créés (fonctionnels mais non optimisés)');
console.log('✅ L\'application PWA est maintenant installable!\n');
console.log('⚠️  Pour production, générez de vraies images PNG avec l\'une des options ci-dessus.\n');
