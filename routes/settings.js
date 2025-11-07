import express, { Router } from 'express';
import {
    GetDrivers,
    ModifyDrivers,
    DeleteDrivers,
    AddDrivers,
    DeleteAccount,
    GetHistoryData,
    ModifyAccount,
    createUser,
    changePassword,
    regenPassword,
    CheckUserName,
    getUsers
} from '../controllers/settingsController.js';
import { isAuthAndAdmin, isAuthentified } from '../middlewares/sessionCheck.js';


const router = Router();

router.get('/get', isAuthentified, GetDrivers);
router.get('/getUser', isAuthentified, getUsers);
router.post('/getHistory', isAuthentified, GetHistoryData); //done
router.post('/CheckName', isAuthentified, CheckUserName); //done
router.post('/add', isAuthentified, AddDrivers); //done
router.post('/addAccount', isAuthAndAdmin, createUser); //done
router.post('/modify', isAuthentified, ModifyDrivers); //done
router.post('/modifyAccount', isAuthentified, ModifyAccount); //done
router.post('/changePassword', isAuthentified, changePassword); //done
router.post('/regeneratePassword', isAuthAndAdmin, regenPassword); //done
router.delete('/delete', isAuthentified, DeleteDrivers); //done
router.delete('/deleteAccount', isAuthAndAdmin, DeleteAccount); //done

export default router;