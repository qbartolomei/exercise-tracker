const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )


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

// my code

app.get('/api', function(req, res) {
  res.send('Hello world');
});

// I can create a user by posting form data username to /api/exercise/new-user 
// and returned will be an object with username and _id.
app.post('/api/exercise/new-user', function(req, res) {
});


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
