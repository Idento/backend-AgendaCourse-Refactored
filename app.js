import './logger.js'
import express, { json } from 'express';
import homeroute from './routes/home.js';
import planningRouter from './routes/planning.js';
import driverRouter from './routes/driver.js';
import settingsRouter from './routes/settings.js';
import loginRouter from './routes/login.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createTable } from './lib/maindb.js';
import { createUserTable } from './lib/userdb.js';
import { createSavedTable } from './lib/savedb.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkOldPlanning, checkPlanningRecurrence } from './services/PlanningService.js';
import { checkRecurrenceStartDates } from './services/ReccurenceService.js';
import { savePlanning } from './services/ArchiveService.js';
import dotenv from 'dotenv';
import helmet from 'helmet';
dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
}))
export const sessionMiddleware = session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true,
        maxAge: 14400000
    }
})
app.set('trust proxy', 1)
export const corsOptions = cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
})
app.use(corsOptions)
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'dist')));

createTable();
createUserTable();
createSavedTable();
checkRecurrenceStartDates()
checkOldPlanning()
checkPlanningRecurrence()
savePlanning()

app.use(json());

app.use('/api/', loginRouter)
app.use('/api/Home', homeroute)
app.use('/api/Plannings', planningRouter);
app.use('/api/Planningsdeschauffeurs', driverRouter);
app.use('/api/parametres', settingsRouter);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

export default app;