import { addDays, format, parse } from 'date-fns';
import Database from 'better-sqlite3';
import { frequentHomeUpdate } from '../utils/frequentUpdate.js';
import { checkAll } from '../utils/checkAll.js';
import { fr } from 'date-fns/locale';
import { json } from 'express';
import { checkNextDate } from '../utils/checkNextDate.js';
import { db } from '../utils/allDb.js';
import { addPlanning, deletePlanning, getPlanning, modifyPlanning } from '../services/PlanningService.js';
import { addNoteWithDate, getSingleNotesWithDate } from '../services/NoteService.js';

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
    try {
        const data = getPlanning()
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json('Aucun planning trouvé');
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
    const { date } = req.body;
    try {
        const data = getSingleNotesWithDate(date);
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
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
        addNoteWithDate(date, note)
        res.status(200).send('Data added');
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        return;
    }

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
    try {
        addPlanning(data)
        res.status(200).send('Data added');
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        return;
    }

}

export const modifyHomeData = async (req, res) => {
    const { data } = req.body
    try {
        modifyPlanning(data)
        res.status(200).send('Data modified');
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        deletePlanning(data)
        res.status(200).send('Data deleted');
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}