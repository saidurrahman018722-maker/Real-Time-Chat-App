import express from "express";


const router = express.Router();

router.post("/api/register",register)
router.post("api/login",login)
router.post("api/logout",logout)
router.get("api/profile",profile)

export default router;