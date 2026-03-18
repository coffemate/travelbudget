const pool = require('../db/pool');
const { isUuid, badRequest, forbidden } = require('./tripService');

function parsePositiveNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw badRequest(`${fieldName} must be a valid number > 0`);
  }
  return n;
}

function normalizeCurrency(currency, fieldName = 'currency') {
  if (!currency || String(currency).trim().length !== 3) {
    throw badRequest(`${fieldName} must be a 3-letter currency code`);
  }
  return String(currency).toUpperCase();
}

async function addExpense(tripId, payload, userId) {
  const { created_by, paid_by, amount, currency, fx_rate_to_base, category, spent_at, note, idempotency_key } = payload;

  if (!isUuid(tripId)) throw badRequest('tripId must be a valid UUID');
  if (!created_by || !isUuid(created_by)) throw badRequest('created_by must be a valid UUID');
  if (paid_by && !isUuid(paid_by)) throw badRequest('paid_by must be a valid UUID');
  if (!category) throw badRequest('category is required');
  if (!spent_at) throw badRequest('spent_at is required');
  if (!idempotency_key) throw badRequest('idempotency_key is required');

  const amountValue = parsePositiveNumber(amount, 'amount');
  const fxRateValue = parsePositiveNumber(fx_rate_to_base, 'fx_rate_to_base');
  const currencyValue = normalizeCurrency(currency);

  const client = await pool.connect();
  try {
    await client.query('begin');

    const tripRes = await client.query('select * from public.trips where id = $1 for update', [tripId]);
    if (!tripRes.rows[0]) {
      const err = new Error('Trip not found');
      err.status = 404;
      throw err;
    }
    const trip = tripRes.rows[0];
    if (userId && trip.owner_id !== userId) {
      throw forbidden('You do not have access to this trip');
    }

    const amountInBase = Number((amountValue * fxRateValue).toFixed(2));
    const nextRemaining = Number(trip.remaining_budget) - amountInBase;
    if (nextRemaining < 0) throw badRequest('Insufficient remaining_budget');

    const insertExpenseQuery = `
      insert into public.expenses
      (trip_id, created_by, paid_by, amount, currency, fx_rate_to_base, amount_in_base, category, spent_at, note, idempotency_key)
      values
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (trip_id, idempotency_key) do nothing
      returning *
    `;

    const expenseRes = await client.query(insertExpenseQuery, [
      tripId,
      created_by,
      paid_by || null,
      amountValue,
      currencyValue,
      fxRateValue,
      amountInBase,
      category,
      spent_at,
      note || null,
      idempotency_key,
    ]);

    const expense = expenseRes.rows[0];

    if (!expense) {
      const existing = await client.query(
        'select * from public.expenses where trip_id = $1 and idempotency_key = $2',
        [tripId, idempotency_key],
      );
      await client.query('rollback');
      return { expense: existing.rows[0], trip, deduced: false };
    }

    const updatedTripRes = await client.query(
      'update public.trips set remaining_budget = $1 where id = $2 returning *',
      [nextRemaining, tripId],
    );

    await client.query('commit');
    return { expense, trip: updatedTripRes.rows[0], deduced: true };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function listExpenses(tripId, userId) {
  if (!isUuid(tripId)) throw badRequest('tripId must be a valid UUID');

  const tripRes = await pool.query('select owner_id from public.trips where id = $1', [tripId]);
  if (!tripRes.rows[0]) {
    const err = new Error('Trip not found');
    err.status = 404;
    throw err;
  }
  if (userId && tripRes.rows[0].owner_id !== userId) {
    throw forbidden('You do not have access to this trip');
  }

  const { rows } = await pool.query(
    'select * from public.expenses where trip_id = $1 and is_voided = false order by spent_at desc, created_at desc',
    [tripId],
  );

  return rows;
}

async function updateExpense(expenseId, payload, userId) {
  if (!isUuid(expenseId)) throw badRequest('expenseId must be a valid UUID');

  const { amount, currency, fx_rate_to_base, category, spent_at, note, paid_by } = payload;
  if (!category) throw badRequest('category is required');
  if (!spent_at) throw badRequest('spent_at is required');
  if (paid_by && !isUuid(paid_by)) throw badRequest('paid_by must be a valid UUID');

  const amountValue = parsePositiveNumber(amount, 'amount');
  const fxRateValue = parsePositiveNumber(fx_rate_to_base, 'fx_rate_to_base');
  const currencyValue = normalizeCurrency(currency);

  const client = await pool.connect();
  try {
    await client.query('begin');

    const expenseRes = await client.query(
      'select * from public.expenses where id = $1 and is_voided = false for update',
      [expenseId],
    );
    if (!expenseRes.rows[0]) {
      const err = new Error('Expense not found');
      err.status = 404;
      throw err;
    }

    const current = expenseRes.rows[0];
    const tripRes = await client.query('select * from public.trips where id = $1 for update', [current.trip_id]);
    const trip = tripRes.rows[0];
    if (userId && trip.owner_id !== userId) {
      throw forbidden('You do not have access to this expense');
    }

    const newAmountInBase = Number((amountValue * fxRateValue).toFixed(2));
    const diff = newAmountInBase - Number(current.amount_in_base);
    const nextRemaining = Number(trip.remaining_budget) - diff;

    if (nextRemaining < 0) throw badRequest('Insufficient remaining_budget after update');

    const updatedExpenseRes = await client.query(
      `update public.expenses
       set amount = $1, currency = $2, fx_rate_to_base = $3, amount_in_base = $4,
           category = $5, spent_at = $6, note = $7, paid_by = $8
       where id = $9
       returning *`,
      [amountValue, currencyValue, fxRateValue, newAmountInBase, category, spent_at, note || null, paid_by || null, expenseId],
    );

    const updatedTripRes = await client.query(
      'update public.trips set remaining_budget = $1 where id = $2 returning *',
      [nextRemaining, trip.id],
    );

    await client.query('commit');
    return { expense: updatedExpenseRes.rows[0], trip: updatedTripRes.rows[0] };
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteExpense(expenseId, userId) {
  if (!isUuid(expenseId)) throw badRequest('expenseId must be a valid UUID');

  const client = await pool.connect();
  try {
    await client.query('begin');

    const expenseRes = await client.query(
      'select * from public.expenses where id = $1 and is_voided = false for update',
      [expenseId],
    );

    if (!expenseRes.rows[0]) {
      const err = new Error('Expense not found');
      err.status = 404;
      throw err;
    }

    const expense = expenseRes.rows[0];

    const tripRes = await client.query('select * from public.trips where id = $1 for update', [expense.trip_id]);
    const trip = tripRes.rows[0];
    if (userId && trip.owner_id !== userId) {
      throw forbidden('You do not have access to this expense');
    }

    const nextRemaining = Number(trip.remaining_budget) + Number(expense.amount_in_base);

    await client.query('update public.expenses set is_voided = true, voided_at = now() where id = $1', [expenseId]);
    const updatedTripRes = await client.query(
      'update public.trips set remaining_budget = $1 where id = $2 returning *',
      [nextRemaining, trip.id],
    );

    await client.query('commit');
    return { success: true, trip: updatedTripRes.rows[0] };
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  addExpense,
  listExpenses,
  updateExpense,
  deleteExpense,
};
