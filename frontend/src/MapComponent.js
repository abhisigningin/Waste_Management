import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CustomPopup from './CustomPopup';
import GraphModal from './GraphModal';
import LineGraph from './LineGraph';
import SlidingPanel from './SlidingPanel';
import Navbar from './Navbar';

const MapComponent = () => {
  const [nodes, setNodes] = useState([]);
  const [nodeDetails, setNodeDetails] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [binLocations, setBinLocations] = useState([]);
  const [binImages, setBinImages] = useState([]);

  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const initialMarkersAdded = useRef(false);

  const backend = 'localhost'

  const customIcon = (nodeId) => new L.divIcon({
    className: 'custom-bin-icon',
    html: `<div style="text-align: center;">
             <img src="/images/custom-icon.png" alt="Bin" style="width: 60px; height: 60px;"/>
             <div style="font-size: 9px; font-weight: bold; color: Black;">${nodeId}</div>
           </div>`,
    iconSize: [80, 80],
  });

  const createIcon = (url, status, label) => new L.divIcon({
    className: 'custom-bin-icon',
    html: `<div style="text-align: center;">
             <img src="${url}" alt="Bin" style="width: 60px; height: 60px;"/>
             <div style="font-size: 16px; font-weight: bold; color: Black;">${label}</div>
             <div style="font-size: 14px; font-weight: bold; color: ${status.toLowerCase() === 'full' ? 'red' : status.toLowerCase() === 'none' ? 'gray' : 'green'};">${status}</div>
           </div>`,
    iconSize: [80, 80],
  });

  // Combine fetching logic to be triggered once
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch nodes data
        const nodesResponse = await fetch('http://localhost:5000/api/nodes');
        if (!nodesResponse.ok) throw new Error('Network response was not ok for nodes');
        const nodesData = await nodesResponse.json();
        const formattedNodes = nodesData.map(node => ({
          id: node.node_id,
          type: node.type,
          coordinates: [node.lat, node.long],
          location: node.location
        }));
        setNodes(formattedNodes);

        // Fetch node details data
        const detailsResponse = await fetch('http://localhost:5000/api/data');
        if (!detailsResponse.ok) throw new Error('Network response was not ok for node details');
        const detailsData = await detailsResponse.json();
        const details = {};
        detailsData.forEach(node => {
          details[node.node_id] = node;
        });
        setNodeDetails(details);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // Call the fetchData function once on component mount
    fetchData();
  }, []); // This ensures fetchData is only called once when the component is mounted

  // This useEffect handles adding markers only once to the map
  useEffect(() => {
    if (mapRef.current && !initialMarkersAdded.current) {
      const map = mapRef.current;
      markerRefs.current = nodes.map(node => {
        const marker = L.marker(node.coordinates, { icon: customIcon(node.id) })
          .addTo(map)
          .on('click', () => handleMarkerClick(node.id, node.coordinates));
        return marker;
      });
      initialMarkersAdded.current = true;
    }
  }, [nodes]); // Ensure markers are only added when nodes are available

  const handleMarkerClick = (nodeId, coordinates) => {
    setSelectedNodeId(nodeId);
    setShowPanel(true);
  
    const fixedPositions = [
      [coordinates[0] + 0.0003, coordinates[1] + 0.0003],
      [coordinates[0] - 0.0003, coordinates[1] - 0.0003],
    ];
  
    if (nodeDetails[nodeId]) {
      const nodeDetail = nodeDetails[nodeId];
  
      if (nodeDetail.bindata) {
        const binDataStr = nodeDetail.bindata;
  
        // Assuming bindata is a comma-separated string, split it into an array
        const binDataArray = binDataStr.split(',').map(bin => {
          const [value, label] = bin.split(':'); // Assuming format "value:label"
          return { value: value.trim(), label: label.trim() };
        });
  
        // Set bin images based on binDataArray values
        setBinImages(binDataArray.map(bin => {
          switch (bin.value.toLowerCase()) {
            case 'full': return '/images/full.png';
            case 'half': return '/images/half.png';
            case 'none': return '/images/non.png';
            default: return '/images/default.png';
          }
        }));
  
        setBinLocations(fixedPositions.slice(0, binDataArray.length)); // Ensure we have enough positions
      }
    }
  };
  
  

  const handleClosePopup = () => {
    setSelectedNodeId(null);
    setBinLocations([]);
    setShowPanel(false);

    if (mapRef.current) {
      const map = mapRef.current;
      markerRefs.current.forEach(marker => map.removeLayer(marker));
      markerRefs.current = [];

      markerRefs.current = nodes.map(node => {
        const marker = L.marker(node.coordinates, { icon: customIcon(node.id) })
          .addTo(map)
          .on('click', () => handleMarkerClick(node.id, node.coordinates));
        return marker;
      });

      map.setZoom(16);
    }
  };

  return (
    <>
    <Navbar isPanelOpen={showPanel} /> {/* Add Navbar here */}
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
        />
      )}

      {showGraphModal && (
        <GraphModal onClose={() => setShowGraphModal(false)}>
          <LineGraph data={nodeDetails[selectedNodeId]} />
        </GraphModal>
      )}
    </>
  );
};

export default MapComponent;
