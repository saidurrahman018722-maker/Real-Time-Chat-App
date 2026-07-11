import { Router } from "express";
import {
  login,
  getDevices,
  revokeDevice,
  logout,
  OtpVerification,
  UserRegistration,
  updateProfile,
  getUser,
  verifyEmailToken,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  loginSchema,
  registrationSchema,
  optSchema,
  updateProfileSchema,
} from "../validators/auth.validators.js";
import {
  strictLimiter,
  standardLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply standard rate limiting to all auth routes
router.use(standardLimiter);
router.post(
  "/register",
  strictLimiter,
  validateRequest(registrationSchema),
  UserRegistration
);
router.post("/opt-verification", validateRequest(optSchema), OtpVerification);
router.get("/verify-email/:token", verifyEmailToken);
router.post("/login", strictLimiter, validateRequest(loginSchema), login);
router.get("/devices", getDevices);
router.delete("/devices/:id", revokeDevice);
router.post("/logout", logout);

router.post(
  "/update-profile",
  authMiddleware,
  validateRequest(updateProfileSchema),
  updateProfile
);
router.get("/check", authMiddleware, getUser);

export default router;
