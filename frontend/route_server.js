// server.js or your backend controller file
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs'); // Import the fs module to handle file operations
const cors = require('cors'); // Import the cors package

const app = express();
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '1234',
  port: 5432,
});

// Enable CORS for requests from localhost:3001
app.use(cors({
  origin: 'http://localhost:3001', // You can also use '*' to allow all origins (not recommended for production)
}));

// Function to fetch data and save it as JSON
async function fetchDataAndSave() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (id) id, location, coordinates, aqi 
      FROM air_data 
      ORDER BY id, timestamp DESC;
    `);
    const path = require('path'); // Import path module
    // Map over the results to transform the coordinates
    const formattedData = result.rows.map(row => {
      const coordinates = row.coordinates
        .replace(/[()]/g, '')         // Remove parentheses
        .split(',')                   // Split by comma
        .map(coord => parseFloat(coord)); // Convert each part to a float
      
      return { ...row, coordinates }; // Replace coordinates with parsed array
    });
    const filePath = path.join(__dirname, 'public', 'output.json');
    // Save the formatted data as JSON in a file
    fs.writeFile(filePath, JSON.stringify(formattedData, null, 2), (err) => {
      if (err) {
        console.error('Error writing JSON to file:', err);
      } else {
        console.log('Data saved to output.json');
      }
    });
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

// Call fetchDataAndSave every 10 seconds
setInterval(fetchDataAndSave, 10000); // 10,000 milliseconds = 10 seconds

// API to get the latest AQI data for each node
app.get('/api/nodes', async (req, res) => {
  try {
    const data = fs.readFileSync('./public/output.json', 'utf8'); // Read data from file
    res.json(JSON.parse(data)); // Send data as JSON response
  } catch (err) {
    console.error('Error reading JSON file:', err);
    res.status(500).send('Server error');
  }
});

// Listen on a port
app.listen(5002, () => console.log('Server running on port 5000'));
