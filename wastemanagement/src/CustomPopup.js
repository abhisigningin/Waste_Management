import React, { useState, useEffect } from 'react';
import './CustomPopup.css';
import LineGraph from './LineGraph';

const CustomPopup = ({ nodeDetails, onBinClick, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showData, setShowData] = useState(false);
  const [showDataDetails, setShowDataDetails] = useState(false);
  const [showLineGraph, setShowLineGraph] = useState(false);

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
    setShowData(true); // Trigger animation on component mount
    const timer = setTimeout(() => {
      setShowDataDetails(true); // Trigger detailed data animation
    }, 500); // Adjust the delay as needed
    return () => clearTimeout(timer);
  }, []);

  const toggleLineGraph = () => {
    setShowLineGraph(!showLineGraph);
  };

  if (!nodeDetails) {
    return null; // or return some placeholder content
  }

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
      <div className={`popup-data ${showData ? 'show' : ''}`}>
        <div style={{ transitionDelay: '0.5s' }}>
          <strong>Node ID:</strong> {nodeDetails.node_id}
        </div>
        <div style={{ transitionDelay: '1s' }}>
          <strong>Bin Data:</strong> {nodeDetails.bin_data}
        </div>
        <div style={{ transitionDelay: '1.5s' }}>
          <strong>LCT:</strong> {nodeDetails.lct}
        </div>
        <div style={{ transitionDelay: '2s' }}>
          <strong>CS:</strong> {nodeDetails.cs}
        </div>
        <div style={{ transitionDelay: '2.5s' }}>
          <strong>Violations:</strong> {nodeDetails.violations && parseViolations(JSON.parse(nodeDetails.violations))}
        </div>
      </div>

      <button onClick={toggleLineGraph}>
        {showLineGraph ? 'Hide Line Graph' : 'Show Line Graph'}
      </button>
      
      {showLineGraph && <LineGraph nodeId={nodeDetails.node_id} />}
    </div>
  );
};

export default CustomPopup;
