import { addPlanning, deletePlanning, getPlanning, modifyPlanning } from '../services/PlanningService.js';
import { addNoteWithDate, getSingleNotesWithDate } from '../services/NoteService.js';

/**
 * @route   GET home/
 * @desc    Récupère toutes les course d'aujourd'hui
 * @access  private
 * @output  [
 *              {driver_id: 5, ...course},
 *              {driver_id: 5, ...course}
 *          ]
 * @logic   -Récupère toutes les courses d'aujourd'hui
 */
export const GetHomeData = async function (req, res) {
    try {
        const data = await getPlanning()
        console.log('getHomedata', data);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json('Aucun planning trouvé');
    }
}

/**
 * @route   GET home/getNotes
 * @desc    Récupère la note d'aujourd'hui
 * @access  private
 * @input   Body {String} date - Date voulu pour la récupération de la note
 * @output  [
 *              'Note de la journée'
 *          ]
 * @logic   - Envoie des notes en JSON
 */
export const GetHomeNotes = async function (req, res) {
    const { date } = req.body;
    try {
        const data = await getSingleNotesWithDate(date);
        console.log('getHomeNotes', data);
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}

/**
 * @route   POST home/addNote
 * @desc    Ajoute une note ou modifie la note existante de la date en question
 * @access private
 * @input   Body {
 *              date: '25/05/2025',
 *              note: 'note de la journée'                 
 *              }
 * @output 'Data added'
 * @logic   - Met a jour la note ou insère si inexistante
 * @example
 */
export const AddHomeNote = async function (req, res) {
    const { note, date } = req.body;
    try {
        const data = await addNoteWithDate(date, note)
        console.log('addhomenote id added', data);
        res.status(200).send('Data added');
    } catch (err) {
        console.error('Error while adding data: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }

}

/**
 * @route   POST home/addData
 * @desc    Ajoute une course
 * @access private
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
 * @output  {id: 1} ou 'data added'
 * @logic   - Ajoute une course au planning (Possibilité d'ajouté plusieurs courses en même temps si le frontend évolue)
 */
export const DataToAdd = async function (req, res) {
    const { data } = req.body;
    console.log(data);
    try {
        const added = await addPlanning(data)
        console.log('data added to planning', added);
        res.status(200).send('Data added');
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        return;
    }

}

/**
 * @route   POST home/modifyData
 * @desc    Met a jour une course
 * @access private
 * @input   BODY { data: 
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
 *                }
 *              
 * @output  {id: 1} ou 'data added'
 * @logic   - Ajoute une course au planning (Possibilité d'ajouté plusieurs courses en même temps si le frontend évolue)
 */
export const modifyHomeData = async (req, res) => {
    const { data } = req.body
    try {
        const result = await modifyPlanning(data)
        console.log('modifyHomeData', result);
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
 * @access private
 * @input Body { data: {
 *                       id:1 , 
 *                       deleteRecurrence: false || true
 *                     }
 *              }
 * @output  - 'Data deleted'
 * @logic   - Supprime une course et en fonction de deleteRecurrence, sa recurrence aussi, si existante.
 */
export const DeleteData = async function (req, res) {
    const { data } = req.body;
    try {
        await deletePlanning(data)
        res.status(200).send('Data deleted');
    } catch (err) {
        console.error('Error while adding data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}