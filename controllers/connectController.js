/**
 * @route   POST /login
 * @desc    Répond a la demande de login si celle ci est positive et fourni les information de session
 * @output  { message: 'Logged in successfully', session: req.session }
 * @logic   - Répond a la demande de login positive avec infos
 */
export const login = async (req, res) => {
    res.json({ message: 'Logged in successfully', session: req.session });
}

/**
 * @route   POST /logout
 * @desc    Supprime les informations de session pour déconnecter l'utilisateur
 * @output  { message: 'Logged out successfully' }
 * @logic   - Supression des informations de sessions
 *          - Réponse string
 */
export const logout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error while destroying session: ', err);
            res.status(500).send('Internal server error');
            return;
        }
    });
    res.json({ message: 'Logged out successfully' });
}

/**
 * @route   GET /session
 * @desc    Fourni les information de session si l'utilisateur est connecté
 * @output  { session: req.session.user.username, role: req.session.user.role }
 * @logic   - Répond avec les information de sessions
 */
export const sessionInfo = async (req, res) => {
    res.json({ session: req.session.user.username, role: req.session.user.role });
}

