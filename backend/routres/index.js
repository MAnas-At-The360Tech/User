import express from 'express'
const router = express.Router()
import UserController from '../Controllers/UserController';

router.post('/signin', UserController.signIn)
router.post('/refresh', UserController.refresh)
router.post('/login', UserController.login)
router.post('/logout', UserController.logout)

export default router;