// ******************buttons for images************************************

// // src/CustomPopup.js
// import React from 'react';
// import './CustomPopup.css'; // Ensure this file is imported for styles

// const CustomPopup = ({ nodeDetails, onBinClick, onClose }) => {
//   return (
//     <div className="popup-content">
//       <div>
//         <strong>Node ID:</strong> {nodeDetails.node_id}<br />
//         <strong>Bin Data:</strong> {nodeDetails.bin_data}<br />
//         <button onClick={() => onBinClick('bin1', nodeDetails.node_id)}>bin1</button>
//         <button onClick={() => onBinClick('bin2', nodeDetails.node_id)}>bin2</button><br />
//         <strong>LCT:</strong> {nodeDetails.lct}<br />
//         <strong>CS:</strong> {nodeDetails.cs}<br />
//         <strong>Violations:</strong> {nodeDetails.violations}
//       </div>
//     </div>
//   );
// };

// export default CustomPopup;




// **********************************************naviagtions arrows at down****************************************************
// // CustomPopup.js
// #1
// import React, { useState } from 'react';

// const CustomPopup = ({ nodeDetails, onBinClick, onClose }) => {
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const images = [`${nodeDetails.node_id}_bin1_image.png`, `${nodeDetails.node_id}_bin2_image.png`]; // Replace with your image paths

//   const handlePrevImage = () => {
//     setCurrentImageIndex(prevIndex => (prevIndex - 1 + images.length) % images.length);
//   };

//   const handleNextImage = () => {
//     setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
//   };

//   return (
//     <div className="popup-content">
//       {/* Left side - Data */}
//       <div className="popup-left">
//         <h2>Data Details</h2>
//         <ul>
//           <li> <strong>Bin Data:</strong> {nodeDetails.bin_data}<br /></li>
//           <li><strong>LCT:</strong> {nodeDetails.lct}</li>
//           <li><strong>CS:</strong> {nodeDetails.cs}</li>
//           <li><strong>Violations:</strong> {nodeDetails.violations}</li>
//           {/* Add more data points as needed */}
//         </ul>
//       </div>

//       {/* Right side - Images with navigation */}
//       <div className="popup-right">
//         <h2>Bin Images</h2>
//         <div className="image-container">
//           <img src={`/images/${images[currentImageIndex]}`} alt={`Bin ${currentImageIndex + 1}`} />
//         </div>
//         <div className="image-nav">
//           <button onClick={handlePrevImage}>&#8249;</button> {/* Previous image arrow */}
//           <button onClick={handleNextImage}>&#8250;</button> {/* Next image arrow */}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomPopup;




// ***********************************************naviagtion arrows on iamges***********************************************
// CustomPopup.js
// #2
import React, { useState } from 'react';

const CustomPopup = ({ nodeDetails, onBinClick, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    `${nodeDetails.node_id}_bin1_image.png`,
    `${nodeDetails.node_id}_bin2_image.png`
  ]; // Replace with your image paths

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <div className="popup-content">
      {/* Left side - Image */}
      <div className="popup-image">
        <img
          src={`/images/${images[currentImageIndex]}`}
          alt={`Bin ${currentImageIndex + 1}`}
          style={{ width: '100%', height: '100%', maxWidth: '300px',maxHeight:'200px' }}
        />
        <div className="image-nav" style={{ position: 'absolute', top: '25%', transform: 'translateY(-50%)', left: 0, right: 0, textAlign: 'center' }}>
          <button className="nav-btn prev" onClick={handlePrevImage} style={{ position: 'absolute', left: '30px' }}>
            &#8249; {/* Previous image arrow */}
          </button>
          <button className="nav-btn next" onClick={handleNextImage} style={{ position: 'absolute', right: '35px' }}>
            &#8250; {/* Next image arrow */}
          </button>
        </div>
      </div>

      {/* Right side - Data */}
      <div className="popup-data">
        {/* <h2>Data Details</h2> */}
        <ul>
          <li>
            <strong>Bin Data:</strong> {nodeDetails.bin_data}
          </li>
          <li>
            <strong>LCT:</strong> {nodeDetails.lct}
          </li>
          <li>
            <strong>CS:</strong> {nodeDetails.cs}
          </li>
          <li>
            <strong>Violations:</strong> {nodeDetails.violations}
          </li>
          {/* Add more data points as needed */}
        </ul>
      </div>
    </div>
  );
};

export default CustomPopup;


// *************************************************************************************************************************************************
import React, { useState, useEffect } from 'react';
import './CustomPopup.css';

const CustomPopup = ({ nodeDetails, onBinClick, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showData, setShowData] = useState(false);
  const [showDataDetails, setShowDataDetails] = useState(false);

  const images = [
    `${nodeDetails.node_id}_bin1_image.png`,
    `${nodeDetails.node_id}_bin2_image.png`
  ]; // Replace with your image paths

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
    </div>
  );
};

export default CustomPopup;
