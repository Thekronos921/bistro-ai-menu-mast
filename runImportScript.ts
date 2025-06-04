// Importa per caricare le variabili d'ambiente (se usi dotenv)
import dotenv from 'dotenv';
dotenv.config(); // Carica .env dalla radice del progetto

// Importa la tua funzione e il client Supabase
import { importRestaurantCategoriesFromCassaInCloud } from './src/integrations/cassaInCloud/cassaInCloudImportService'; // Adatta il percorso
// Potrebbe essere necessario inizializzare Supabase o altre dipendenze qui se non lo fa automaticamente l'import

async function runTest() {
  // !!! SOSTITUISCI CON UN ID RISTORANTE VALIDO ESISTENTE NEL TUO DATABASE SUPABASE !!!
  const restaurantIdSupabaseForTest = 'f3fdf088-407d-45fd-921e-96ec5b18c056';

  // Opzionale: se vuoi testare il filtro per punti vendita
  // const salesPointIdsForTest = ['id_punto_vendita_1', 'id_punto_vendita_2'];

  console.log(`Avvio test di importazione categorie per il ristorante: ${restaurantIdSupabaseForTest}`);

  try {
    const result = await importRestaurantCategoriesFromCassaInCloud(
      restaurantIdSupabaseForTest
      // salesPointIdsForTest // Decommenta se vuoi passare i punti vendita
    );

    if (result.error) {
      console.error('Errore durante l\'importazione:', result.error);
    } else {
      console.log('Risultato importazione:', result);
      console.log(`${result.count} categorie processate.`);
    }
  } catch (e) {
    console.error('Errore imprevisto nello script di test:', e);
  }
}

runTest().then(() => {
  console.log('Script di test completato.');
  // Potrebbe essere necessario chiudere esplicitamente la connessione a Supabase se lo script non termina
  // await supabase.auth.signOut(); // Esempio, o un metodo per chiudere il client se disponibile
  process.exit(0); // Termina lo script Node
}).catch(err => {
  console.error('Errore fatale nello script:', err);
  process.exit(1);
});