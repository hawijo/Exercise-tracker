const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: Number,
    },
  ],
});

var User = mongoose.model("USER", userSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Create a new user
app.post("/api/users", (req, res) => {
  var username = req.body.username;
  var newUser = new User({
    username: username,
    count: 0,
    log: [
      {
        description: "",
        duration: 0,
        date: 0,
      },
    ],
  });
  newUser
    .save()
    .then((data) => {
      res.json({
        username: data.username,
        _id: data._id,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

//Get all users username and IDs
app.get("/api/users", (req, res) => {
  User.find({})
    .then((data) => {
      users = data.map((user) => {
        return { username: user.username, _id: user._id };
      });
      res.json(users);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
