import { Router } from 'express'
import { onboardOrganisation, register, login } from '../controllers/authController.js'

const router = Router()

router.post('/onboard', onboardOrganisation)
router.post('/register', register)
router.post('/login', login)

export default router