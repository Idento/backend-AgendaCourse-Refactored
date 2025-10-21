import bcrypt from "bcrypt";
import { db } from "../lib/allDb.js";

const userDb = db.users;

export const authenticate = async (req, res, next) => {
    const { username, password } = req.body;
    const user = userDb.prepare('SELECT * FROM user WHERE username = ?').get(username);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = { id: user.id, username: user.username, role: user.role };
        next();
    } else {
        res.status(401).json({ message: 'Authentication failed' });
    }
};