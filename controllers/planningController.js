import { addPlanning, deletePlanning, getPlanning, modifyPlanning } from "../services/PlanningService.js";
import { modifyOrAddNote, getWeekNotes } from "../services/NoteService.js";

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
export const GetPlanning = async function (req, res) {
    try {
        const data = await getPlanning(true)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching planning: ', err);
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
 * @logic   -Récupère tous les jours de la semaine a partir de la date recu
 *          -Récupère tous les chauffeurs
 *          -Récupère toutes les courses de la semaine
 *          -Combine les courses et les chauffeurs dans les journées
 *          -Renvoie un tableau d'objet contenant date, courses de la journée et chauffeur
 * @depends mainDB
 * @access  private
 */
export const GetPlanningNextDates = async function (req, res) {
    const { date } = req.body;
    try {
        const data = await getPlanning(true, date)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching planning: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
export const GetPlanningNotes = async function (req, res) {
    const { dates } = req.body;
    try {
        const data = await getWeekNotes(dates)
        console.log('note planning', data);
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching notes: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
export const AddPlanningNotes = async function (req, res) {
    const { date, note } = req.body;
    console.log(note);

    try {
        await modifyOrAddNote(date, note)
        res.status(200).send('Notes added');
    }
    catch (err) {
        console.error('Error while adding notes: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
export const AddPlanning = async function (req, res) {
    const { data } = req.body;
    try {
        await addPlanning(data)
        res.status(200).send('Planning added');
    } catch (err) {
        console.error('Error while adding planning: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}

export const modifyPlanningData = async (req, res) => {
    const { data } = req.body
    try {
        await modifyPlanning(data)
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
export const DeletePlanning = async function (req, res) {
    const { data } = req.body;
    try {
        await deletePlanning(data)
        res.status(200).send('Planning deleted');
    } catch (err) {
        console.error('Error while deleting planning: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}