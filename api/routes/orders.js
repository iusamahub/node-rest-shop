const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const checkAuth =require('../middleware/check-auth');

const Order = require('../models/order');   //order model
const Product = require('../models/products')
var ObjectId = require('mongodb').ObjectID;

router.get('/', checkAuth, (req, res, next) => {
    Order
    .find()
    .select('-__v')
    .populate('product', 'name')
    .exec()
    .then(docs => {
        // console.log(docs[0].quantity)
        res.status(200).json({
        message: "Orders were fetched",
        orders: docs.map(doc => {
            return {
                _id: doc._id,
                product: doc.product,
                quantity: doc.quantity,
                request:{
                    type: 'GET',
                    url: "localhost:3000/orders" +doc._id
                }
            }
        })
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        })      
    })
});

router.post("/",checkAuth, (req, res, next) => {
    Product.findById(new mongoose.Types.ObjectId(req.body.productId))
      .then(product => {
        if (!product) {
            console.log("product not found")
          return res.status(404).json({
            message: "Product not found"
          });
        }
        const order = new Order({
          _id: new mongoose.Types.ObjectId(),
          quantity: req.body.quantity,
          product: req.body.productId
        });
        return order.save();
      })
      .then(result => {
        console.log(result);
        res.status(201).json({
          message: "Order stored",
          createdOrder: {
            _id: result._id,
            product: result.product,
            quantity: result.quantity
          },
          request: {
            type: "GET",
            url: "http://localhost:3000/orders/" + result._id
          }
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });
  

router.get('/:orderId', checkAuth, (req, res, next) => {
    Order.findById(req.params.orderId)
    .select('-__v')
    .populate('product')
    .exec()
    .then(order => {
        if(!order){
            return res.status(404).json({
                message: "order not found"
            })
        }
        res.status(200).json({
            order: order,
            request: {
                type: 'GET',
                url: "localhost:3000/orders/"
            }
        })
    })
    .catch(err => {
        res.status(500).json(err)
    })
});

router.delete('/:orderId', checkAuth, (req, res, next) => {
    Order.findOneAndRemove({_id: req.params.orderId})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'Order Deleted',
            request: {
                type: 'GET',
                url: "localhost:3000/orders"
            }
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    })
});

module.exports = router;