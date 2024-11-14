import React from 'react';

const Modal = ({ image, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <img src={image} alt="Bin" />
      </div>
    </div>
  );
};

export default Modal;
