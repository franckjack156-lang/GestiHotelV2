/**
 * Script d'initialisation avec Firebase Admin SDK
 * Usage: node scripts/init-lists-admin.js SpXpS4WXx81deVPZWhRg
 */

const admin = require('firebase-admin');

// Initialiser Firebase Admin
// Option 1: Avec service account (recommandé)
// Téléchargez votre clé de service depuis Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Option 2: Avec variables d'environnement (plus simple pour tester)
// admin.initializeApp({
//  credential: admin.credential.applicationDefault(),
//   projectId: 'votre-project-id', // Remplacez par votre project ID
// });

const db = admin.firestore();

async function initReferenceLists(establishmentId) {
  try {
    console.log('🚀 Initialisation des listes de référence...');
    console.log(`📍 Établissement: ${establishmentId}`);

    const docRef = db
      .collection('establishments')
      .doc(establishmentId)
      .collection('config')
      .doc('reference-lists');

    // Vérifier si existe déjà
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('⚠️  Les listes existent déjà');
      process.exit(0);
    }

    // Structure des listes VIDES
    const data = {
      establishmentId,
      version: 1,
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
      modifiedBy: 'admin',
      lists: {
        interventionTypes: {
          name: "Types d'intervention",
          allowCustom: true,
          isRequired: true,
          isSystem: false,
          items: [],
        },
        interventionPriorities: {
          name: 'Priorités',
          allowCustom: true,
          isRequired: true,
          isSystem: false,
          items: [],
        },
        interventionStatuses: {
          name: 'Statuts',
          allowCustom: true,
          isRequired: true,
          isSystem: false,
          items: [],
        },
        interventionCategories: {
          name: 'Catégories',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        equipmentTypes: {
          name: "Types d'équipement",
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        equipmentBrands: {
          name: 'Marques',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        equipmentLocations: {
          name: 'Emplacements',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        roomTypes: {
          name: 'Types de chambres',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        roomStatuses: {
          name: 'Statuts chambres',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        bedTypes: {
          name: 'Types de lits',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        supplierCategories: {
          name: 'Catégories fournisseurs',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        supplierTypes: {
          name: 'Types fournisseurs',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        maintenanceFrequencies: {
          name: 'Fréquences maintenance',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        maintenanceTypes: {
          name: 'Types maintenance',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        documentCategories: {
          name: 'Catégories documents',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        documentTypes: {
          name: 'Types documents',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        expenseCategories: {
          name: 'Catégories dépenses',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        paymentMethods: {
          name: 'Moyens de paiement',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        staffRoles: {
          name: 'Rôles personnel',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
        staffDepartments: {
          name: 'Départements',
          allowCustom: true,
          isRequired: false,
          isSystem: false,
          items: [],
        },
      },
    };

    // Sauvegarder
    await docRef.set(data);

    console.log('✅ Structure créée avec succès !');
    console.log(`📊 ${Object.keys(data.lists).length} listes vides créées`);
    console.log('');
    console.log('🎉 Rechargez votre page et vous pourrez ajouter vos valeurs !');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Récupérer l'ID depuis les arguments
const establishmentId = process.argv[2];

if (!establishmentId) {
  console.error('❌ Usage: node scripts/init-lists-admin.js <establishmentId>');
  console.log('');
  console.log('Exemple:');
  console.log('  node scripts/init-lists-admin.js SpXpS4WXx81deVPZWhRg');
  process.exit(1);
}

initReferenceLists(establishmentId);
