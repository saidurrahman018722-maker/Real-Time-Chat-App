import express from "express";



const router = express.Router();

router.post("/api/send",sendMessage)


export default router;