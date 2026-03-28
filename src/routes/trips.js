const express = require('express');
const { createTrip, getTripById } = require('../services/tripService');
const { addExpense, listExpenses } = require('../services/expenseService');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const trip = await createTrip({
      ...req.body,
      owner_id: req.user.id,
    });
    return res.status(201).json(trip);
  } catch (err) {
    return next(err);
  }
});

router.get('/:tripId', async (req, res, next) => {
  try {
    const trip = await getTripById(req.params.tripId, req.user.id);
    return res.json(trip);
  } catch (err) {
    return next(err);
  }
});

router.post('/:tripId/expenses', async (req, res, next) => {
  try {
    const result = await addExpense(
      req.params.tripId,
      {
        ...req.body,
        created_by: req.user.id,
        paid_by: req.body.paid_by || req.user.id,
      },
      req.user.id,
    );
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
});

router.get('/:tripId/expenses', async (req, res, next) => {
  try {
    const expenses = await listExpenses(req.params.tripId, req.user.id);
    return res.json(expenses);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
