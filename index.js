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
    log: [
      {
        description: "",
        duration: 0,
        date: date,
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

//Add exercise
app.post("/api/users/:id/exercises", (req, res) => {
  var userId = req.params.id;
  var description = req.body.description;
  var duration = parseInt(req.body.duration);
  var date = req.body.date;
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
        log: [
          {
            description: newLog.description,
            duration: newLog.duration,
            date: newLog.date,
          },
        ],
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
  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        username: user.username,
        count: user.count,
        _id: user._id,
        log: user.log.map((log) => {
          return {
            description: log.description,
            duration: log.duration,
            date: log.date,
          };
        }),
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
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const limit = parseInt(req.query.limit);

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let log = user.log;

      if (from) {
        log = log.filter((entry) => new Date(entry.date) >= from);
      }
      if (to) {
        log = log.filter((entry) => new Date(entry.date) <= to);
      }
      if (limit) {
        log = log.slice(0, limit);
      }

      res.json({
        username: user.username,
        count: user.count,
        _id: user._id,
        log: log.map((entry) => ({
          description: entry.description,
          duration: entry.duration,
          date: entry.date,
        })),
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
}
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
