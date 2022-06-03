const express = require('express');
require("dotenv").config()
const asyncHandler = require('express-async-handler')
const Order = require('../models/order')
const orderRoute = express.Router();
const URL = 'http://localhost:8000/api/carts/';
const URLinventory = 'http://localhost:5000/api/product/';
const axios = require('axios');
const stripe =  require('stripe')(process.env.STRIPE_PRIVATE_KEY)
const order = require('../models/order');




//Create Order
orderRoute.post('/createOrder',asyncHandler(async(req,res) =>{
    const cartId= req.query.cartID
  
    let url = URL+"emptyCart"+"?cartID="+cartId

    const items = await axios.delete(url)
    const {Address:{City,District,StreetName,BuildingNo,Floor,ApartmentNo},PhoneNumber,UserId,Email}=  req.body
    
    const order = await Order.create({Items:items.data,Address:{City,District,StreetName,BuildingNo,Floor,ApartmentNo},PhoneNumber:PhoneNumber,UserId:UserId,Email:Email})
    console.log(order);
    const t =Object.assign(items.data)
    
    var purchacelist=[];
    for (let i = 0; i < t.length; i++) {
        const price = await axios.get(URLinventory+"price/"+t[i].ProductId)
        const detail = await axios.get(URLinventory+"details/"+t[i].ProductId)
        const prPrice =Object.assign(price.data)
        const prdetail =Object.assign(detail.data)
        const obj = {'ProductID':t[i].ProductId,'ProductName':prdetail.productName,'Productprice':prPrice.productPrice,'Quantity':t[i].Quantity}
        const ob1 = {
            price_data: {
              currency: "egp",
              product_data: {
                name: prdetail.productName,
              },
              unit_amount: prPrice.productPrice,
            },
            quantity: t[i].Quantity,
          }
        purchacelist.push(ob1)
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: purchacelist,
          success_url: `http://localhost:3000/success.html`,
          cancel_url: `http://localhost:3000/fail.html`,
        })
        res.json({ url: session.url })
      } catch (e) {
        res.status(500).json({ error: e.message })
      }
 
    
    

    }
))

orderRoute.get('/getOrderHistory/:id', asyncHandler(async(req , res) => {
    const userId = req.params.id;

    const orders = await order.find({UserId : userId}).then(json => {
        res.send(json)
    })
}))

orderRoute.get('/getOrder/:id', asyncHandler(async(req , res) => {
  const orderId = req.params.id;

  const orders = await order.findOne({_id : orderId}).then(json => {
      res.send(json)
  })
}))

orderRoute.patch('/cancelOrder/:id',asyncHandler(async(req,res)=>{
    const orderExist = await order.findOne({ _id:req.params.id});
    const updates = req.body;
    if(!orderExist){
        throw new Error('Order does not exist');
    }
    else{
        order.updateOne({_id: req.params.id},{$set: {"Status":"Cancelled"}})
        .then(result => {
            res.status(200).json(result)
        })
        .catch(err => {
            res.status(500).json({error:'Could not update the document'})
        })
    }
}))



module.exports = orderRoute;