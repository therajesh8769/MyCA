const net = require('net');
const assert = require('assert');

describe('Server Startup', () => {
  it('should start and listen on port 8080', (done) => {
    const client = new net.Socket();

    client.connect({ port: 8080, host: '127.0.0.1' }, () => {
      // Connection established successfully
      client.destroy(); // Close the connection
      done(); // Signal that the test is complete
    });

    client.on('error', (err) => {
      // If connection fails, the server is not listening on the port
      assert.fail(`Server is not listening on port 8080. Error: ${err.message}`);
      done(); // Ensure done is called even in case of error.
    });

    //Optional timeout in case server never starts
    setTimeout(() => {
      assert.fail('Timeout: Server did not start listening on port 8080 within the timeout period.');
      done();
    }, 2000); //Timeout after 2 seconds
  });
});