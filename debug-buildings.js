// Script de debug à exécuter dans la console du navigateur
// Affiche toutes les valeurs uniques du champ 'building' dans les interventions

import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/core/config/firebase';

async function debugBuildings() {
  const interventionsRef = collection(db, 'interventions');
  const snapshot = await getDocs(interventionsRef);

  const buildings = new Set();
  const samples = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.building) {
      buildings.add(data.building);
      if (samples.length < 5) {
        samples.push({
          id: doc.id,
          title: data.title,
          building: data.building,
        });
      }
    }
  });

  console.log('📊 Valeurs uniques du champ building:', Array.from(buildings));
  console.log('📝 Exemples d\'interventions:', samples);
  console.log(`📈 Total interventions avec building: ${buildings.size} valeurs uniques`);
}

debugBuildings();
