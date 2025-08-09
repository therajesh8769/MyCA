const request = require('supertest');
const express = require('express');
const session = require('express-session');
const path = require('path');
const { JSDOM } = require('jsdom');

// Mock the database and authentication for testing
const mockDatabase = {
  getTransactions: async (userId) => {
    // Simulate fetching transactions for a user
    if (userId === 'testuser') {
      return [
        { id: 1, date: '2024-01-01', amount: 100, description: 'Transaction 1' },
        { id: 2, date: '2024-01-05', amount: -50, description: 'Transaction 2' },
      ];
    } else {
      return [];
    }
  },
};

const mockAuthentication = {
  isAuthenticated: (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.redirect('/login'); // Or appropriate redirect
  },
};

// Create a minimal Express app for testing
function createApp(mockDatabase, mockAuthentication) {
  const app = express();

  // Configure session middleware (important for simulating authentication)
  app.use(session({
    secret: 'testsecret',
    resave: false,
    saveUninitialized: false,
  }));

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views')); // Assuming 'views' folder exists

  // Mocked route handler for /home/report
  app.get('/home/report', mockAuthentication.isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const transactions = await mockDatabase.getTransactions(userId);
      res.render('report', { transactions }); // Assuming report.ejs exists in 'views'
    } catch (error) {
      console.error('Error rendering report:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Simple login route to set the session
  app.get('/login', (req, res) => {
    req.session.userId = 'testuser'; // Simulate successful login
    res.redirect('/home/report');
  });

  // Simple logout route to clear the session
  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/login');
    });
  });

  // Dummy route to simulate unauthorized access
  app.get('/unauthorized', (req, res) => {
      res.status(401).send('Unauthorized');
  });

  // Example of a middleware that redirects to /login when not authenticated
  app.get('/protected', mockAuthentication.isAuthenticated, (req, res) => {
      res.status(200).send('Protected content');
  });

  return app;
}



describe('Accessing the Report Page', () => {
  let app;

  beforeEach(() => {
    app = createApp(mockDatabase, mockAuthentication);
  });

  it('should redirect to /login if the user is not authenticated', (done) => {
      request(app)
          .get('/protected')
          .expect(302)
          .expect('Location', '/login')
          .end(done);
  });

  it('should allow authenticated users to access /home/report and render report.ejs with transaction data', (done) => {
    // Mock report.ejs content for validation
    const mockReportEjsContent = `
      <h1>Report</h1>
      <ul>
        <% transactions.forEach(transaction => { %>
          <li><%= transaction.description %>: <%= transaction.amount %></li>
        <% }); %>
      </ul>
    `;

    // Create a fake views directory with the mock content
    const fs = require('fs');
    const path = require('path');
    const viewsDir = path.join(__dirname, 'views');

    // Create the views directory if it doesn't exist
    if (!fs.existsSync(viewsDir)) {
        fs.mkdirSync(viewsDir);
    }

    fs.writeFileSync(path.join(viewsDir, 'report.ejs'), mockReportEjsContent);

    request(app)
      .get('/login') // Simulate login
      .then(() => {
        request(app)
          .get('/home/report')
          .expect(200)
          .expect('Content-Type', /html/)
          .end((err, res) => {
            if (err) return done(err);

            // Validate that the report.ejs template was rendered and contains the transaction data.
            // Using JSDOM to parse the HTML response.
            const dom = new JSDOM(res.text);
            const listItems = dom.window.document.querySelectorAll('li');

            expect(listItems.length).toBe(2);
            expect(listItems[0].textContent).toContain('Transaction 1: 100');
            expect(listItems[1].textContent).toContain('Transaction 2: -50');

            // Clean up the views directory after the test
            fs.unlinkSync(path.join(viewsDir, 'report.ejs'));
            fs.rmdirSync(viewsDir);
            done();
          });
      })
      .catch(done);
  });
});