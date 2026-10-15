require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const Result = require('./models/Result');

const app = express();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sattadb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let isAdminLoggedIn = false;

async function fetchExternalResults() {
  try {
    const targetUrl = 'https://satta-king-fast.com/';
    const { data } = await axios.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const currentDate = new Date().toISOString().split('T')[0];
    console.log("Checking external updates for:", currentDate);
  } catch (error) {
    console.error("Error fetching external data:", error.message);
  }
}

cron.schedule('*/30 * * * *', () => {
  fetchExternalResults();
});

app.get('/', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    let latestResult = await Result.findOne({ date: todayStr });
    
    if (!latestResult) {
      latestResult = { disawar: "--", faridabad: "--", ghaziabad: "--", gali: "--" };
    }
    
    const historicResults = await Result.find().sort({ date: -1 }).limit(30);
    res.render('index', { latest: latestResult, history: historicResults });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.get('/admin/login', (req, res) => {
  res.send(`
    <h2>Admin Login</h2>
    <form action="/admin/login" method="POST">
      <input type="password" name="password" placeholder="Enter Admin Password" required />
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/admin/login', (req, res) => {
  if (req.body.password === (process.env.ADMIN_PASS || 'secretadmin')) {
    isAdminLoggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('Incorrect Password. <a href="/admin/login">Try Again</a>');
  }
});

app.get('/admin', async (req, res) => {
  if (!isAdminLoggedIn) return res.redirect('/admin/login');
  const results = await Result.find().sort({ date: -1 }).limit(10);
  res.render('admin', { results });
});

app.post('/admin/update', async (req, res) => {
  if (!isAdminLoggedIn) return res.status(403).send("Unauthorized");

  const { date, disawar, delhiBazar, shriGanesh, faridabad, ghaziabad, gali } = req.body;

  await Result.findOneAndUpdate(
    { date },
    { disawar, delhiBazar, shriGanesh, faridabad, ghaziabad, gali, updatedAt: Date.now() },
    { upsert: true, new: true }
  );

  res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});