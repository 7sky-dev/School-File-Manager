require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 4444;
const url = process.env.URL;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

// Connect to MongoDB
const client = new MongoClient(url);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.log(`Error connecting to MongoDB: ${err}`);
  }
}

connectToDatabase();

// Set up Express
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

let isLoggedIn = false;

app.post('/login', (req, res) => {
    isLoggedIn = false;
  const password = req.body.password;
  bcrypt.compare(password, process.env.HASH, (err, result) => {
    if (result) {
      isLoggedIn = true;
      res.redirect('/successful');
    } else {
      res.sendFile(__dirname + '/public/error.html');
    }
  });
});

app.get('/successful', async (req, res) => {
  if (isLoggedIn) {
    try {
      const collection = client.db(dbName).collection(collectionName);
      const data = await collection.find().toArray();
      res.render('index.ejs', { data });
    } catch (err) {
      console.log(`Error retrieving data from MongoDB: ${err}`);
      res.sendFile(__dirname + '/public/error.html');
    }
  } else {
    res.sendFile(__dirname + '/public/error.html');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});