const express = require('express');
const { updateExpense, deleteExpense } = require('../services/expenseService');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);

router.patch('/:expenseId', async (req, res, next) => {
  try {
    const result = await updateExpense(req.params.expenseId, req.body, req.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:expenseId', async (req, res, next) => {
  try {
    const result = await deleteExpense(req.params.expenseId, req.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
