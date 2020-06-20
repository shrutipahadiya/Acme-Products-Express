const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const readFileP = (path) => {
  return new Promise((res, rej) => {
    fs.readFile(path, (err, data) => {
      if (err) rej(err);
      else res(JSON.parse(data.toString()));
    });
  });
};

const writeFileP = (path, data) => {
  return new Promise((res, rej) => {
    fs.writeFile(path, JSON.stringify(data), (err) => {
      if (err) rej(err);
      else res();
    });
  });
}

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware is any function in express that intercepts a request, and performs some sort of action on it, or based on it. It then allows the request to move forward in the express pipeline.

const DB_PATH = path.join(__dirname, './products.json');

// Logging middleware
app.use((req, res, next) => {
  console.log(chalk.cyan(`Request made to: ${req.path}`));

  next();
});

app.use(express.static(path.join(__dirname, '../dist')));

// JSON Middleware
app.use(express.json());

// Data Layer Middleware
app.use((req, res, next) => {
  readFileP(DB_PATH)
    .then(data => {
      req.product = data;
      next();
    });
});


app.get('/', (req, res,next) => {
    res.sendFile(path.join(__dirname,"./index.html"))
     });

app.get('/api/products', (req, res) => {
  res.send({
    product: req.product,
  });
});

app.post('/api/products', (req, res) => {
 const {id, name } = req.body;

  if (req.product[id]) {
    res.status(400).send({
      message: `product ${id} already exists .`,
    });
  } else if (typeof name !== 'string') {
    res.status(400).send({
      message: 'Body of request must contain a "name" of type "string" and a "id" of type "String"',
    });
  } else {
     // console.log("before post product == ",req.product)
      req.product.push(req.body)
    // const newProduct = {
    //   ...req.product,
    // //   [id]: {
    // //       id,
    // //     name,
    // //    },
    // };
    //console.log("after post product == ",req.product)
    writeFileP(DB_PATH, req.product)
      .then(() => {
        res.send({
          message: `product ${id} added !`,
          id:id,
          updatedProducts: req.product
        });
      });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  //console.log("id ",id)
 // console.log("params ",req.params);
 // console.log("products ",req.product)
 const exists = req.product.find(product => product.id == id)
//console.log("exists ",exists)

  if(!exists){  //(!req.product[id]) {
    res.status(400).send({
      message: `Product ${id} does not exist!`,
    });
  } else {
    //console.log("before delete ",req.product)
     let arr =  req.product.filter(product => product.id != id)
  //  delete req.product[id];
    //console.log("after delete ",arr)
    writeFileP(DB_PATH, arr)
      .then(() => {
       res.send({
          message: `Product ${id} removed!`,
          updatedProducts:arr,
        });
      });
  }
});

// Not Found Middleware (not working for some reason)
app.use((req, res, next) => {
  res.send({
    message: `Webpage not found at ${req.path}`,
  });
});

// Error Middleware
app.use((err, req, res, next) => {
  console.log('Hit Error Middleware!');

  res.send({
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(chalk.green(`Server is now listening on PORT:${PORT}`));
});