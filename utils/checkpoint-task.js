import cron from 'node-cron';
import { db } from '../lib/allDb.js';

function performCheckpointAndClose() {
    const now = new Date().toLocaleString();
    console.log(`🕒 [${now}] Checkpoint WAL + fermeture des bases...`);

    for (const [name, dbInstance] of Object.entries(db)) {
        try {
            dbInstance.pragma('wal_checkpoint(FULL)');
            console.log(`Checkpoint réussi pour "${name}"`);

            dbInstance.close();
            console.log(`Base "${name}" fermée correctement`);
        } catch (error) {
            console.error(`Erreur sur "${name}":`, error);
        }
    }

    console.log('Toutes les bases ont été checkpoint et fermées.\n');
}

cron.schedule('25 3 * * *', () => {
    performCheckpointAndClose();
}, {
    timezone: 'Europe/Paris'
});

console.log('📅 Tâche de checkpoint + fermeture planifiée à 3h25 (Europe/Paris)');