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
    minWidth: 180,
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
  status: {
    backgroundColor: 'blue', // Blue background for status
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
    backgroundColor: '#9F2B68', // Red background for download
    color: 'white', // White icon color
    width: 50, // Fixed width
    height: 50, // Fixed height
    borderRadius: '50%', // Circular icons
    '&:hover': {
      backgroundColor: 'purple', // Darker red on hover
    },
  },
};

const LineGraph = ({ nodeId }) => {
  const [period, setPeriod] = useState('weekly');
  const [status, setStatus] = useState('cleaned');
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [anchorElStatus, setAnchorElStatus] = useState(null);
  const [anchorElPeriod, setAnchorElPeriod] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/cs-data?period=${period}&cs=${status}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();

        // Assuming result is an array of objects with period and count
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
      <div className="graph-modal" style={{ position: 'relative', height: '40vh' }}>
        <div className="graph" style={{ height: '100%' }}>
          <Line 
            data={data} 
            options={{ 
              maintainAspectRatio: false,
              onClick: () => setModalOpen(true), // Open modal on graph click
            }} 
          />
        </div>
        <div className="controls" style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <IconButton onClick={(e) => setAnchorElStatus(e.currentTarget)} sx={iconStyles.status}>
            <BorderColorIcon />
          </IconButton>
          <IconButton onClick={(e) => setAnchorElPeriod(e.currentTarget)} sx={iconStyles.period}>
            <ArrowDropDownCircleIcon />
          </IconButton>
          <IconButton onClick={handleDownload} sx={iconStyles.download}>
            <ArchiveIcon />
          </IconButton>
        </div>

        {/* Status Menu */}
        <StyledMenu
          anchorEl={anchorElStatus}
          open={Boolean(anchorElStatus)}
          onClose={() => setAnchorElStatus(null)}
        >
          <MenuItem onClick={() => { setStatus('Cleaned'); setAnchorElStatus(null); }}>Cleaned</MenuItem>
          <MenuItem onClick={() => { setStatus('Uncleaned'); setAnchorElStatus(null); }}>Uncleaned</MenuItem>
        </StyledMenu>

        {/* Period Menu */}
        <StyledMenu
          anchorEl={anchorElPeriod}
          open={Boolean(anchorElPeriod)}
          onClose={() => setAnchorElPeriod(null)}
        >
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
          </div>
          <DialogActions style={{ justifyContent: 'flex-end' }}>
            <IconButton onClick={(e) => setAnchorElStatus(e.currentTarget)} sx={iconStyles.status}>
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
