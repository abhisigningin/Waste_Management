
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ArchiveIcon from '@mui/icons-material/Archive';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha, styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// Styled Menu component for customization
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 150,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[5],
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity,
        ),
      },
    },
  },
}));

const iconStyles = {
  metric: {
    backgroundColor: 'blue', // Blue background for metric
    color: 'white', // White icon color
    width: 50, // Fixed width
    height: 50, // Fixed height
    borderRadius: '50%', // Circular icons
    '&:hover': {
      backgroundColor: 'darkblue', // Darker blue on hover
    },
  },
  period: {
    backgroundColor: 'green', // Green background for period
    color: 'white', // White icon color
    width: 50, // Fixed width
    height: 50, // Fixed height
    borderRadius: '50%', // Circular icons
    '&:hover': {
      backgroundColor: 'darkgreen', // Darker green on hover
    },
  },
  download: {
    backgroundColor: '#9F2B68', // Purple background for download
    color: 'white', // White icon color
    width: 50, // Fixed width
    height: 50, // Fixed height
    borderRadius: '50%', // Circular icons
    '&:hover': {
      backgroundColor: 'purple', // Darker purple on hover
    },
  },
};

const LineGraph = ({ nodeId }) => {
  const [period, setPeriod] = useState('daily'); // Default to 'daily'
  const [metric, setMetric] = useState('polluters_count'); // Default metric
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [anchorElMetric, setAnchorElMetric] = useState(null);
  const [anchorElPeriod, setAnchorElPeriod] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state

  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
          const response = await fetch(`http://10.3.0.214:5000/api/metrics-data?period=${period}&metric=${metric}&node_id=${nodeId}`);
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          const result = await response.json();
  
          // Process data based on selected period
          let labels;
          if (period === 'daily') {
              labels = result.map(item => {
                  const date = new Date(item.period);
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format as HH:MM
              });
          } else if (period === 'weekly') {
              labels = result.map(item => {
                  const date = new Date(item.period);
                  return date.toLocaleDateString(); // Show date (e.g., "MM/DD")
              });
          } else if (period === 'monthly') {
              labels = result.map(item => {
                  const date = new Date(item.period);
                  return `Week ${getWeekNumber(date)}`; // Display the week number
              });
          } else if (period === 'yearly') {
              labels = result.map(item => {
                  const date = new Date(item.period);
                  return date.toLocaleString('default', { month: 'long' }); // Show month name
              });
          } 
  
          // Prepare data values as before
          const values = result.map(item => {
              if (metric === 'lct') {
                  return parseInt(item.lct_count, 10);
              }
              return parseInt(item.value, 10);
          });
  
          setData({
              labels,
              datasets: [
                  {
                      label: `${metric.replace('_', ' ').toUpperCase()} (${period})`,
                      data: values,
                      fill: false,
                      backgroundColor: 'rgba(75,192,192,0.2)',
                      borderColor: 'rgba(75,192,192,1)',
                  },
              ],
          });
      } catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to fetch data. Please try again.');
      } finally {
          setLoading(false);
      }
  };
  console.log(period, metric,nodeId)
  
    fetchData();
  }, [period, metric,nodeId]);
  

  // Utility function to get week number
  const getWeekNumber = (date) => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'line-graph-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Main Graph Section */}
      <div className="graph-modal" style={{ position: 'relative', height: '28vh' }}>
        <div className="graph" style={{ height: '100%' }}>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <Line 
              data={data} 
              options={{ 
                maintainAspectRatio: false,
                onClick: () => setModalOpen(true), // Open modal on graph click
              }} 
            />
          )}
        </div>
        <div className="controls" style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <IconButton onClick={(e) => setAnchorElMetric(e.currentTarget)} sx={iconStyles.metric}>
            <BorderColorIcon />
          </IconButton>
          <IconButton onClick={(e) => setAnchorElPeriod(e.currentTarget)} sx={iconStyles.period}>
            <ArrowDropDownCircleIcon />
          </IconButton>
          <IconButton onClick={handleDownload} sx={iconStyles.download}>
            <ArchiveIcon />
          </IconButton>
        </div>
        
        {/* Metric Menu */}
        <StyledMenu
          anchorEl={anchorElMetric}
          open={Boolean(anchorElMetric)}
          onClose={() => setAnchorElMetric(null)}
        >
          <MenuItem onClick={() => { setMetric('polluters_count'); setAnchorElMetric(null); }}>Polluters Count</MenuItem>
          <MenuItem onClick={() => { setMetric('lct'); setAnchorElMetric(null); }}>LCT</MenuItem>
        </StyledMenu>

        {/* Period Menu */}
        <StyledMenu
          anchorEl={anchorElPeriod}
          open={Boolean(anchorElPeriod)}
          onClose={() => setAnchorElPeriod(null)}
        >
          <MenuItem onClick={() => { setPeriod('daily'); setAnchorElPeriod(null); }}>Daily</MenuItem>
          <MenuItem onClick={() => { setPeriod('weekly'); setAnchorElPeriod(null); }}>Weekly</MenuItem>
          <MenuItem onClick={() => { setPeriod('monthly'); setAnchorElPeriod(null); }}>Monthly</MenuItem>
          <MenuItem onClick={() => { setPeriod('yearly'); setAnchorElPeriod(null); }}>Yearly</MenuItem>

        </StyledMenu>
      </div>

      {/* Modal for Enlarged Graph */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '60vh' }}>
          <div style={{ flex: 1 }}>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : (
              <Line 
                data={data} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: {
                        autoSkip: false, // Ensure all x-axis labels are visible
                      },
                    },
                  },
                }} 
              />
            )}
          </div>
          <DialogActions style={{ justifyContent: 'flex-end' }}>
            <IconButton onClick={(e) => setAnchorElMetric(e.currentTarget)} sx={iconStyles.metric}>
              <BorderColorIcon />
            </IconButton>
            <IconButton onClick={(e) => setAnchorElPeriod(e.currentTarget)} sx={iconStyles.period}>
              <ArrowDropDownCircleIcon />
            </IconButton>
            <IconButton onClick={handleDownload} sx={iconStyles.download}>
              <ArchiveIcon />
            </IconButton>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LineGraph;
