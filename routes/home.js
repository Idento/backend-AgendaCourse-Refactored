import express from 'express';
import { Router } from 'express';
import { GetHomeData, DataToAdd, DeleteData, GetHomeNotes, AddHomeNote, modifyHomeData } from '../controllers/homeController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';



const router = Router();

router.get('/', isAuthentified, GetHomeData);
router.post('/addData', isAuthentified, DataToAdd);
router.post('/modifyData', isAuthentified, modifyHomeData)
router.delete('/deleteData', isAuthentified, DeleteData);
router.post('/getNotes', isAuthentified, GetHomeNotes);
router.post('/addNote', isAuthentified, AddHomeNote);

export default router;