const express = require('express');
const cors = require('cors');

const tripsRouter = require('./routes/trips');
const expensesRouter = require('./routes/expenses');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/trips', tripsRouter);
app.use('/api/expenses', expensesRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
