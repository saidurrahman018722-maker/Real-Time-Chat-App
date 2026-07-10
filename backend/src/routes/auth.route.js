import { Router } from 'express';
import { login, getDevices, revokeDevice, logout } from "../controllers/auth.controller.js"
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginSchema, registrationSchema, optSchema} from '../validators/auth.validators.js';
import { OtpVerification, UserRegistration } from '../controllers/auth.controller.js';
import { strictLimiter, standardLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Apply standard rate limiting to all auth routes
router.use(standardLimiter);
router.post("/register", strictLimiter, validateRequest(registrationSchema), UserRegistration)
router.post('/opt-verification', validateRequest(optSchema), OtpVerification)
router.post('/login', strictLimiter, validateRequest(loginSchema), login);
router.get('/devices', getDevices);
router.delete('/devices/:id', revokeDevice);
router.post('/logout', logout);

export default router;