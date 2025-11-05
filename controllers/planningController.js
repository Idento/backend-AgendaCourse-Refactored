import { addPlanning, deletePlanning, getPlanning, modifyPlanning } from "../services/PlanningService.js";
import { modifyOrAddNote, getWeekNotes } from "../services/NoteService.js";

/**
 * @route   GET plannings/get
 * @desc    Récupère toutes les courses de la semaine a partir de demain
 * @output  [
 *              {driver_id: 5, ...course},
 *              {driver_id: 5, ...course}
 *          ]
 * @logic   -Renvoie un tableau d'objet contenant date, courses de la journée et chauffeur
 * @access  private
 */
export const GetPlanning = async function (req, res) {
    try {
        const data = await getPlanning(true)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching planning: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }
}


/**
 * @route   POST plannings/getByDate
 * @desc    Récupère toutes les course de la semaine a partir de la date sélectionner
 * @input   BODY {date:'25/05/2025'}
 * @output  [
 *              { ...course, ...driver},
 *              { ...course, ...driver}
 *          ]
 * @logic  -Renvoie un tableau d'objet contenant date, courses de la journée et chauffeur
 * @access  private
 */
export const GetPlanningNextDates = async function (req, res) {
    const { date } = req.body;
    try {
        const data = await getPlanning(true, date)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching planning: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }
}


/**
 * @route   POST plannings/getNotes
 * @desc    Récupère toutes les courses de la semaine
 * @access  private
 * @input   BODY {dates: ['25/05/2025', '26/05/2025']}
 * @output  [
 *              {dates: '25/05/2025', notes:''},
 *              {dates: '26/05/2025', notes:''}
 *          ]
 * @logic   -Récupère toutes les notes de la semaines
 */
export const GetPlanningNotes = async function (req, res) {
    const { dates } = req.body;
    try {
        const data = await getWeekNotes(dates)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching notes: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }
}

/**
 * @route   POST plannings/addNote
 * @desc    Ajoute ou modifie une note de la semaine
 * @access  private
 * 
 * @input   {date: 25/05/2025, notes:'pensez a ca'}
 * @output  'note added'
 * @logic   - Ajoute une note au jour de la semaine mentionner
 * 
 */
export const AddPlanningNotes = async function (req, res) {
    const { date, note } = req.body;

    try {
        await modifyOrAddNote(date, note)
        res.status(200).send('Notes added');
    }
    catch (err) {
        console.error('Error while adding notes: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }
}

/**
 * @route   POST plannings/add
 * @desc    Récupère toutes les course de la semaine a partir de la date sélectionner
 * @access  private
 * @input   BODY {
 *                  data:[
 *                      {...course}
 *                  ]
 *              }
 * 
 * @output  'Planning added'
 * @logic   - Répond avec un string et ajoute en db la course (Possibilité d'ajouter plusieurs courses a la fois si le frontend est améliorer)
 */
export const AddPlanning = async function (req, res) {
    const { data } = req.body;
    try {
        console.log(`[AJOUT] Tentative d\'ajout d\'une course par ${req.session.user.username} avec les données:`, data);
        const added = await addPlanning(data)
        console.log(`[AJOUT] Donnée ajouté: ${JSON.stringify(added.success)}. Erreur: ${added.failed.length > 0 ? JSON.stringify(added.failed) : 0}`);
        res.status(200).send('Planning added');
    } catch (err) {
        console.error('Error while adding planning: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }
}

/**
 * @route   POST plannings/modify
 * @desc    Modifier une course existante
 * @access  private
 * @input   BODY {data: {...course}}
 * 
 * @output  'Planning modified'
 * @logic   - Répond avec un string et modifie en db la course
 */
export const modifyPlanningData = async (req, res) => {
    const { data } = req.body
    try {
        console.log(`[MODIFICATION] Modification initié par ${req.session.user.username} avec les données:`, data)
        const result = await modifyPlanning(data)
        console.log(`[MODIFICATION] Modification ${result}`);
        res.status(200).send('Planning modified');
    } catch (err) {
        console.error('Error while modifying planning: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }
}

/**
 * @route   DELETE plannings/delete
 * @desc    Supprimer une course de la semaine
 * @access  private
 * @input   BODY { 
 *              data: 
 *                  { id: 5, deleteRecurrence: false || true } 
 *               }
 * @output  'Planning deleted'
 * @logic   - Supprime une course et en fonction de deleteRecurrence, sa recurrence aussi, si existante.
 */
export const DeletePlanning = async function (req, res) {
    const { data } = req.body;
    try {
        console.log(`[SUPRESSION] Supression initié par ${req.session.user.username} avec les données:`, data)
        const result = await deletePlanning(data)
        console.log(`[SUPRESSION] Supression ${result}`);
        res.status(200).send('Planning deleted');
    } catch (err) {
        console.error('Error while deleting planning: ', err.stack);
        res.status(500).send('Internal server error');
        return;
    }
}