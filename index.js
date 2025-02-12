const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const crypto = require('crypto');
const req = require('express/lib/request');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Middleware to parse JSON and form data
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for users
const users = [];

// Generate a deterministic ID from username
function generateUserId(username) {
    return crypto.createHash('sha256').update(username).digest('hex');
}

// POST endpoint to create a user (validates username)
app.post('/api/users', (req, res) => {
    const username = req.body.username;

    // Check if username is provided
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(409).json({ error: 'User already exists', user: existingUser });
    }

        // Generate a deterministic ID for the user
        const userId = generateUserId(username);

    // Create new user with deterministic ID
    const newUser = {
        _id: userId,
        username: username,
        exercises: []
    };

    users.push(newUser);
    return res.status(201).json({ username: username, _id: userId });
});

// POST endpoint to add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = users.find(user => user._id === userId);
  if (!user) {
      return res.status(404).json({ error: 'User not found' });
  }

      // Format date as yyyy-mm-dd
      const formattedDate = date ? new Date(date).toDateString().split('T')[0] : new Date().toDateString().split('T')[0];

  const exercise = {
      description,
      duration: parseInt(duration),
      date: formattedDate // Use the formatted date 
  };

  user.exercises.push(exercise);
  return res.status(201).json({
      _id: user._id,
      username: user.username,
      ...exercise
  });
});

// GET endpoint to retrieve a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
    const userId = req.params._id;
    let { from, to, limit } = req.query;

    const user = users.find(user => user._id === userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    let logs = user.exercises;

        // Filter logs by 'from' date
        if (from) {
          const fromDate = new Date(from);
          logs = logs.filter(log => new Date(log.date) >= fromDate);
      }
  
      // Filter logs by 'to' date
      if (to) {
          const toDate = new Date(to);
          logs = logs.filter(log => new Date(log.date) <= toDate);
      }
  
      // Apply limit to the logs
      if (limit) {
          logs = logs.slice(0, parseInt(limit));
      }
    
    return res.status(200).json({
        _id: user._id,
        username: user.username,
        count: logs.length,
        log: logs
    });
});


// GET endpoint to fetch all users (always returns an array)
app.get('/api/users', (req, res) => {
    // Return the array (empty if no users exist)
    return res.status(200).json(users);
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
