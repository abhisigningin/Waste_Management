import React, { useState, useEffect } from 'react';
import './CustomPopup.css';

const CustomPopup = ({ nodeDetails, onBinClick, onClose, toggleGraphModal }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = nodeDetails ? [
    `${nodeDetails.node_id}_bin1_image.png`,
    `${nodeDetails.node_id}_bin2_image.png`
  ] : [];

  const binNames = ["bin1", "bin2"];

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const parseViolations = (violationsObj) => {
    return Object.keys(violationsObj).map(key => (
      <div key={key}>
        <strong>{key}: </strong> {violationsObj[key][0]}
      </div>
    ));
  };

  useEffect(() => {
    // Trigger animation or other effects on component mount if needed
  }, []);

  return (
    <div className="popup-content">
      {/* Left side - Image */}
      <div className="popup-image">
        <img
          src={`/images/${images[currentImageIndex]}`}
          alt={`Bin ${currentImageIndex + 1}`}
          style={{ width: '100%', height: '100%', maxWidth: '300px', maxHeight: '100px' }}
        />
        <div className="overlay-text">
          {binNames[currentImageIndex]}
        </div>
        <div className="image-nav" style={{ position: 'absolute', top: '25%', transform: 'translateY(-50%)', left: 0, right: 0, textAlign: 'center' }}>
          <button className="nav-btn prev" onClick={handlePrevImage} style={{ position: 'absolute', left: '20px', background: '#31363f', border: 'none', fontSize: '15px', color: '#fff' }}>
            &#8249; {/* Previous image arrow */}
          </button>
          <button className="nav-btn next" onClick={handleNextImage} style={{ position: 'absolute', right: '25px', background: '#31363f', border: 'none', fontSize: '15px', color: '#fff' }}>
            &#8250; {/* Next image arrow */}
          </button>
        </div>
      </div>

      {/* Right side - Data */}
      <div className="popup-data">
        <div>
          <strong>Node ID:</strong> {nodeDetails.node_id}
        </div>
        <div>
          <strong>Bin Data:</strong> {nodeDetails.bin_data}
        </div>
        <div>
          <strong>LCT:</strong> {nodeDetails.lct}
        </div>
        <div>
          <strong>CS:</strong> {nodeDetails.cs}
        </div>
        <div>
          <strong>Violations:</strong> {nodeDetails.violations && parseViolations(JSON.parse(nodeDetails.violations))}
        </div>
      </div>

      {/* Button to toggle LineGraph modal */}
      <button onClick={toggleGraphModal}>
        Show Line Graph
      </button>
    </div>
  );
};

export default CustomPopup;
