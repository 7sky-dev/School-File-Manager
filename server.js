require("dotenv").config();
const fs = require("fs");
const express = require("express");
const upload = require("express-fileupload");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const {authRouter, currentUser, requireAuth, requireAdmin} = require("./auth");
const cookieSession = require("cookie-session");
const app = express();
const port = process.env.PORT || 4444;
const url = process.env.URL || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME;
const collectionFiles = process.env.COLLECTION_FILES;
const collectionTeachers = process.env.COLLECTION_TEACHERS;

// Connect to MongoDB
const client = new MongoClient(url);
const collectionF = client.db(dbName).collection(collectionFiles);
const collectionT = client.db(dbName).collection(collectionTeachers);

const connectToDatabase = async () => await client.connect();

connectToDatabase().then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
    console.log(`Error connecting to MongoDB: ${err}`);
});

// Set up Express
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(upload());
app.use(
    cookieSession({
      signed: false,
      secure: false
    })
);

app.use(authRouter);
app.use(currentUser);

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.post("/del", requireAdmin, async (req, res) => {
    await collectionF.deleteOne({ name: req.body.file });
    await fs.unlinkSync(__dirname + "/public/files/" + req.body.file);

    res.redirect("/adminpanel");
});

// app.post("/login", async (req, res) => {
//   const password = req.body.password;
//   try {
//     bcrypt.compare(password, process.env.ADMIN_HASH, (err, result) => {
//       if (result) {
//         admin = true;
//         res.redirect("/admincheck");
//       }
//     });
//   } catch (e) {}
//   bcrypt.compare(password, process.env.HASH, (err, result) => {
//     if (result) {
//       res.redirect("/successful");
//     } else {
//       res.sendFile(__dirname + "/public/error.html");
//     }
//   });
// });

// app.get("/admincheck", async (req, res) => {
//   if (admin) {
//     res.redirect("/adminpanel");
//   } else {
//     res.sendFile(__dirname + "/public/error.html");
//   }
// });

app.get("/adminpanel", requireAdmin, async (req, res) => {
    const dataFiles = await collectionF.find().toArray();
    res.render("admin.ejs", { dataFiles });
});

app.get("/successful", requireAuth, async (req, res) => {
  try {
    const dataFiles = await collectionF.find().sort({ teacher: 1 }).toArray();
    const dataTeachers = await collectionT.find().toArray();
    res.render("index.ejs", { dataFiles, dataTeachers });
  } catch (err) {
    console.log(`Error retrieving data from MongoDB: ${err}`);
    res.sendFile(__dirname + "/public/error.html");
  }
});

app.get("/sort", requireAuth, async (req, res) => {
  const dataTeachers = await collectionT.find().toArray();
  const { teacher } = req.query;
  const dataSorted = await collectionF.find({ teacher: teacher }).toArray();
  res.render("sorted.ejs", { dataSorted, dataTeachers });
});

app.post("/add", requireAuth, async (req, res) => {
  const teacher = req.body.teacher;
  if (req.files) {
    const file = req.files.fileName;
    const fileName = file.name;

    let check = true;
    const files = fs.readdirSync(__dirname + "/public/files/");
    files.forEach((e) => {
      if (e.toString() == fileName) check = false;
    });

    if (check) {
      file.mv(__dirname + "/public/files/" + fileName, fileName);
      collectionF.insertOne({
        name: `${fileName}`,
        teacher: `${teacher}`,
      });
      res.redirect("/successful");
    } else {
      res.send(
        "<script>alert('Plik o takiej nazwie już istnieje!');window.location.href = '/successful';</script>"
      );
    }
  } else {
    res.sendFile(__dirname + "/public/error.html");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
