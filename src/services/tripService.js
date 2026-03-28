const pool = require('../db/pool');

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function forbidden(message = 'Forbidden') {
  const err = new Error(message);
  err.status = 403;
  return err;
}

function parseNonNegativeNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw badRequest(`${fieldName} must be a valid number >= 0`);
  }
  return n;
}

async function createTrip(payload) {
  const {
    owner_id,
    name,
    description,
    start_date,
    end_date,
    base_currency,
    total_budget,
  } = payload;

  if (!owner_id || !isUuid(owner_id)) {
    throw badRequest('owner_id must be a valid UUID');
  }

  if (!name || !start_date || !end_date || !base_currency || total_budget == null) {
    throw badRequest('name, start_date, end_date, base_currency, total_budget are required');
  }

  if (String(base_currency).trim().length !== 3) {
    throw badRequest('base_currency must be a 3-letter currency code');
  }

  const totalBudgetValue = parseNonNegativeNumber(total_budget, 'total_budget');

  const query = `
    insert into public.trips
      (owner_id, name, description, start_date, end_date, base_currency, total_budget, remaining_budget)
    values
      ($1, $2, $3, $4, $5, upper($6), $7, $7)
    returning *
  `;

  const { rows } = await pool.query(query, [
    owner_id,
    name,
    description || null,
    start_date,
    end_date,
    base_currency,
    totalBudgetValue,
  ]);

  return rows[0];
}

async function getTripById(tripId, userId) {
  if (!isUuid(tripId)) {
    throw badRequest('tripId must be a valid UUID');
  }

  const { rows } = await pool.query('select * from public.trips where id = $1', [tripId]);
  if (!rows[0]) {
    const err = new Error('Trip not found');
    err.status = 404;
    throw err;
  }

  if (userId && rows[0].owner_id !== userId) {
    throw forbidden('You do not have access to this trip');
  }

  return rows[0];
}

module.exports = {
  createTrip,
  getTripById,
  isUuid,
  badRequest,
  forbidden,
};
