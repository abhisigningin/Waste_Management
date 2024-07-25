import React, { useState, useEffect, useRef } from 'react';
import './SlidingPanel.css';
import LineGraph from './LineGraph'; // Import LineGraph component

const SlidingPanel = ({ nodeDetails, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [initialY, setInitialY] = useState(0);

  const imageRef = useRef(null);

  const images = nodeDetails ? [
    `${nodeDetails.node_id}_bin1_image.png`,
    `${nodeDetails.node_id}_bin2_image.png`
  ] : [];

  const binNames = ["Bin 1", "Bin 2"];

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const parseViolations = (violationsObj) => {
    return Object.keys(violationsObj).map(key => (
      <div key={key}>
        Version {key}- 
        <span>{violationsObj[key][0]}</span> {/* Wrap value in a span */}
      </div>
    ));
  };

  const handleMouseDown = (e) => {
    if (imageRef.current) {
      setStartX(e.clientX);
      setStartY(e.clientY);
      setInitialX(imageRef.current.offsetLeft);
      setInitialY(imageRef.current.offsetTop);
    }
  };
  return (
    <div className={`sliding-panel ${nodeDetails ? 'show' : ''}`}>
      <button className="close-btn" onClick={onClose}>&#10005;</button>
      <div className="panel-content">
        {/* Left side - Image */}
        <div className="popup-image">
          <img
            ref={imageRef}
            src={`/images/${images[currentImageIndex]}`}
            alt={`Bin ${currentImageIndex + 1}`}
            onMouseDown={handleMouseDown}
          />
          <div className="overlay-text">
            {binNames[currentImageIndex]}
          </div>
          <div className="image-nav">
            <button className="nav-btn prev" onClick={handlePrevImage}>
              &#8249; {/* Previous image arrow */}
            </button>
            <button className="nav-btn next" onClick={handleNextImage}>
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

        {/* Always render LineGraph */}
        <div className="line-graph-container">
          <LineGraph nodeId={nodeDetails.node_id} />
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;
