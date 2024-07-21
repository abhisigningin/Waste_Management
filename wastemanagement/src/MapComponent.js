import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CustomPopup from './CustomPopup';
import GraphModal from './GraphModal'; // Import the GraphModal component
import LineGraph from './LineGraph';

const MapComponent = () => {
  const [nodes, setNodes] = useState([]);
  const [nodeDetails, setNodeDetails] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGraphModal, setShowGraphModal] = useState(false); // State to control LineGraph modal

  const customIcon = new L.Icon({
    iconUrl: '/custom-icon.png',
    iconSize: [52, 52],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  useEffect(() => {
    fetch('/nodes.json')
      .then(response => response.json())
      .then(data => setNodes(data))
      .catch(error => console.error('Error fetching nodes data:', error));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/nodes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const details = {};
        data.forEach(node => {
          details[node.node_id] = node;
        });
        setNodeDetails(details);
      })
      .catch(error => console.error('Error fetching node details:', error));
  }, []);

  const handleMarkerClick = (nodeId) => {
    setSelectedNodeId(nodeId);
  };

  const handleBinClick = (bin, nodeId) => {
    const imagePath = `/images/${nodeId}_${bin}_image.png`; // Assuming images are .jpg
    setSelectedImage(imagePath);
  };

  const handleClosePopup = () => {
    setSelectedNodeId(null);
    setSelectedImage(null);
  };

  const toggleGraphModal = () => {
    setShowGraphModal(!showGraphModal);
  };

  return (
    <>
      <MapContainer
        center={[17.4455, 78.3489]}
        zoom={16}
        style={{ height: '700px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {nodes.map(node => (
          <Marker
            key={node.id}
            position={node.coordinates}
            icon={customIcon}
            eventHandlers={{
              click: () => handleMarkerClick(node.id),
            }}
          >
            {selectedNodeId === node.id && nodeDetails[node.id] && (
              <Popup
                position={node.coordinates}
                onClose={handleClosePopup}
              >
                <CustomPopup
                  nodeDetails={nodeDetails[node.id]}
                  onBinClick={handleBinClick}
                  onClose={handleClosePopup}
                  toggleGraphModal={toggleGraphModal} // Pass down toggle function
                />
                {selectedImage && (
                  <div>
                    <img src={selectedImage} alt="Bin Image" className="popup-image" />
                  </div>
                )}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* LineGraph modal */}
      {showGraphModal && (
        <GraphModal onClose={toggleGraphModal}>
          <div style={{ width: '100%', height: '100%' }}>
            <LineGraph nodeId={nodeDetails[selectedNodeId]?.node_id} />
          </div>
        </GraphModal>
      )}
    </>
  );
};

export default MapComponent;
