const express = require("express");
const router = express.Router();
const {mongoose} = require("mongoose");
const  ObjectId = require('mongodb').ObjectId;
const Product = require("../models/products");
const path = require('path');

const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
    // console.log("__dirname:    ", __dirname);
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g,"-") + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

router.get("/", (req, res, next) => {
  Product.find()
  // .select('name price _id')
    .exec()
    .then(docs => {
      const response ={
        count: docs.length,
        products: docs.map(doc => {
          return {
            name: doc.name,
            price: doc.price,
            productImage: doc.productImage, 
            _id: doc._id,
            request: {
              type: 'GET',
              url: 'http://localhost:3000/products/' + doc._id
            }
          }
        })
      };
      res.status(200).json(response);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


router.post("/",upload.single('productImage'), (req, res, next) => {
  console.log(req.file);
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    productImage: req.file.path
  });
  product
    .save()
    .then(result => {
      console.log(result);
      res.status(201).json({
        message: "Created product successfully",
        createdProduct: {
          name:  result.name,
          price: result.price,
          _id: result._id,
          request: {
            type: 'POST',
            url: 'http://localhost:3000/products/' + result._id
          }
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

router.get("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
  .select('-__v')
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json({
          product: doc,
          request: {
            type: 'GET',
            url: "http://localhost:3000/products/"
          }
        });
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});


// method1 youtube comments
// router.patch("/:id", (req, res, next) => {
//     const id= req.params.id;
//     Product.findByIdAndUpdate({_id: id}, {$set: req.body})
//     .exec()
//     .then(result => {
//         res.status(200).json(result)})
//     .catch(err => res.status(500).json({error: err}))
// });

// method 2 youtube comments
// router.patch('/:productId', async(req, res, next) => {
//     const props = req.body;
//     try{
//         const result = await Product.updateOne({_id: new ObjectId(req.params.id)}, {$set: req.body}).exec();
//         console.log(req.body);
//         res.json(result);
//     }catch(e){
//         console.log(e);
//         res.status(500).json(e);
//     }
// })

router.patch("/:productId", (req, res, next) => {
  const id = req.params.productId;
  const updateOps = {};
  for (const key of Object.keys(req.body)) {
    updateOps[key] = req.body[key];
    console.log(id)
    console.log(updateOps)
  }
  Product.updateOne({ _id: id }, { updateOps })
    .exec()
    .then(result => {
      console.log(result);
      res.status(200).json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

router.delete("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.deleteOne({ _id: id })
    .exec()
    .then(result => {
      res.status(200).json({
        message: 'Product Deleted',
        request: {
          type: 'DELETE',
          url: "localhost:3000/products",
          body: {
            name: 'String', price: 'Number'
          }
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

module.exports = router;