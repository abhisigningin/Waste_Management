// GraphModal.js
import React from 'react';
import './GraphModal.css';

const GraphModal = ({ children, onClose }) => {
  return (
    <div className="graph-modal-container">
      <div className="backdrop"></div>
      <div className="graph-modal">
        <div className="modal-content">
          <button className="close-btn" onClick={onClose}>×</button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default GraphModal;
