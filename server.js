const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const shortid = require('shortid');
require('dotenv').config();

mongoose.connect(process.env.MLAB_URI, function(err, db) {
  if (err) console.log(err);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

app.use(cors())
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/* --- my code --- */

// Schemas and models
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true,
	},
	_id: {
		type: String,
		index: true,
		default: shortid.generate,
	}
});

var exerciseSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  date: Date,
  duration: Number,
  description: String,
});

var User = mongoose.model('User', userSchema);
var Exercise = mongoose.model('Exercise', exerciseSchema);

// 1. I can create a user by posting form data username to /api/exercise/new-user 
// and returned will be an object with username and _id.
// Example: SylQ9Ot0S
app.post('/api/exercise/new-user', function(req, res) {
  var username = req.body.username;
  var newUser = new User({
    username
  });
  newUser.save(function(err, user) {
    // duplicate username: code == 11000
    if (err) return res.send(err);
    res.send(user);
  });
  //console.log(req.body);
});

// 2. I can get an array of all users by getting api/exercise/users 
// with the same info as when creating a user.
app.get('/api/exercise/users', function(req, res) {
  User.find({}, function(err, users) {
    if (err) return console.error(err);
    res.send(users);
  });
});

// 3. I can add an exercise to any user by posting form data userId(_id),
// description, duration, and optionally date to /api/exercise/add.
// If no date supplied it will use current date. 
// Returned will be the user object with also with the exercise fields added.
// Return Example: {"username":"usernamer","description":"new exedrcise","duration":10,"_id":"SylQ9Ot0S","date":"Thu Dec 19 2019"}
app.post('/api/exercise/add', function(req, res) {
  //{"userId":"123","description":"asd","duration":"11","date":""}
  let id = req.body.userId;
  User.findById(id, function(err, user) {
    if (err) return res.send('User not found');
    let newExercise = new Exercise({
      userId: user._id,
      date: req.body.date || Date.now,
      duration: req.body.duration,
      description: req.body.description,
    });
    newExercise.save(function(err, savedExercise) {
      if (err) return console.log(err);
      res.send(user, savedExercise);
    });
  });
});

//4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id).
// Return will be the user object with added array log and count (total exercise count).


//5. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit.
// (Date format yyyy-mm-dd, limit = int)

// end my code


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
