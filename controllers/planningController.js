import Database from "better-sqlite3";
import { format, parse, addDays } from "date-fns";
import { retrieveDate, retrieveDateFromDate } from "../utils/retrieveDate.js";
import { checkAll } from "../utils/checkAll.js";
import { fr } from "date-fns/locale";
import { checkNextDate } from "../utils/checkNextDate.js";
import { db } from "../utils/allDb.js";

/**
 * @route   GET plannings/get
 * @desc    Récupère toutes les course de la semaine suivante
 * @output  [
 *              {driver_id: 5, ...course},
 *              {driver_id: 5, ...course}
 *          ]
 * @logic   -Récupère tous les jours de la semaine a partir de demain
 *          -Récupère tous les chauffeurs
 *          -Récupère toutes les courses de la semaine
 *          -Combine les courses et les chauffeurs dans les journées
 *          -Renvoie un tableau d'objet contenant date, courses de la journée et chauffeur
 * @depends mainDB
 * @access  private
 */
export const GetPlanning = function (req, res) {
    let allWeekDays = retrieveDate();
    const planningDb = db.planning;
    let error = false
    let drivers;
    try {
        drivers = { drivers: planningDb.prepare('SELECT * FROM driver').all() };
    } catch (err) {
        console.error('Error while fetching drivers: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    for (let i = 0; i < allWeekDays.length; i++) {
        try {
            const data = planningDb.prepare(`SELECT p.*, r.frequency
                            FROM planning p
                            LEFT JOIN recurrence r ON p.recurrence_id = r.id
                            WHERE p.date = ?`).all(allWeekDays[i]);
            allWeekDays[i] = { date: allWeekDays[i], data: [...data, drivers] }
        } catch (err) {
            console.error('Error while fetching planning: ', err);
            res.status(500).send('Internal server error');
            error = true
            break;
        }
    }
    if (error) {
        return
    }
    res.status(200).json(allWeekDays);
}


/**
 * @route   POST plannings/getByDate
 * @desc    Récupère toutes les course de la semaine a partir de la date sélectionner
 * @input   BODY {date:'25/05/2025'}
 * @output  [
 *              { ...course, ...driver},
 *              { ...course, ...driver}
 *          ]
 * @logic   -Récupère tous les jours de la semaine a partir de la date recu
 *          -Récupère tous les chauffeurs
 *          -Récupère toutes les courses de la semaine
 *          -Combine les courses et les chauffeurs dans les journées
 *          -Renvoie un tableau d'objet contenant date, courses de la journée et chauffeur
 * @depends mainDB
 * @access  private
 */
export const GetPlanningNextDates = function (req, res) {
    const { date } = req.body;
    const planningDb = db.planning;
    let allWeekDays = retrieveDateFromDate(date);
    let error = false
    let drivers;
    try {
        drivers = { drivers: planningDb.prepare('SELECT * FROM driver').all() };
    } catch (err) {
        console.error('Error while fetching drivers: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    for (let i = 0; i < allWeekDays.length; i++) {
        try {
            const data = planningDb.prepare(`SELECT p.*, r.frequency
                            FROM planning p
                            LEFT JOIN recurrence r ON p.recurrence_id = r.id
                            WHERE p.date = ?`).all(allWeekDays[i]);
            allWeekDays[i] = { date: allWeekDays[i], data: [...data, drivers] }
        } catch (err) {
            console.error('Error while fetching planning: ', err);
            res.status(500).send('Internal server error');
            error = true
            break;
        }
    }
    res.status(200).json(allWeekDays);
}


/**
 * @route   POST plannings/getNotes
 * @desc    Récupère toutes les course de la semaines
 * @input   BODY {dates: ['25/05/2025', '26/05/2025']}
 * @output  [
 *              {dates: '25/05/2025', notes:''},
 *              {dates: '26/05/2025', notes:''}
 *          ]
 * @logic   -Récupère tous les jours de la semaine dans le body
 *          -Récupère toutes les notes de la semaines
 * @depends mainDB
 * @access  private
 */
export const GetPlanningNotes = function (req, res) {
    const planningDb = db.planning;
    const { dates } = req.body;
    let data = [];
    for (const date of dates[0]) {
        try {
            const notes = planningDb.prepare('SELECT * FROM notes WHERE date = ?').all(date);
            if (notes.length > 0) {
                data.push({ dates: date, notes: notes[0].note });
            } else {
                data.push({ dates: date, notes: '' });
            }
        } catch (err) {
            console.error('Error while fetching notes: ', err);
            res.status(500).send('Internal server error');
            return;
        }
    }
    res.status(200).json(data);
}

/**
 * @route   POST plannings/addNote
 * @desc    Ajoute ou modifie une note de la semaine
 * @input   {date: 25/05/2025, notes:'pensez a ca'}
 * @output  'note added'
 * @logic   -Récupère tous les jours de la semaine a partir de demain
 *          -Récupère toutes les courses de la semaine
 * @depends mainDB
 * @access  private
 */
export const AddPlanningNotes = function (req, res) {
    const planningDb = db.planning;
    const { date, note } = req.body;
    let error = false;
    try {
        const existingNote = planningDb.prepare('SELECT * FROM notes WHERE date = ?').get(date);
        if (existingNote) {
            planningDb.prepare('UPDATE notes SET note = ? WHERE date = ?').run(note, date);
        } else {
            planningDb.prepare('INSERT INTO notes (date, note) VALUES (?, ?)').run(date, note);
        }
    }
    catch (err) {
        console.error('Error while adding notes: ', err);
        res.status(500).send('Internal server error');
        error = true
        return;
    }
    res.status(200).send('Notes added');
}

/**
 * @route   POST plannings/add
 * @desc    Récupère toutes les course de la semaine a partir de la date sélectionner
 * @input   BODY {
 *                  alldata:[
 *                      {...course}
 *                  ]
 *              }
 * 
 * @output  'Planning added'
 * @logic   -Récupère tous les jours de la semaine a partir de la date suivante si 
 *              celle ci dans les data sinon on recherche a partir de la première date envoyé
 *          -Récupère le planning a partir des dates récupérer
 *          -stockage des ids des plannings récupérer
 *          -Itèrer sur le tableau de donnée recu, extraction des données et formatage de la fréquence:
 *              string tableau => tableau
 *              -Comparaison de l'id de la donnée itérer avec celles du planning extraite de la bdd
 *                  Si la course existe dans le planning, on la modifie (également calcul recurrence au cas ou celle ci ai changer)
 *                  Sinon on ajoute la course et on calcul la récurrence si présente
 *          -Répond avec un string
 * @depends mainDB
 * @access  private
 */
export const AddPlanning = function (req, res) {
    const { alldata } = req.body;
    const planningDb = db.planning;
    let allWeekDays = retrieveDate();
    if (!allWeekDays.includes(alldata[0].date)) {
        allWeekDays = retrieveDateFromDate(alldata[0].date);
    }
    let ids = [];
    let error = false;
    let datadb = [];
    let haveRecurrence = false;
    try {
        const data = planningDb.prepare('SELECT * FROM planning WHERE date IN (' + allWeekDays.map(() => '?').join(',') + ')').all(...allWeekDays);
        datadb = [...datadb, ...data];
        ids = data.map(item => item.id);
    } catch (err) {
        console.error('Error while fetching planning: ', err);
        error = true;
    }
    for (let i = 0; i < alldata.length; i++) {
        const { id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id, frequency } = alldata[i]; // Destructure the data
        const frequencyFormated = typeof frequency === 'string' ? JSON.parse(frequency) : typeof frequency === 'number' ? [frequency] : frequency; // Parse the frequency
        let reccurence_id = null;
        if (ids.includes(id)) {
            const actualLine = datadb.filter((item) => item.id === id);
            if (frequency.length > 0 || (actualLine[0].recurrence_id !== null && actualLine[0].recurrence_id !== 0)) {
                haveRecurrence = true;
            }
            const oldFrequency = planningDb.prepare('SELECT frequency FROM recurrence WHERE id = ?').get(actualLine[0].recurrence_id);
            if (!oldFrequency && frequency.length > 0) {
                const formatRecurrence = recurrence_id === null ? 0 : recurrence_id;
                reccurence_id = checkNextDate(date, frequencyFormated, formatRecurrence, id);
            } else if (oldFrequency?.frequency !== frequency.toString()) {
                const formatRecurrence = recurrence_id === null ? 0 : recurrence_id;
                reccurence_id = checkNextDate(date, frequencyFormated, formatRecurrence, id);
            }
            try {
                planningDb.prepare(`UPDATE planning SET driver_id = ?, date = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ?, recurrence_id = ? WHERE id = ?`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id, id);
            } catch (err) {
                console.error('Error while updating planning: ', err);
                res.status(500).send('Internal server error');
                error = true
                break;
            }
        } else {
            let reccurence_id;
            reccurence_id = checkNextDate(date, frequencyFormated, 0, 0);
            if (frequency.length > 0) {
                haveRecurrence = true;
            }
            try {
                planningDb.prepare(`INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(parseInt(driver_id), date, client_name, start_time, return_time, note, destination, `${long_distance}`, reccurence_id);
                console.log(`------[INFO] Ajout planning ID ${id}, date ${date}, client ${client_name} | Ajouté par ${req.session.user.username} -------`);
            } catch (err) {
                console.error('Error while adding planning: ', err);
                res.status(500).send('Internal server error');
                error = true
                break;
            }
        }
    }
    if (haveRecurrence) {
        console.log('Checking all recurrences...');
        checkAll();
    }
    res.status(200).send('Planning added');
}

export const modifyPlanningData = async (req, res) => {

}

/**
 * @route   DELETE plannings/delete
 * @desc    Supprimer une course de la semaine
 * @input   BODY {
 *                  data:[
 *                      {...course}
 *                  ]
 *              }
 * 
 * @output  'Planning deleted'
 * @logic   -Récupère les données de l'input 
 *          -Recherche la course concerné dans la db
 *          -Condition de suppression:
 *              Si il y a une id de recurrence et pas d'intention de supression de recurrence:
 *                  Si la date de la course a supprimer est dans le tableau de recurrences (nextday)
 *                      - Recalcule de la récurrence
 *                  Sinon si pas dans le tableau de recurrences mais recurrente quand même
 *                      - Ajout de la date dans la db des jours exclus
 *              Sinon si on dois supprimer la recurrence
 *                  - Récupération de toutes les courses ayant l'id de la récurrence
 *                  - Itération sur celles ci:
 *                      Si la date est inférieur a la date de course qu'on veux supprimer
 *                          - Modification de l'id de reccurence de la course a 0
 *                      Sinon
 *                          - Supression de la course
 *                  - Supression de la recurrence dans la db recurrence
 *                  - Supression de la recurrence dans la db des jours exclus
 *              - Supression de la course envoyé par l'utilisateur
 *          - Réponse envoyé
 * @depends mainDB
 * @access  private
 */
export const DeletePlanning = function (req, res) {
    const { data } = req.body;
    const planningDb = db.planning;
    let error = false;
    for (let i = 0; i < data.length; i++) {
        try {
            const line = planningDb.prepare('SELECT * FROM planning WHERE id = ?').all(data[i].id);
            if (line[0]?.recurrence_id && !data[i].deleteRecurrence && line[0].recurrence_id !== undefined || line[0].recurrence_id !== null || line[0].recurrence_id !== 0) {
                let recurrence
                try {
                    recurrence = planningDb.prepare('SELECT * FROM recurrence WHERE id = ?').get(line[0].recurrence_id);
                } catch (err) {
                    recurrence = null
                    console.error('Error while fetching recurrence: ', err);
                }
                if (recurrence && line[0].date === recurrence?.next_day) {
                    const frequencyFormated = typeof recurrence.frequency === 'string' ? JSON.parse(recurrence.frequency) : typeof recurrence.frequency === 'number' ? [recurrence.frequency] : recurrence.frequency;
                    checkNextDate(recurrence.next_day, frequencyFormated, line[0].recurrence_id, line[0].id);
                } else if (recurrence && line[0].date !== recurrence?.next_day && line[0].date !== recurrence?.start_date) {
                    const excludeDays = planningDb.prepare('SELECT * FROM recurrence_excludedays WHERE recurrence_id = ?').all(line[0].recurrence_id);
                    if (excludeDays.length === 0) {
                        const data = [line[0].date]
                        planningDb.prepare('INSERT INTO recurrence_excludedays (recurrence_id, date) VALUES (?, ?)').run(line[0].recurrence_id, JSON.stringify(data));
                    }
                    else {
                        const data = JSON.parse(excludeDays[0].date);
                        if (!data.includes(line[0].date)) {
                            data.push(line[0].date);
                            planningDb.prepare('UPDATE recurrence_excludedays SET date = ? WHERE recurrence_id = ?').run(JSON.stringify(data), line[0].recurrence_id);
                        }
                    }
                }
            }
            if (data[i].deleteRecurrence) {
                const allRecurrence = planningDb.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(line[0].recurrence_id)
                allRecurrence.map((planning) => {
                    if (parse(planning.date, 'dd/MM/yyyy', new Date(), { locale: fr }) < parse(line[0].date, 'dd/MM/yyyy', new Date(), { locale: fr })) {
                        planningDb.prepare('UPDATE planning SET recurrence_id = ? WHERE id = ?').run(0, planning.id);
                    } else {
                        console.log(`------[INFO] Suppression planning ID ${planning.id}, date ${planning.date}, client ${planning.client_name} | Supprimé par ${req.session.user.username} -------`);
                        planningDb.prepare('DELETE FROM planning WHERE id = ?').run(planning.id)
                    }
                })
                planningDb.prepare('DELETE FROM recurrence WHERE id = ?').run(line[0].recurrence_id);
                planningDb.prepare('DELETE FROM recurrence_excludedays WHERE recurrence_id = ?').run(line[0].recurrence_id);
            }
            console.log(`------[INFO] Suppression manuel planning ID ${line[0].id}, date ${line[0].date}, client ${line[0].client_name} | Supprimé par ${req.session.user.username} -------`);
            planningDb.prepare('DELETE FROM planning WHERE id = ?').run(data[i].id);
        } catch (err) {
            console.error('Error while deleting planning: ', err);
            res.status(500).send('Internal server error');
            error = true
            break;
        }
    }
    checkAll();
    res.status(200).send('Planning deleted');
}