import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CustomPopup from './CustomPopup';
import GraphModal from './GraphModal'; // Import the GraphModal component
import LineGraph from './LineGraph';
import SlidingPanel from './SlidingPanel'; // Import the SlidingPanel component

const MapComponent = () => {
  const [nodes, setNodes] = useState([]);
  const [nodeDetails, setNodeDetails] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGraphModal, setShowGraphModal] = useState(false); // State to control LineGraph modal
  const [showPanel, setShowPanel] = useState(false); // State to control SlidingPanel visibility
  const [binLocations, setBinLocations] = useState([]); // State to store bin locations

  const mapRef = useRef(); // Ref to access the map instance
  const markerRefs = useRef([]); // Ref to store initial markers

  const customIcon = new L.Icon({
    iconUrl: '/custom-icon.png',
    iconSize: [52, 52],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const binIcon = new L.Icon({
    iconUrl: '/custom-icon.png', // Same icon for bins
    iconSize: [52, 52],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  useEffect(() => {
    fetch('/nodes.json')
      .then(response => response.json())
      .then(data => {
        setNodes(data);
      })
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

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;

      // Clear existing markers before adding new ones
      markerRefs.current.forEach(marker => map.removeLayer(marker));
      markerRefs.current = [];

      // Add new markers
      markerRefs.current = nodes.map(node => {
        const marker = L.marker(node.coordinates, { icon: customIcon })
          .addTo(map)
          .on('click', () => handleMarkerClick(node.id, node.coordinates));
        return marker;
      });
    }
  }, [nodes]);

  const handleMarkerClick = (nodeId, coordinates) => {
    setSelectedNodeId(nodeId);
    setShowPanel(true); // Show the sliding panel
    if (mapRef.current) {
      const map = mapRef.current;

      // Remove all initial markers
      markerRefs.current.forEach(marker => map.removeLayer(marker));
      markerRefs.current = [];

      map.flyTo(coordinates, 18); // Zoom into the marker

      // Draw dashed boundary
      const boundary = L.circle(coordinates, {
        color: 'blue',
        dashArray: '10, 10',
        radius: 100, // Adjust the radius as needed
      }).addTo(map);

      // Generate random positions within the boundary for bin markers
      const binPositions = [
        [coordinates[0] + (Math.random() - 0.5) * 0.001, coordinates[1] + (Math.random() - 0.5) * 0.001],
        [coordinates[0] + (Math.random() - 0.5) * 0.001, coordinates[1] + (Math.random() - 0.5) * 0.001]
      ];

      setBinLocations(binPositions);

      // Add bin markers
      binPositions.forEach(position => {
        L.marker(position, { icon: binIcon }).addTo(map);
      });
    }
  };

  const handleBinClick = (bin, nodeId) => {
    const imagePath = `/images/${nodeId}_${bin}_image.png`; // Assuming images are .jpg
    setSelectedImage(imagePath);
  };

  const handleClosePopup = () => {
    setSelectedNodeId(null);
    setSelectedImage(null);
    setBinLocations([]);
    setShowPanel(false); // Hide the sliding panel

    // Restore map to initial state
    if (mapRef.current) {
      const map = mapRef.current;

      // Remove temporary layers (dashed circle and bin markers)
      map.eachLayer(layer => {
        if (layer instanceof L.Circle || layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Re-add initial markers
      fetch('/nodes.json')
        .then(response => response.json())
        .then(data => {
          setNodes(data); // Set the nodes state which will re-render markers
        })
        .catch(error => console.error('Error re-adding markers:', error));
    }
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
        ref={mapRef}
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
              click: () => handleMarkerClick(node.id, node.coordinates),
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
                <div>
                  <strong>Bins Count:</strong> {binLocations.length}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* SlidingPanel */}
      {showPanel && (
        <SlidingPanel
          nodeDetails={nodeDetails[selectedNodeId]}
          onClose={handleClosePopup}
          toggleGraphModal={toggleGraphModal}
        />
      )}

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
