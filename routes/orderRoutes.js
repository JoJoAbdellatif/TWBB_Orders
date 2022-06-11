const express = require('express');
require("dotenv").config()
const asyncHandler = require('express-async-handler')
const Order = require('../models/order')
const orderRoute = express.Router();
const URL = 'http://localhost:8000/api/carts/';
const URLinventory = 'http://localhost:5000/api/product/';
const axios = require('axios');
const stripe =  require('stripe')(process.env.Stripe)
const order = require('../models/order');
const homeURL = 'http://localhost:3000/'
const decQuanURL = 'http://localhost:5000/api/product/quantAfterOrder?productId=' 
const updateUserEmailURL = 'http://localhost:4000/api/notify/update?orderId='
const createShipmentURL = 'http://localhost:7000/api/shipping/createShippment/'
const getShipmentURL = 'http://localhost:7000/api/shipping/'

//Create Order
orderRoute.patch('/createOrder',asyncHandler(async(req,res) =>{
    const cartId= req.query.cartID
    
    let url = URL+"emptyCart"+"?cartID="+cartId

    const items = await axios.delete(url)
    const {Address:{City,District,StreetName,BuildingNo,Floor,ApartmentNo},PhoneNumber,UserId,Email,AddressLink:{Latitude,Longitiude}}=  req.body
    
    const order = await Order.create({Items:items.data,Address:{City,District,StreetName,BuildingNo,Floor,ApartmentNo},PhoneNumber:PhoneNumber,AddressLink:{Latitude:Latitude,Longitiude:Longitiude},UserId:UserId,Email:Email})
    const t =Object.assign(items.data)
    const updateUserEmail = await axios.get(updateUserEmailURL+order._id)

    const shipment = await axios.post(createShipmentURL+order._id)
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
        console.log(decQuanURL+t[i].ProductId+'&productQuant=' + t[i].Quantity);
        const decQuan = await axios.patch(decQuanURL+t[i].ProductId+'&productQuant=' + t[i].Quantity)
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: purchacelist,
          success_url: homeURL,
          cancel_url: homeURL,
        })
        res.json({ url: session.url })
      } catch (e) {
        res.status(500).json({ error: e.message })
      }
 
    
    

    }
))

orderRoute.get('/getOrderHistory', asyncHandler(async(req , res) => {
  const email = req.query.Email;

  const orders = await order.find({Email : email})
 
  const t =Object.assign(orders)


  var orderlist=[];
    for(let i = 0; i < t.length; i++){

      var purchacelist=[];
      var total=0;
      
      const shipment = await axios.get(getShipmentURL+t[i]._id)
      const shipping = Object.assign(shipment.data)
      for (let j = 0; j < t[i].Items.length; j++) {

          const price = await axios.get(URLinventory+"price/"+t[i].Items[j].ProductId.toString())
          const detail = await axios.get(URLinventory+"details/"+t[i].Items[j].ProductId.toString())
          const prPrice =Object.assign(price.data)
          const prdetail =Object.assign(detail.data)
          const obj = {'ProductID':t[i].Items[j].ProductId,'ProductName':prdetail.productName,'Productprice':prPrice.productPrice,'Quantity':t[i].Items[j].Quantity}
          total += parseInt(prPrice.productPrice)*parseInt(t[i].Items[j].Quantity)

          purchacelist.push(obj)

        }

      const order = {'Address':t[i].Address,'_id':t[i].Items._id,'Items':purchacelist,'PhoneNumber':t[i].PhoneNumber,'UserId':t[i].UserId,'Email':t[i].Email,'OrderId':t[i]._id,'Order_Status':t[i].Status,'Shipment_Status':shipping.Status,'Total':total}
      orderlist.push(order)
    }

    res.send(orderlist)
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