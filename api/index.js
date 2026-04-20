// 本地开发需要加载 .env，生产环境 Vercel 会自动注入
require('dotenv').config();
const express = require('express');
const pool = require('./lib/db.js');

const app = express();
app.use(express.json());

// 获取所有旅行计划
app.get('/api/trips', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM trips ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips', details: err.message });
  }
});

// 创建新旅行
app.post('/api/trips', async (req, res) => {
  const { name, destination, budget } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO trips (name, destination, budget) VALUES ($1, $2, $3) RETURNING *',
      [name, destination, budget]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create trip', details: err.message });
  }
});

// 获取特定旅行的所有支出
app.get('/api/expenses', async (req, res) => {
  const { trip_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM expenses WHERE trip_id = $1 ORDER BY date DESC',
      [trip_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses', details: err.message });
  }
});

// 添加支出记录
app.post('/api/expenses', async (req, res) => {
  const { trip_id, title, amount, category, date } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO expenses (trip_id, title, amount, category, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [trip_id, title, amount, category, date || new Date()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense', details: err.message });
  }
});

module.exports = app;
