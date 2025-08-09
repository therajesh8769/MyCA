const mongoose = require('mongoose');

// Ensure ATLAS_URI is defined in the environment variables.
const ATLAS_URI = process.env.ATLAS_URI;

describe('Database Connection', () => {
  it('should successfully connect to the MongoDB database', async () => {
    if (!ATLAS_URI) {
      throw new Error('ATLAS_URI environment variable is not defined.  Make sure to set it before running tests.');
    }

    try {
      // Attempt to connect to the database
      await mongoose.connect(ATLAS_URI, {
        useNewUrlParser: true, // Use the new URL parser
        useUnifiedTopology: true, // Use the unified topology
      });

      // If the connection is successful, mongoose.connection.readyState should be 1
      expect(mongoose.connection.readyState).toBe(1); // 1 means connected

      // Disconnect from the database after the test
      await mongoose.disconnect();
      expect(mongoose.connection.readyState).toBe(0); // 0 means disconnected

    } catch (error) {
      // If there's an error during connection, fail the test.
      fail(`Failed to connect to the database: ${error.message}`);
    }
  }, 10000); // Increase timeout to 10 seconds for connection
});
