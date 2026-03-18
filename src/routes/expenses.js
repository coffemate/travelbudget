const express = require('express');
const { updateExpense, deleteExpense } = require('../services/expenseService');

const router = express.Router();

router.patch('/:expenseId', async (req, res, next) => {
  try {
    const result = await updateExpense(req.params.expenseId, req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:expenseId', async (req, res, next) => {
  try {
    const result = await deleteExpense(req.params.expenseId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
