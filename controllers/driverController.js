

/**
 * @route   GET driver/get
 * @desc    Récupère tous les chauffeurs depuis la bdd principale, table driver
 * @output  [
 *              {driver_id: }
 *          ]
 * @logic   - Récupère tous les conducteurs
 * @access private
 * @depends maindb
 */
export const GetDriverData = function (req, res) {
    const planningDb = db.planning;
    let data;
    try {
        data = planningDb.prepare('SELECT * FROM driver').all();
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).json(data);
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
 * @logic   - Récupère la date d'aujourd'hui
 *          - Récupère en bdd les informations en fonction des paramètres date et id
 *          - Renvoie les données dans un tableau
 * @errors  - "id invalide"
 */
export const GetDriverPlanning = function (req, res) {
    const planningDb = db.planning;
    const { id } = req.params;
    const date = format(new Date(), 'dd/MM/yyyy');
    let data = [];
    try {
        data.push(planningDb.prepare('SELECT * FROM planning WHERE driver_id = ? AND date = ?').all(id, date));
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).json(data);
}

/**
 * @route   POST driver/getdriverplanning/:id
 * @desc    Récupère les courses a partir de l'id d'un chauffeur et d'une date spécifique
 * @input   Params {Number} id - Identification du chauffeur
 * @input   Body {String} date - Date voulu pour la récupération des courses
 * @output  [
 *              {driver_id: 5, ...course},
 *              {driver_id: 5, ...course}
 *          ]
 * @logic   - Récupération de l'id du chauffeur dans les paramètres de la requête
 *          - Récupération de la date voulu dans le body, pour la recherche
 * @errors  ''
 * @access  private
 * @example 
 * POST /driver/getdriverplanning/:5
 * BODY {date: '25/05/2025'}
 */

export const GetDriverPlanningByDate = function (req, res) {
    const planningDb = db.planning;
    const { id } = req.params;
    const { date } = req.body;
    let data = [];
    try {
        data.push(planningDb.prepare('SELECT * FROM planning WHERE driver_id = ? AND date = ?').all(id, date));
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).json(data);
}