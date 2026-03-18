const express = require('express');
const { createTrip, getTripById } = require('../services/tripService');
const { addExpense, listExpenses } = require('../services/expenseService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const trip = await createTrip(req.body);
    return res.status(201).json(trip);
  } catch (err) {
    return next(err);
  }
});

router.get('/:tripId', async (req, res, next) => {
  try {
    const trip = await getTripById(req.params.tripId);
    return res.json(trip);
  } catch (err) {
    return next(err);
  }
});

router.post('/:tripId/expenses', async (req, res, next) => {
  try {
    const result = await addExpense(req.params.tripId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
});

router.get('/:tripId/expenses', async (req, res, next) => {
  try {
    const expenses = await listExpenses(req.params.tripId);
    return res.json(expenses);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
