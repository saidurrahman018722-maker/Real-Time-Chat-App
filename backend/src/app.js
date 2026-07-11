import express from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "dotenv";
import authRoutes from "../src/routes/auth.route.js";
import messageRoutes from "../src/routes/message.route.js";
import { sessionMiddleware } from "../src/middlewares/session.middleware.js";
import { shieldMiddleware } from "../src/middlewares/shield.middleware.js";
import { botDetectionMiddleware } from "../src/middlewares/botDetection.middleware.js";
import path from "path";
import { connectDB } from "./config/db.js";



config();
connectDB();
const app = express();

// Trust Cloudflare / Proxy headers to ensure req.ip contains the real user's IP instead of Cloudflare's IP
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const __dirname = path.resolve();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(botDetectionMiddleware);
app.use(shieldMiddleware);

app.use(sessionMiddleware);
app.use('/auth/api', authRoutes);
app.use('/message/api', messageRoutes);

//after all the routes 
if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname,'../frontend/dist')))

    app.get("*",(req,res)=>{
        res.sendFile(path.join(__dirname,'../frontend/dist/index.html'))
    })

}

app.listen(process.env.PORT || 3000,()=>{
    console.log(`the server is running on the port ${process.env.PORT}`);
})
