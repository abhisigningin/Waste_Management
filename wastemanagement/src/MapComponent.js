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

  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const initialMarkersAdded = useRef(false);

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

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/nodes');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const formattedNodes = data.map(node => ({
          id: node.node_id,
          type: node.type,
          coordinates: [node.lat, node.long],
          location:node.location
        }));
        setNodes(formattedNodes);
      } catch (error) {
        console.error('Error fetching nodes data:', error);
      }
    };
    

    fetchNodes();
    const interval = setInterval(fetchNodes, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    const fetchNodeDetails = () => {
      fetch('http://localhost:5000/api/data')
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
    };

    fetchNodeDetails();
    const interval = setInterval(fetchNodeDetails, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

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
  }, [nodes]);

  const handleMarkerClick = (nodeId, coordinates) => {
    setSelectedNodeId(nodeId);
    setShowPanel(true);

    // Define fixed positions for bins relative to the main marker
    const fixedPositions = [
      [coordinates[0] + 0.0003, coordinates[1] + 0.0003], // Position for Bin1
      [coordinates[0] - 0.0003, coordinates[1] - 0.0003], // Position for Bin2
      // Add more positions here if you have more bins
    ];

    if (nodeDetails[nodeId]) {
      const nodeDetail = nodeDetails[nodeId];
      console.log('Node Details:', nodeDetail);

      if (nodeDetail.bindata) {
        const binDataStr = nodeDetail.bindata;

        // Split the bindata string by '],[' to separate Bin1 and Bin2
        const binDataArray = binDataStr.split('],[').map(item => {
          // Remove any leading or trailing brackets or spaces
          const cleanItem = item.replace(/^\[|\]$/g, '').trim();
          const [key, value, ...rest] = cleanItem.split('-');
          // If there are additional '-' in the base64 data, join them back
          const binData = rest.join('-');
          return { key, value, binData };
        });

        // Set images based on bin data
        const images = binDataArray.map(bin => {
          switch (bin.value.toLowerCase()) {
            case 'full':
              return '/images/full.png';
            case 'half':
              return '/images/half.png';
            case 'none':
              return '/images/non.png';
            default:
              return '/images/default.png';
          }
        });

        setBinImages(images);
        setBinLocations(fixedPositions.slice(0, binDataArray.length)); // Ensure we have enough positions

        if (mapRef.current) {
          const map = mapRef.current;

          // Clear existing markers before adding new ones
          markerRefs.current.forEach(marker => map.removeLayer(marker));
          markerRefs.current = [];

          map.flyTo(coordinates, 18);

          // Draw dashed boundary around the main marker
          const boundary = L.circle(coordinates, {
            color: 'blue',
            dashArray: '10, 10',
            radius: 100,
          }).addTo(map);

          markerRefs.current.push(boundary);

          // Add bin markers with dynamic images and text
          binDataArray.forEach((bin, index) => {
            const position = fixedPositions[index] || coordinates; // Fallback to main coordinates if no position defined
            const binLabel = bin.key; // e.g., Bin1 or Bin2
            const binStatus = bin.value; // e.g., Full, Half, None
            const binMarker = L.marker(position, { icon: createIcon(images[index], binStatus, binLabel) }).addTo(map);

            markerRefs.current.push(binMarker);
          });
        }
      } else {
        console.error(`bindata is not available for nodeId: ${nodeId}`);
      }
    } else {
      console.error(`Node details not found for nodeId: ${nodeId}`);
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
