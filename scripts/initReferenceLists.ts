import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Init Firebase Admin
initializeApp();
const db = getFirestore();

async function initReferenceLists(establishmentId: string) {
  const docRef = db
    .collection('establishments')
    .doc(establishmentId)
    .collection('config')
    .doc('reference-lists');

  await docRef.set({
    establishmentId,
    version: 1,
    lastModified: new Date(),
    modifiedBy: 'system',
    lists: {}, // VIDE au départ
  });

  console.log('✅ Listes initialisées (vides)');
}

// Exécute pour ton établissement
initReferenceLists('SpXpS4WXx81deVPZWhRg').then(() => process.exit(0));
