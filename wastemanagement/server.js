const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5000;

app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'data',
  password: '1234',
  port: 5432,
});

// API endpoint to fetch node data
app.get('/api/nodes', async (req, res) => {
  try {
    console.log('Executing query to fetch node data');
    const query = `
      SELECT DISTINCT ON (node_id) node_id, "Timestamp" as timestamp, bin_data, LCT, CS, Violations
      FROM wastemanagement
      ORDER BY node_id, timestamp DESC
    `;
    const result = await pool.query(query);
    console.log('Query executed successfully', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing node data query', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to fetch CS and timestamp data
// API endpoint to fetch CS and timestamp data
app.get('/api/cs-data', async (req, res) => {
  const { period, cs } = req.query;

  console.log('Received request with period:', period, 'and CS:', cs);

  let interval = '';
  if (period === 'weekly') {
    interval = 'week'; // Use 'week' directly for PostgreSQL
  } else if (period === 'monthly') {
    interval = 'month';
  } else if (period === 'yearly') {
    interval = 'year';
  } else {
    console.log('Invalid period:', period);
    return res.status(400).json({ error: 'Invalid period' });
  }

  try {
    console.log('Interval period used in query:', interval); // Log the interval period

    const query = `
      SELECT
        date_trunc('${interval}', "Timestamp") AS period,
        COUNT(*) AS count
      FROM wastemanagement
      WHERE CS = $1
      GROUP BY period
      ORDER BY period
    `;
    console.log('Executing query:', query, 'with parameter:', cs);
    const result = await pool.query(query, [cs]);
    console.log('Query result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing cs-data query', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
