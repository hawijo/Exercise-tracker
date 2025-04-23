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
      _id: false,
      description: String,
      duration: Number,
      date: String,
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
  var date = new Date().toDateString();
  var newUser = new User({
    username: username,
    count: 0,
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

//Add exercise
app.post("/api/users/:id/exercises", (req, res) => {
  var userId = req.params.id;
  var description = req.body.description;
  var duration = parseInt(req.body.duration);
  var date = req.body.date;
  description = description.toString();
  duration = parseInt(duration);
  if (date == "") {
    date = new Date().toDateString();
  }
  date = new Date(date).toDateString();

  var newLog = {
    description: description,
    duration: duration,
    date: date,
  };

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      user.count += 1;
      user.log.push(newLog);
      return user.save();
    })
    .then((data) => {
      res.json({
        username: data.username,
        count: data.count,
        _id: data._id,
        description: newLog.description,
        duration: newLog.duration,
        date: newLog.date,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    });

});

//Get all user logs
app.get("/api/users/:id/logs", (req, res) => {
  var userId = req.params.id;
  var from = req.query.from;
  var to = req.query.to;
  var limit = req.query.limit ? parseInt(req.query.limit) : undefined;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let logs = user.log;

      // Filter logs by from and to dates if provided
      if (from) {
        const fromDate = new Date(from);
        logs = logs.filter((log) => new Date(log.date) >= fromDate);
      }
      if (to) {
        const toDate = new Date(to);
        logs = logs.filter((log) => new Date(log.date) <= toDate);
      }

      // Apply limit if provided
      if (limit) {
        logs = logs.slice(0, limit);
      }

      res.json({
        _id: user._id,
        username: user.username,
        count: logs.length,
        log: logs,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

//Get user logs with date range and limit
//GET user's exercise log: GET /api/users/:_id/logs?[from][&to][&limit]
//[ ] = optional
//from, to = dates (yyyy-mm-dd); limit = number

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
