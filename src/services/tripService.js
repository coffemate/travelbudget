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

  if (!owner_id || typeof owner_id !== 'string') {
    throw badRequest('owner_id is required');
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

async function updateTripById(tripId, payload, userId) {
  if (!isUuid(tripId)) {
    throw badRequest('tripId must be a valid UUID');
  }

  const { name, total_budget } = payload;
  if (!name || total_budget == null) {
    throw badRequest('name and total_budget are required');
  }

  const totalBudgetValue = parseNonNegativeNumber(total_budget, 'total_budget');

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

    const spent = Number(trip.total_budget) - Number(trip.remaining_budget);
    const nextRemaining = Number((totalBudgetValue - spent).toFixed(2));
    if (nextRemaining < 0) {
      throw badRequest('total_budget cannot be less than already spent amount');
    }

    const updatedRes = await client.query(
      'update public.trips set name = $1, total_budget = $2, remaining_budget = $3 where id = $4 returning *',
      [name, totalBudgetValue, nextRemaining, tripId],
    );

    await client.query('commit');
    return updatedRes.rows[0];
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteTripById(tripId, userId) {
  if (!isUuid(tripId)) {
    throw badRequest('tripId must be a valid UUID');
  }

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

    await client.query('delete from public.trips where id = $1', [tripId]);

    await client.query('commit');
    return { success: true };
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createTrip,
  getTripById,
  updateTripById,
  deleteTripById,
  isUuid,
  badRequest,
  forbidden,
};
