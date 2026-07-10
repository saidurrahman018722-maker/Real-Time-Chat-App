import express from "express";
import { config } from "dotenv";
import authRoutes from "../src/routes/auth.route.js";
import messageRoutes from "../src/routes/message.route.js";
import { connectDB,disconnectDB } from "./config/db.js";
import {sessionMiddleware} from "../src/middlewares/session.middleware.js"
import path from "path"




config();
connectDB();
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const __dirname = path.resolve();

app.use(sessionMiddleware);
app.use('/auth/api',authRoutes)
app.use('/message/api',messageRoutes)

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
