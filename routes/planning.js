import express from 'express';
import { Router } from 'express';
import { GetPlanning, AddPlanning, DeletePlanning, GetPlanningNotes, AddPlanningNotes, GetPlanningNextDates, modifyPlanningData } from '../controllers/planningController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';


const router = Router();

router.get('/get', isAuthentified, GetPlanning);
router.post('/getByDate', isAuthentified, GetPlanningNextDates);
router.post('/add', isAuthentified, AddPlanning);
router.post('/modify', isAuthentified, modifyPlanningData)
router.delete('/delete', isAuthentified, DeletePlanning);
router.post('/getNotes', isAuthentified, GetPlanningNotes);
router.post('/addNote', isAuthentified, AddPlanningNotes);

export default router;
//REGARDER RECURRENCE START DATE QUI DOIT AVOIR CHANGER AVEC LE CHECK