// Navbar.js
import React from 'react';
import './Navbar.css'; // Import your CSS file for styling

const Navbar = ({ isPanelOpen }) => {
  return (
    <div className={`navbar ${isPanelOpen ? 'compressed' : ''}`}>
        <div className="nav-image-wrapper left">
        <a href="https://smartcitylivinglab.iiit.ac.in/loadmaps/" target="_blank" rel="noopener noreferrer">
            <img src="/images/iiith.png" alt="IIITH Logo" className="logo" />
            <img src="/images/scrc.png" alt="Left" className="logo" />
        </a>
        </div>
      <h1 className="title">Waste Management Dashboard</h1>
      {/* <img src="/path/to/right-logo.png" alt="Right Logo" className="logo" /> */}
    </div>
  );
};

export default Navbar;
