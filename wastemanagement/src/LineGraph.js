// LineGraph.js
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const LineGraph = ({ nodeId }) => {
  const [period, setPeriod] = useState('weekly');
  const [status, setStatus] = useState('cleaned');
  const [data, setData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/cs-data?period=${period}&cs=${status}`);
        const result = await response.json();

        const labels = result.map(item => item.period);
        const values = result.map(item => item.count);

        setData({
          labels,
          datasets: [
            {
              label: `${status} (${period})`,
              data: values,
              fill: false,
              backgroundColor: 'rgba(75,192,192,0.2)',
              borderColor: 'rgba(75,192,192,1)',
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [period, status]);

  return (
    <div>
      <div>
        <label>
          Status:
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Cleaned">Cleaned</option>
            <option value="Uncleaned">Uncleaned</option>
          </select>
        </label>
        <label>
          Period:
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
      </div>
      <Line data={data} />
    </div>
  );
};

export default LineGraph;
