import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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
  const [showGraphModal, setShowGraphModal] = useState(false); // State to control LineGraph modal
  const [showPanel, setShowPanel] = useState(false); // State to control SlidingPanel visibility
  const [binLocations, setBinLocations] = useState([]); // State to store bin locations
  const [binImages, setBinImages] = useState([]); // State to store bin images

  const mapRef = useRef(); // Ref to access the map instance
  const markerRefs = useRef([]); // Ref to store initial markers

  const customIcon = new L.Icon({
    iconUrl: '/images/custom-icon.png',
    iconSize: [52, 52],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const createIcon = (url, status, label) => new L.divIcon({
    className: 'custom-bin-icon',
    html: `<div style="text-align: center;">
             <img src="${url}" alt="Bin" style="width: 60px; height: 60px;"/> <!-- Increased size -->
             <div style="font-size: 16px; font-weight: bold; color: Black;">${label}</div> <!-- Increased font size -->
             <div style="font-size: 14px; font-weight: bold; color: ${status === 'Full' ? 'red' : 'green'};">${status}</div> <!-- Increased font size -->
           </div>`,
    iconSize: [80, 80], // Increased icon size
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
  
    const fixedPositions = [
      [coordinates[0] + 0.0003, coordinates[1] + 0.0003], // Position for bin1
      [coordinates[0] - 0.0003, coordinates[1] - 0.0003], // Position for bin2
    ];
  
    if (nodeDetails[nodeId]) {
      const binDataStr = nodeDetails[nodeId].bin_data;
  
      console.log('Raw Bin Data String:', binDataStr);
  
      const binData = binDataStr.split(', ').reduce((acc, item) => {
        const [key, value] = item.split(':');
        acc[key] = value;
        return acc;
      }, {});
  
      console.log('Parsed Bin Data:', binData);
  
      const images = [
        binData.bin1.toLowerCase() === 'full' ? '/images/full.png' :
        binData.bin1.toLowerCase() === 'half' ? '/images/half.png' : '',
        binData.bin2.toLowerCase() === 'full' ? '/images/full.png' :
        binData.bin2.toLowerCase() === 'half' ? '/images/half.png' : '',
      ];
  
      console.log('Bin Images:', images);
      setBinImages(images);
      setBinLocations(fixedPositions);
  
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
  
        // Add bin markers with dynamic images and text
        fixedPositions.forEach((position, index) => {
          const binLabel = `Bin ${index + 1}`;
          const binText = binData[`bin${index + 1}`].toLowerCase() === 'full' ? 'Full' : 'Half';
          const binMarker = L.marker(position, { icon: createIcon(images[index], binText, binLabel) }).addTo(map);
          markerRefs.current.push(binMarker); // Track bin markers
        });
      }
    }
  };

  const handleClosePopup = () => {
    setSelectedNodeId(null);
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
      
      // Reset map zoom level to 16
      map.setZoom(16);
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
        style={{ height: 'calc(100vh - 1px)', width: '100%' }} // Adjust '50px' to account for any other UI elements
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
            {/* The Popup content is removed since we are now using divIcons directly on the map */}
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
