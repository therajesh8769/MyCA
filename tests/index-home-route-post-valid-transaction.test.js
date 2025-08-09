const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import your application or routes here
const app = require('../app'); // Replace with your actual app file
const Transaction = require('../models/Transaction'); // Replace with your actual Transaction model
const User = require('../models/User'); // Replace with your actual User model


let mongod;
let mongoUri;
let connection;
let testUser;
let csrfToken;


// Mock user authentication middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Mock CSRF protection -  THIS IS NOT SECURE FOR PRODUCTION
app.use(function(req, res, next) {
  csrfToken = 'testCSRFToken'; // Static token for testing purposes
  res.locals.csrfToken = csrfToken;
  next();
});



// Mock user authentication -  THIS IS NOT SECURE FOR PRODUCTION
app.use(function(req, res, next) {
    req.user = testUser; // Attach the test user to the request
    res.locals.user = testUser; // Add user to locals as well, if needed
    next();
});




beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  mongoUri = mongod.getUri();

  // Connect to the in-memory database
  connection = await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });


  // Create a test user
  testUser = new User({
    username: 'testuser',
    password: 'password123' // In a real app, hash the password
  });
  await testUser.save();

  // Seed the database if needed (e.g., with initial data)
});

afterAll(async () => {
  // Disconnect from the database
  await mongoose.disconnect();

  // Stop the in-memory database
  await mongod.stop();
});

beforeEach(async () => {
  // Clear the database before each test to ensure a clean slate
  await Transaction.deleteMany({}); // Clear transactions
  // Optionally clear Users or other models, if needed
});

describe('Home Route POST - Valid Transaction', () => {
  it('should save a valid transaction to the database and redirect to /home with a success flash message', async () => {
    const transactionData = {
      description: 'Test Transaction',
      amount: 100,
      type: 'income',
      date: new Date(),
      _csrf: csrfToken // Include the CSRF token in the request
    };

    const response = await request(app)
      .post('/home')
      .type('form') // Specify the content type as form-urlencoded
      .send(transactionData)
      .redirects(0); // Prevent automatic redirects so we can check the status code.

    expect(response.status).toBe(302); // Expect a redirect
    expect(response.header.location).toBe('/home'); // Expect redirect to /home

    // Verify that the transaction was saved to the database
    const transaction = await Transaction.findOne({ description: 'Test Transaction' });
    expect(transaction).toBeDefined();
    expect(transaction.amount).toBe(100);
    expect(transaction.type).toBe('income');

    //Verify transaction user relation is correct
    expect(transaction.user.toString()).toBe(testUser._id.toString());

    // Verify the flash message -  this requires middleware set up
    // This can be tricky without access to the Express app instance
    //  and its internal state. Instead, you'd typically check the session directly.
    // This is handled with res.flash messages by the express app
    //  and cannot be reliably tested with supertest without directly
    //  accessing the session. A true integration test would require the
    //   browser and a method to read the flash messages, e.g. using Selenium.


  });
});