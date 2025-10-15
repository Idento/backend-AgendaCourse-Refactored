import { addDays, format, parse } from 'date-fns';
import Database from 'better-sqlite3';
import { frequentHomeUpdate } from '../utils/frequentUpdate.js';
import { checkAll } from '../utils/checkAll.js';
import { fr } from 'date-fns/locale';
import { json } from 'express';
import { checkNextDate } from '../utils/checkNextDate.js';
import { db } from '../utils/allDb.js';

/**
 * @route   GET home/
 * @desc    Récupère toutes les course d'aujourd'hui
 * @output  [
 *              {driver_id: 5, ...course},
 *              {driver_id: 5, ...course}
 *          ]
 * @logic   -Récupère toutes les courses d'aujourd'hui
 * @access  private
 */
export const GetHomeData = function (req, res) {
    const data = frequentHomeUpdate();
    if (data.length === 0) {
        res.status(200).json([]);
    } else {
        res.status(200).json(data);
    }
}

/**
 * @route   GET home/getNotes
 * @desc    Récupère toutes les notes d'aujourd'hui
 * @input   Body {String} date - Date voulu pour la récupération des courses
 * @output  [
 *              'Note de la journée'
 *          ]
 * @logic   - Récupération de la date voulu dans le body, pour la recherche
 *          - Envoie des notes en JSON
 * @depends maindb
 * @access  private
 */
