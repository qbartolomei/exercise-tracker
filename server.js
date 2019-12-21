const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const shortid = require('shortid');
const moment = require('moment');
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
  username: String,
	userId: {
		type: String,
		ref: 'User',
		required: true,
	},
	date: Date,
	duration: Number,
	description: String,
});

var Users = mongoose.model('User', userSchema);
var Exercises = mongoose.model('Exercise', exerciseSchema);

// Done // 1. I can create a user by posting form data username to /api/exercise/new-user 
// Done // and returned will be an object with username and _id.
app.post('/api/exercise/new-user', function(req, res) {
  var username = req.body.username;
  var newUser = new Users({
    username
  });
  newUser.save(function(err, user) {
    if (err){
      if (err.code == 11000) return res.send("username already taken");
      return res.send(err);
    } 
    res.send(user);
  });
});

// Done // 2. I can get an array of all users by getting api/exercise/users 
// Done // with the same info as when creating a user.
app.get('/api/exercise/users', function(req, res) {
  Users.find({}, function(err, users) {
    if (err) return console.error(err);
    res.send(users);
  });
});

// UserId: ThWR8sEV

// 3. I can add an exercise to any user by posting form data userId(_id),
// description, duration, and optionally date to /api/exercise/add.
// Test // If no date supplied it will use current date. 
// Test // Returned will be the user object with the exercise fields added.
// Return Example: {"username":"usernamer","description":"new exedrcise","duration":10,"_id":"SylQ9Ot0S","date":"Thu Dec 19 2019"}
app.post('/api/exercise/add', function(req, res) {
  //{"userId":"123","description":"asd","duration":"11","date":""}
  let id = req.body.userId;
  Users.findById(id, function(err, user) {
    if (err) return res.send('User not found');
    let dateRegex = /^[0-9]{4}\-[0-9]{2}\-[0-9]{1,2}$/;
    let dateIsValid = dateRegex.test(req.body.date);
    let date = dateIsValid ? req.body.date : Date.now();
    console.log(dateIsValid, date);
    let newExercise = new Exercises({
      username: user.username,
      userId: user._id,
      date,
      duration: req.body.duration,
      description: req.body.description,
    });
    newExercise.save(function(err, savedExercise) {
      if (err) return console.log(err);
      res.json(exerciseToString(savedExercise));
    });
  });
});

const exerciseToString = function(exercise) {
  return ({
		username: exercise.username,
		description: exercise.description,
		duration: exercise.duration,
		_id: exercise.userId,
		date: moment(exercise.date).format('dddd MMM DD YYYY'),
  });
}

//4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id).
// Return will be the user object with added array log and count (total exercise count).

/* Example output:
  {
    "_id":"HJPrhPnBx",
    "username":"joe",
    "count":8,
    "log":[
      {"description":"new exedrcise","duration":10,"date":"Sat Dec 21 2019"},
      {"description":"new exedrcise","duration":10,"date":"Sat Dec 21 2019"},
      {"description":"dar something 2","duration":2000000,"date":"Mon Apr 15 2019"},
      {"description":"dar something 3","duration":2000000333,"date":"Sat Apr 13 2019"},
      {"description":"test","duration":10,"date":"Wed Sep 19 2018"},
      {"description":"4","duration":444,"date":"Fri Jan 06 2017"},
      {"description":"ererer","duration":32,"date":"Fri Jan 06 2017"},
      {"description":"runnningggg","duration":23,"date":"Fri Jan 06 2017"}]}
*/

//5. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit.
// (Date format yyyy-mm-dd, limit = int)
app.get('/api/exercise/log', function(req, res) {
  let userId = req.query.userId;
  let from = req.query.from;
  let to = req.query.to;

  Users.findById(userId, function(err, user){
    if (err) return console.log(err);
    Exercises.find({userId}, function(err, exercises) {
      if (err) return console.log(err);
      console.log(exercises);
      res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: exercises.map(exerciseToString),
      });

    });

  });

  res.send({ userId, from, to });
});


/* --- End my code --- */


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
