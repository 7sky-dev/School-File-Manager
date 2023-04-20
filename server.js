require("dotenv").config();
const express = require("express");
const upload = require("express-fileupload");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const app = express();
const port = process.env.PORT || 4444;
const url = process.env.URL;
const dbName = process.env.DB_NAME;
const collectionFiles = process.env.COLLECTION_FILES;
const collectionTeachers = process.env.COLLECTION_TEACHERS;

// Connect to MongoDB
const client = new MongoClient(url);
const collectionF = client.db(dbName).collection(collectionFiles);
const collectionT = client.db(dbName).collection(collectionTeachers);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(`Error connecting to MongoDB: ${err}`);
  }
}

connectToDatabase();

// Set up Express
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(upload());

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

let isLoggedIn = false;

app.post("/login", (req, res) => {
  isLoggedIn = false;
  const password = req.body.password;
  bcrypt.compare(password, process.env.HASH, (err, result) => {
    if (result) {
      isLoggedIn = true;
      res.redirect("/successful");
    } else {
      res.sendFile(__dirname + "/public/error.html");
    }
  });
});

app.get("/successful", async (req, res) => {
  if (isLoggedIn) {
    try {
      const dataFiles = await collectionF.find().sort({ teacher: 1 }).toArray();
      const dataTeachers = await collectionT.find().toArray();
      res.render("index.ejs", { dataFiles, dataTeachers });
    } catch (err) {
      console.log(`Error retrieving data from MongoDB: ${err}`);
      res.sendFile(__dirname + "/public/error.html");
    }
  } else {
    res.sendFile(__dirname + "/public/error.html");
  }
  isLoggedIn = false;
});

app.get("/sort", async (req, res) => {
  const dataTeachers = await collectionT.find().toArray();
  const { teacher } = req.query;
  const dataSorted = await collectionF.find({ teacher: teacher }).toArray();
  res.render("sorted.ejs", { dataSorted, dataTeachers });
  isLoggedIn = false;
});

app.post("/add", (req, res) => {
  const teacher = req.body.teacher;
  if (req.files) {
    const file = req.files.fileName;
    const fileName = file.name;
    file.mv(__dirname + "/public/files/" + fileName, fileName);
    collectionF.insertOne({
      name: `${fileName}`,
      teacher: `${teacher}`,
    });
    isLoggedIn = true;
    res.redirect("/successful");
  } else {
    res.sendFile(__dirname + "/public/error.html");
  }
  isLoggedIn = false;
});

// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