export const GetHomeNotes = function (req, res) {
    const planningDb = db.planning;
    const { date } = req.body;
    let data;
    try {
        data = planningDb.prepare('SELECT * FROM notes WHERE date = ?').all(date);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    if (data.length === 0) {
        res.status(200).json([]);
    } else {
        res.status(200).json(data);
    }
}

/**
 * @route   POST home/addNote
 * @desc    Ajoute une note ou modifie l'existante de la date en question
 * @input   Body {
 *              date: '25/05/2025',
 *              note: 'note de la journée'                 
 *              }
 * @output 'Data added'
 * @logic   - Récupère la date et les notes de la journées concernant la date
 *          - Récupère dans la bdd si la note est existante
 *          - Si elle n'existe pas:
 *              Insère la note
 *          - Sinon:
 *              Met a jour la note
 * @access private
 * @depends maindb
 * @example
 */
export const AddHomeNote = function (req, res) {
    const planningDb = db.planning;
    const { date, note } = req.body;
    try {
        const data = planningDb.prepare('SELECT * FROM notes WHERE date = ?').all(date);
        if (data.length === 0) {
            planningDb.prepare('INSERT INTO notes (date, note) VALUES (?, ?)').run(date, note);
        } else {
            planningDb.prepare('UPDATE notes SET note = ? WHERE date = ?').run(note, date);
        }
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send('Data added');
}

/**
 * @route   POST home/addData
 * @desc    Ajoute ou met a jour une course
 * @input   BODY {data: 
 *              [
 *                  {
 *                      id:1 , 
 *                      driver_id: 0, 
 *                      date: '25/05/2025', 
 *                      client_name: 'test', 
 *                      start_time: '15:00', 
 *                      return_time: '', 
 *                      note:'test', 
 *                      destination:'la-bas', 
 *                      long_distance: 'true', 
 *                      frequency: [4,5]}
 *                  }
 *              ]
 * @output {id: 1} ou 'data added'
 * @logic
 *          - Récupère les données recu
 *          - Récupère la date d'aujourd'hui
 *          - Récupèration du planning d'aujourd'hui déjà en BDD
 *          - Comparaison de la liste de course du planning d'aujourd'hui avec celui envoyé par l'utilisateur
 *          - En fonction de si la course apparait dans le planning on le met a jour ou on l'insère
 *          - Si dans les données recu, une recurrence apparait, on insère la récurrences ou met a jour
 * 
 * @errors  - 'donnée incomplète'
 *          - 'Erreur d'insertion dans la BDD'
 * @access private
 * @depends maindb
 * @example
 */
export const DataToAdd = async function (req, res) {
    const { data } = req.body;
    const planningDb = db.planning;
    const date = format(new Date(), 'dd/MM/yyyy', { locale: fr });
    let plannings = [];
    let error = false;
    let lastID = [];
    let haveRecurrence = false;
    try { // Fetch the already existing data
        plannings = planningDb.prepare('SELECT * FROM planning WHERE date = ?').all(date);
    } catch (err) {
        console.error('Error while fetching data: ', err);
    }
    for (let i = 0; i < data.length; i++) {
        const { id, driver_id, client_name, start_time, return_time, note, destination, long_distance, frequency } = data[i];
        if (plannings.some(planning => planning.id === id)) {
            const line = plannings.find(planning => planning.id === id);
            if (frequency.length > 0 || (line.recurrence_id !== null && line.recurrence_id !== 0)) {
                haveRecurrence = true;
            }
            const reccurence_id = checkNextDate(date, frequency, line.recurrence_id === null ? 0 : line.recurrence_id, id);
            try {
                planningDb.prepare(`UPDATE planning SET driver_id = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ?, recurrence_id = ? WHERE id = ?`).run(parseInt(driver_id), client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id, id);
            } catch (err) {
                console.error('Error while updating data: ', err);
                res.status(500).send('Internal server error');
                break;
            }
        } else {
            const reccurence_id = checkNextDate(date, frequency, 0, 0);
            if (frequency.length > 0) {
                haveRecurrence = true;
            }
            try {
                if (frequency.length === 0) {
                    const addTransaction = planningDb.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`);
                    console.log(`------[INFO] Ajout planning ID ${addTransaction.lastInsertRowid}, date ${date}, client ${client_name} | Ajouté par ${req.session.user.username} -------`);
                    lastID.push(addTransaction.lastInsertRowid);
                } else {
                    const addTransaction = planningDb.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id);
                    console.log(`------[INFO] Ajout planning ID ${addTransaction.lastInsertRowid}, date ${date}, client ${client_name} | Ajouté par ${req.session.user.username} -------`);
                    lastID.push(addTransaction.lastInsertRowid);
                }
            }
            catch (err) {
                console.error('Error while adding data: ', err);
                res.status(500).send('Internal server error');
                error = true;
                break;
            }
        }
    }
    if (error) {
        res.status(500).send('Internal server error');
        return;
    }
    if (haveRecurrence) {
        console.log('Checking all recurrences...');
        checkAll();
    }
    if (lastID && !error) {
        res.status(200).json({ id: lastID });
    } else {
        if (!error) {
            res.status(200).send('Data added');
        }
    }
}

export const modifyHomeData = async (req, res) => {

}

/**
 * @route   DELETE home/deleteData
 * @desc    Supprime une course spécifique d'aujourd'hui ou une récurrence globale
 * @input
 * Body {
 *    data: [
 *       {
 *           id:1 , 
 *                       driver_id: 0, 
 *                       date: '25/05/2025', 
 *                       client_name: 'test', 
 *                       start_time: '15:00', 
 *                       return_time: '', 
 *                       note:'test', 
 *                       destination:'la-bas', 
 *                       long_distance: 'true', 
 *                       frequency: [4,5]}
 *       }
 *  ]
 * }
 *
 * @output  - 'Data deleted'
 *
 * @logic
 * - Récupèration des données de la requête
 * - Récupération des données dans la bdd 
 * - Si utilisateur demande a supprimer les recurrences, recherche de toutes les courses lié a la recurrence
 * - Boucle sur toutes les courses récurrentes devant être supprimer puis suppression de la course initial
 * - Sinon suppression de la date intiale
 * @errors
 * - "id invalide"
 *
 * @access private
 * @depends maindb
 */
export const DeleteData = function (req, res) {
    const { data } = req.body;
    const planningDb = db.planning;
    let error = false;
    for (let i = 0; i < data.length; i++) {
        try {
            const line = planningDb.prepare('SELECT * FROM planning WHERE id = ?').all(data[i].id);
            if (data[i].deleteRecurrence) {
                const allDatesRecurrence = planningDb.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(line[0].recurrence_id);
                allDatesRecurrence.map((planning) => {
                    const parsedDate = parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr });
                    if (parsedDate > parse(line[0].date, 'dd/MM/yyyy', new Date(), { locale: fr })) {
                        console.log(`------[INFO] Suppression planning ID ${planning.id}, date ${planning.date}, client ${planning.client_name} | Supprimé par ${req.session.user.username} -------`);
                        planningDb.prepare('DELETE FROM planning WHERE id = ?').run(planning.id);
                    } else {
                        planningDb.prepare('UPDATE planning SET recurrence_id = ? WHERE id = ?').run(0, planning.id);
                    }
                });
                planningDb.prepare('DELETE FROM recurrence WHERE id = ?').run(line[0].recurrence_id);
                try {
                    planningDb.prepare('DELETE FROM excluded_days WHERE recurrence_id = ?').run(line[0].recurrence_id);
                } catch (err) {
                    console.error('Error while deleting excluded days: ', err);
                }
            }
            console.log(`------[INFO] Suppression manuel planning ID ${line[0].id}, date ${line[0].date}, client ${line[0].client_name} | Supprimé par ${req.session.user.username} -------`);
            planningDb.prepare('DELETE FROM planning WHERE id = ?').run(data[i].id);
        } catch (err) {
            console.error('Error while deleting data: ', err);
            res.status(500).send('Internal server error');
            break;
        }
    }
    if (error) {
        return;
    }
    res.status(200).send('Data deleted');
}