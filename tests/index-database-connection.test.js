// filename: test.js
const mongoose = require('mongoose');

// Use a dummy model to check the connection
const TestSchema = new mongoose.Schema({ test: String });
const TestModel = mongoose.model('Test', TestSchema);


describe('Database Connection', () => {
  let connection;

  beforeAll(async () => {
    const atlasDB = process.env.ATLAS;

    if (!atlasDB) {
      console.warn('ATLAS environment variable is not set. Skipping database connection test.');
      return;
    }

    try {
      connection = await mongoose.connect(atlasDB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  });

  afterAll(async () => {
    if (connection) {
      await mongoose.connection.close();
    }
  });

  it('should connect to the MongoDB database successfully if ATLAS environment variable is set', async () => {
    if (!process.env.ATLAS) {
      console.warn('ATLAS environment variable is not set. Skipping database connection test.');
      return;
    }

    expect(mongoose.connection.readyState).toBe(1); // 1 means connected

    // Optionally, perform a simple database operation to further verify
    try {
      await TestModel.create({ test: 'test' });
      const doc = await TestModel.findOne({ test: 'test' });
      expect(doc).toBeDefined();
      expect(doc.test).toBe('test');
      await TestModel.deleteOne({ test: 'test' }); // Clean up the created document
    } catch (error) {
      console.error('Error during database operation:', error);
      fail('Failed to perform database operation.');
    }
  });
});

// Dummy Test file setup (package.json)
//{
//  "name": "database-connection-test",
//  "version": "1.0.0",
//  "description": "Tests MongoDB connection",
//  "main": "index.js",
//  "scripts": {
//    "test": "jest"
//  },
//  "keywords": [],
//  "author": "",
//  "license": "ISC",
//  "dependencies": {
//    "mongoose": "^8.0.0"
//  },
//  "devDependencies": {
//    "jest": "^29.0.0"
//  }
//}

// Dummy jest.config.js
// module.exports = {
//   testEnvironment: 'node',
//   verbose: true,
// };