const express= require('express');
const mongoose = require('mongoose');
const dotenv= require("dotenv");
const orderRoutes = require('./routes/orderRoutes');
const cors = require('cors')
const app = express();
dotenv.config();
require('./config/dbconnect')();

app.use(cors({origin: true, credentials: true}));
app.use(express.json());

app.use('/api/orders',orderRoutes)

const PORT = process.env.PORT||2000;

app.listen(PORT,(req , res)=>{
    console.log(`Server is Up and Running ${PORT}`);
});