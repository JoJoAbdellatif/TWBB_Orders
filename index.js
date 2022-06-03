const express= require('express');
const mongoose = require('mongoose');
const dotenv= require("dotenv");
const orderRoutes = require('./routes/orderRoutes');

const app = express();
dotenv.config();
require('./config/dbconnect')();


app.use(express.json());

app.use('/api/orders',orderRoutes)

const PORT = process.env.PORT||6000;

app.listen(PORT,(req , res)=>{
    console.log(`Server is Up and Running ${PORT}`);
});