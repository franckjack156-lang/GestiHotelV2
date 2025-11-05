/**
 * Script pour créer un établissement avec Firebase Admin SDK
 *
 * Usage: node scripts/createEstablishmentAdmin.js YOUR_USER_ID
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger la clé de service
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Créer un établissement
 */
async function createEstablishment(userId) {
  try {
    console.log("🏨 Création de l'établissement...");

    const establishmentData = {
      // Informations de base
      name: 'Hôtel Example',
      displayName: 'Hôtel Example',
      type: 'hotel',
      category: 3,
      description: 'Établissement de test pour GestiHôtel V2',

      // Adresse et contact
      address: {
        street: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
      },
      contact: {
        email: 'contact@hotel-example.fr',
        phone: '+33123456789',
      },
      website: 'https://hotel-example.fr',

      // Capacité
      totalRooms: 50,
      totalFloors: 5,

      // Logo et branding
      logoUrl: '',
      primaryColor: '#4F46E5',
      secondaryColor: '#818CF8',

      // Statut
      isActive: true,

      // Configuration des fonctionnalités
      features: {
        interventions: { enabled: true },
        rooms: { enabled: true },
        planning: { enabled: true },
        analytics: { enabled: true },
        qrcodes: { enabled: false },
        templates: { enabled: false },
        messaging: { enabled: true },
        notifications: { enabled: true },
        exports: { enabled: true },
        signatures: { enabled: false },
      },

      // Paramètres
      settings: {
        timezone: 'Europe/Paris',
        defaultLanguage: 'fr',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        interventionPrefix: 'INT',
        interventionStartNumber: 1,
      },

      // Métadonnées
      ownerId: userId,
      managerIds: [userId],

      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Créer le document
    const docRef = await db.collection('establishments').add(establishmentData);

    console.log('✅ Établissement créé avec succès !');
    console.log('📍 ID:', docRef.id);
    console.log('🏨 Nom:', establishmentData.name);

    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    throw error;
  }
}

/**
 * Mettre à jour l'utilisateur
 */
async function updateUser(userId, establishmentId) {
  try {
    console.log('');
    console.log("👤 Mise à jour de l'utilisateur...");

    await db
      .collection('users')
      .doc(userId)
      .update({
        establishmentIds: [establishmentId],
        currentEstablishmentId: establishmentId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log('✅ Utilisateur mis à jour !');
  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error);
    console.log('');
    console.log('⚠️  Mettez à jour manuellement dans Firestore:');
    console.log(
      JSON.stringify(
        {
          establishmentIds: [establishmentId],
          currentEstablishmentId: establishmentId,
        },
        null,
        2
      )
    );
  }
}

/**
 * Point d'entrée du script
 */
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  Création Établissement - GestiHôtel  ║');
  console.log('║         (Firebase Admin SDK)          ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');

  // ID utilisateur
  const userId = process.argv[2];

  if (!userId) {
    console.log('❌ Erreur: ID utilisateur manquant');
    console.log('');
    console.log('Usage: node scripts/createEstablishmentAdmin.js YOUR_USER_ID');
    console.log('');
    process.exit(1);
  }

  console.log('👤 User ID:', userId);
  console.log('');

  const establishmentId = await createEstablishment(userId);
  await updateUser(userId, establishmentId);

  console.log('');
  console.log('✨ Script terminé avec succès !');
  console.log('');
  console.log('🎯 Prochaines étapes:');
  console.log('1. Décommentez <EstablishmentSwitcher /> dans Header.tsx');
  console.log("2. Redémarrez l'app: npm run dev");
  console.log("3. Connectez-vous pour voir l'établissement");
  console.log('');

  process.exit(0);
}

// Exécuter le script
main().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
