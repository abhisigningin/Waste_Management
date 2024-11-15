const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'waste_data',
  password: '1234',
  port: 5432,
});

// Utility function to save base64 images
const saveBase64Image = (base64Str, filename) => {
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, ""); // Remove metadata
  const buffer = Buffer.from(base64Data, 'base64');

  const imagePath = path.join(__dirname, 'public/images/waste_images', filename);
  
  fs.writeFile(imagePath, buffer, (err) => {
    if (err) {
      console.error('Error saving image:', err);
    } else {
      console.log(`Image saved successfully: ${filename}`);
    }
  });
};

// API endpoint to fetch nodes
app.get('/api/nodes', async (req, res) => {
  try {
    console.log('Executing query to fetch node data');

    const query = `
      SELECT node_id, type, lat, long, location
      FROM nodes
      WHERE type = 'WM'
    `;
    
    const result = await pool.query(query);
    console.log('Query executed successfully', result.rows);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing node data query', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to fetch node data
app.get('/api/data', async (req, res) => {
  try {
    console.log('Executing query to fetch node data');
    
    const query = `
      SELECT DISTINCT ON (node_id) node_id, "timestamp" as timestamp, bindata, lct, vehicle_number, polluters_count
      FROM waste_management
      ORDER BY node_id, timestamp DESC limit 1
    `;
    
    const result = await pool.query(query);
    console.log('Query executed successfully', result.rows);
    
    // Process bindata to save images
    result.rows.forEach(row => {
      if (row.bindata) {
        const bins = row.bindata.split(','); // Split bindata by comma
        bins.forEach((binData) => {
          let [binId, status, base64Image] = binData.split('-');
          
          // Clean up binId
          binId = binId.replace(/[\[\]]/g, '');

          // Skip saving the image if it's 'NA'
          if (base64Image && base64Image !== 'NA') {
            const filename = `${row.node_id.replace(/:/g, '-')}_${binId}_${status}_image.jpg`;
            saveBase64Image(base64Image, filename);
          }
        });
      }
    });

    res.json(result.rows);
  } catch (err) {
    console.error('Error executing node data query', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to fetch metrics data
app.get('/api/metrics-data', async (req, res) => {
  const { period, metric, node_id } = req.query; // Ensure nodeID is extracted

  console.log('Received request with period:', period, 'and metric:', metric, 'node_id:', node_id);

  // Validate metric
  const validMetrics = ['polluters_count', 'lct'];
  if (!validMetrics.includes(metric)) {
    return res.status(400).json({ error: 'Invalid metric' });
  }

  // Determine the interval based on the period
  let query = '';
  let params = [];
  try {

    if (node_id) {
      params.push(node_id);
    }
    if (period === 'daily') {
      if (metric === 'polluters_count') {
        query = `
           WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE,                     -- Start date
              NOW(),                            -- End date
              '1 hour'::interval               -- Interval of one hour
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(SUM(wmd.polluters_count), 0) AS value
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON date_trunc('hour', wmd."timestamp") = ds.period
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      } else if (metric === 'lct') {
        query = `
          WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE,                     -- Start date
              NOW(),                            -- End date
              '1 hour'::interval               -- Interval of one hour
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(COUNT(wmd.lct), 0) AS lct_count
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON date_trunc('hour', to_timestamp(wmd.lct::bigint)) = ds.period
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      }
    } else if (period === 'weekly') {
      if (metric === 'polluters_count') {
        query = `
          WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE - INTERVAL '6 days',  -- Start date (last week)
              CURRENT_DATE,                       -- End date
              '1 day'::interval                  -- Interval of one day
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(SUM(wmd.polluters_count), 0) AS value
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON date_trunc('day', wmd."timestamp") = ds.period
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      } else if (metric === 'lct') {
        query = `
          WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE - INTERVAL '6 days',  -- Start date (last week)
              CURRENT_DATE,                       -- End date
              '1 day'::interval                  -- Interval of one day
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(COUNT(wmd.lct), 0) AS lct_count
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON DATE(to_timestamp(wmd.lct::bigint)) = ds.period
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      }
    } else if (period === 'monthly') {
      if (metric === 'polluters_count') {
        query = `
          WITH date_series AS (
            SELECT generate_series(
              DATE_TRUNC('month', CURRENT_DATE),  -- Start date (1st of the month)
              DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', -- End date (last day of the month)
              '1 week'::interval                  -- Interval of one week
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(SUM(wmd.polluters_count), 0) AS value
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON DATE(wmd."timestamp") >= ds.period
          AND DATE(wmd."timestamp") < ds.period + INTERVAL '1 week'
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      } else if (metric === 'lct') {
        query = `
          WITH date_series AS (
            SELECT generate_series(
              DATE_TRUNC('month', CURRENT_DATE),  -- Start date (1st of the month)
              DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', -- End date (last day of the month)
              '1 week'::interval                  -- Interval of one week
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(COUNT(wmd.lct), 0) AS lct_count
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON DATE(to_timestamp(wmd.lct::bigint)) >= ds.period
          AND DATE(to_timestamp(wmd.lct::bigint)) < ds.period + INTERVAL '1 week'
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      }
    } else if (period === 'yearly') {
      if (metric === 'polluters_count') {
        query = `
          WITH date_series AS (
            SELECT generate_series(
              DATE_TRUNC('year', CURRENT_DATE),  -- Start date (1st of January)
              DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day', -- End date (last day of the year)
              '1 month'::interval                  -- Interval of one month
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(SUM(wmd.polluters_count), 0) AS value
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON DATE(wmd."timestamp") >= ds.period
          AND DATE(wmd."timestamp") < ds.period + INTERVAL '1 month'
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      } else if (metric === 'lct') {
        query = `
          WITH date_series AS (
            SELECT generate_series(
              DATE_TRUNC('year', CURRENT_DATE),  -- Start date (1st of January)
              DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day', -- End date (last day of the year)
              '1 month'::interval                  -- Interval of one month
            ) AS period
          )
          SELECT ds.period, 
                 COALESCE(COUNT(wmd.lct), 0) AS lct_count
          FROM date_series ds
          LEFT JOIN waste_management wmd 
          ON DATE(to_timestamp(wmd.lct::bigint)) >= ds.period
          AND DATE(to_timestamp(wmd.lct::bigint)) < ds.period + INTERVAL '1 month'
          AND wmd.node_id = $1  -- Placeholder for node_id
          GROUP BY ds.period
          ORDER BY ds.period;
        `;
      }
    }

    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    console.log('Query result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing metrics-data query', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
