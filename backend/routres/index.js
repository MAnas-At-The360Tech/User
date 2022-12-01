import express from 'express'
const router = express.Router()
import { signInController } from '../Controllers';

router.post('/signin', signInController.adduser)
    
export default router;