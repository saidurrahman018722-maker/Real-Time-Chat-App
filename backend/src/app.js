import express from "express";
import { config } from "dotenv";
import authRoutes from "../src/routes/auth.route.js";
import messageRoutes from "../src/routes/message.route.js";




config();
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/auth',authRoutes)
app.use('/message',messageRoutes)

app.listen(process.env.PORT || 3000,()=>{
    console.log(`the server is running on the port ${process.env.PORT}`);
})
