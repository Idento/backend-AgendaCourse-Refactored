import { getAllDrivers } from "../services/DriverService.js";
import { getDriverPlanningByDateService } from "../services/PlanningService.js";


/**
 * @route   GET driver/get
 * @desc    Récupère tous les chauffeurs
 * @access private
 * @output  [
 *              {driver_id: }
 *          ]
 * @logic   -Récupère tous les chauffeurs
 */
export const GetDriverData = async function (req, res) {
    try {
        const data = await getAllDrivers()
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}

/**
 * @route   get driver/getdriver/:id
 * @desc    Récupère toutes les courses d'un chauffeur a partir de son id et de la date d'aujourd'hui
 * @input   Params {
 *              id: number
 *          }
 * @output  [
 *              [{driver_id: 5}]
 *          ]
 * @logic   - Renvoie les données dans un tableau
 */
export const GetDriverPlanning = async function (req, res) {
    const { id } = req.params;
    try {
        const data = await getDriverPlanningByDateService(id);
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }

}

/**
 * @route   POST driver/getdriverplanning/:id
 * @desc    Récupère les courses a partir de l'id d'un chauffeur et d'une date spécifique
 * @access  private
 * 
 * @input   Params {Number} id - Identification du chauffeur
 * @input   Body {String} date - Date voulu pour la récupération des courses
 * 
 * @output  [
 *              {driver_id: 5, ...course},
 *              {driver_id: 5, ...course}
 *          ]
 * @logic   - En fonction des input, récupèration du planning
 */

export const GetDriverPlanningByDate = async function (req, res) {
    const { id } = req.params;
    const { date } = req.body;
    try {
        const data = await getDriverPlanningByDateService(id, date)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}