import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CustomPopup from './CustomPopup';
import GraphModal from './GraphModal';
import LineGraph from './LineGraph';
import SlidingPanel from './SlidingPanel';

const MapComponent = () => {
  const [nodes, setNodes] = useState([]);
  const [nodeDetails, setNodeDetails] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [binLocations, setBinLocations] = useState([]);
  const [binImages, setBinImages] = useState([]);

  const mapRef = useRef();
  const markerRefs = useRef([]);
  const initialMarkersAdded = useRef(false); // Track if initial markers have been added

  const customIcon = new L.Icon({
    iconUrl: '/images/custom-icon.png',
    iconSize: [52, 52],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const createIcon = (url, status, label) => new L.divIcon({
    className: 'custom-bin-icon',
    html: `<div style="text-align: center;">
             <img src="${url}" alt="Bin" style="width: 60px; height: 60px;"/>
             <div style="font-size: 16px; font-weight: bold; color: Black;">${label}</div>
             <div style="font-size: 14px; font-weight: bold; color: ${status === 'Full' ? 'red' : 'green'};">${status}</div>
           </div>`,
    iconSize: [80, 80],
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

  useEffect(() => {
    if (mapRef.current && !initialMarkersAdded.current) {
      const map = mapRef.current;
      markerRefs.current = nodes.map(node => {
        const marker = L.marker(node.coordinates, { icon: customIcon })
          .addTo(map)
          .on('click', () => handleMarkerClick(node.id, node.coordinates));
        return marker;
      });
      initialMarkersAdded.current = true; // Mark that initial markers have been added
    }
  }, [nodes]);

  const handleMarkerClick = (nodeId, coordinates) => {
    setSelectedNodeId(nodeId);
    setShowPanel(true);

    const fixedPositions = [
      [coordinates[0] + 0.0003, coordinates[1] + 0.0003],
      [coordinates[0] - 0.0003, coordinates[1] - 0.0003],
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

        // Clear existing markers before adding new ones
        markerRefs.current.forEach(marker => map.removeLayer(marker));
        markerRefs.current = [];

        map.flyTo(coordinates, 18);

        // Draw dashed boundary
        const boundary = L.circle(coordinates, {
          color: 'blue',
          dashArray: '10, 10',
          radius: 100,
        }).addTo(map);

        // Add bin markers with dynamic images and text
        fixedPositions.forEach((position, index) => {
          const binLabel = `Bin ${index + 1}`;
          const binText = binData[`bin${index + 1}`].toLowerCase() === 'full' ? 'Full' : 'Half';
          const binMarker = L.marker(position, { icon: createIcon(images[index], binText, binLabel) }).addTo(map);
          markerRefs.current.push(binMarker);
        });

        // Add boundary to markerRefs to be removed later
        markerRefs.current.push(boundary);
      }
    }
  };

  const handleClosePopup = () => {
    setSelectedNodeId(null);
    setBinLocations([]);
    setShowPanel(false);

    if (mapRef.current) {
      const map = mapRef.current;

      // Remove temporary layers (dashed circle and bin markers)
      markerRefs.current.forEach(marker => map.removeLayer(marker));
      markerRefs.current = [];

      // Re-add initial markers
      markerRefs.current = nodes.map(node => {
        const marker = L.marker(node.coordinates, { icon: customIcon })
          .addTo(map)
          .on('click', () => handleMarkerClick(node.id, node.coordinates));
        return marker;
      });

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
        style={{ height: 'calc(100vh - 1px)', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      {showPanel && (
        <SlidingPanel
          nodeDetails={nodeDetails[selectedNodeId]}
          onClose={handleClosePopup}
          toggleGraphModal={toggleGraphModal}
        />
      )}

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
