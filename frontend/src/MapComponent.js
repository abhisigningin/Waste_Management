import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CustomPopup from "./CustomPopup";
import GraphModal from "./GraphModal";
import LineGraph from "./LineGraph";
import SlidingPanel from "./SlidingPanel";
import nodeStaticDetails from "./Node";

import Navbar from "./Navbar";
import MapComponentCopy from "./MapComponent_copy";  // Import your copy component


const MapComponent = () => {
  const [nodes, setNodes] = useState([]);
  const [nodeDetails, setNodeDetails] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [binLocations, setBinLocations] = useState([]);
  const [binImages, setBinImages] = useState([]);
  const [showMapCopy, setShowMapCopy] = useState(false);  // State for showing MapComponent_copy

  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const initialMarkersAdded = useRef(false);

  const customIcon = (nodeId) =>
    new L.divIcon({
      className: "custom-bin-icon",
      html: `<div style="text-align: center;">
             <img src="/images/custom-icon.png" alt="Bin" style="width: 60px; height: 60px;"/>
             <div style="font-size: 9px; font-weight: bold; color: Black;">${nodeId}</div>
           </div>`,
      iconSize: [80, 80],
    });

    const handleSpatialRouteClick = () => {
      setShowMapCopy(true);  // Show the MapComponent_copy when button is clicked
    };
  
    const handleCloseMapCopy = () => {
      setShowMapCopy(false);  // Optionally handle closing MapComponent_copy
    };

  const createIcon = (url, status, label) =>
    new L.divIcon({
      className: "custom-bin-icon",
      html: `<div style="text-align: center;">
             <img src="${url}" alt="Bin" style="width: 60px; height: 60px;"/>
             <div style="font-size: 16px; font-weight: bold; color: Black;">${label}</div>
             <div style="font-size: 14px; font-weight: bold; color: ${status.toLowerCase() === "full" ? "red" : status.toLowerCase() === "none" ? "gray" : "green"};">${status}</div>
           </div>`,
      iconSize: [80, 80],
    });

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/nodes");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        const formattedNodes = data.map((node) => ({
          id: node.node_id,
          type: node.type,
          coordinates: [node.lat, node.long],
          location: node.location,
        }));
        setNodes(formattedNodes);
      } catch (error) {
        console.error("Error fetching nodes data:", error);
      }
    };

    fetchNodes();
    const interval = setInterval(fetchNodes, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNodeDetails = () => {
      fetch("http://localhost:5000/api/data")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          const details = {};
          data.forEach((node) => {
            details[node.node_id] = node;
          });
          setNodeDetails(details);
        })
        .catch((error) => console.error("Error fetching node details:", error));
    };

    fetchNodeDetails();

  }, []);

  useEffect(() => {
    if (mapRef.current && !initialMarkersAdded.current) {
      const map = mapRef.current;
  
      markerRefs.current = nodes.map((node) => {
        const marker = L.marker(node.coordinates, { icon: customIcon(node.id) })
          .addTo(map)
          .on("click", () => handleMarkerClick(node.id, node.coordinates));
  
        // Add hover event for showing gas sensor information
        marker.on("mouseover", async () => {
          try {
            const response = await fetch(
              `https://ctop.iiit.ac.in/api/nodes/get-node/WM46-0032-0001/latest`
            );
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const sensorValues = data["m2m:cin"]?.con
              ? JSON.parse(data["m2m:cin"].con.replace(/'/g, '"'))
              : "No data";
            const labels = data["m2m:cin"]?.lbl || [];
            const sensorReadings = labels.length
              ? labels.map((label, idx) => `${label}: ${sensorValues[idx]} ppm`).join(", ")
              : "No data";
            const popupContent = `
              <div>
                <p><strong>Gas sensor:</strong> ${sensorReadings}</p>
              </div>
            `;
            const popup = L.popup()
              .setLatLng(node.coordinates)
              .setContent(popupContent)
              .openOn(map);
          } catch (error) {
            console.error("Error fetching node data:", error);
          }
        });
  
        marker.on("mouseout", () => {
          map.closePopup();
        });
  
        return marker;
      });
  
      initialMarkersAdded.current = true;
    }
  }, [nodes]);
  const handleMarkerClick = async (nodeId, coordinates) => {
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
        const binDataArray = binDataStr.split("],[").map((item) => {
          const cleanItem = item.replace(/^\[|\]$/g, "").trim();
          const [key, value, ...rest] = cleanItem.split("-");
          const binData = rest.join("-");
          return { key, value, binData };
        });
  
        const images = binDataArray.map((bin) => {
          switch (bin.value.toLowerCase()) {
            case "full":
              return "/images/full.png";
            case "half":
              return "/images/half.png";
            case "none":
              return "/images/non.png";
            default:
              return "/images/default.png";
          }
        });
  
        setBinImages(images);
        setBinLocations(fixedPositions.slice(0, binDataArray.length));
  
        if (mapRef.current) {
          const map = mapRef.current;
          markerRefs.current.forEach((marker) => map.removeLayer(marker));
          markerRefs.current = [];
          map.flyTo(coordinates, 18);
  
          const boundary = L.circle(coordinates, {
            color: "blue",
            dashArray: "10, 10",
            radius: 100,
          }).addTo(map);
          markerRefs.current.push(boundary);
  
          for (let index = 0; index < binDataArray.length; index++) {
            const bin = binDataArray[index];
            const position = fixedPositions[index] || coordinates;
  
            // Create marker without hover logic
            const binMarker = L.marker(position, {
              icon: createIcon(images[index], bin.value, bin.key),
            }).addTo(map);
  
            markerRefs.current.push(binMarker);
          }
        }
      }
    }
  };const handleClosePopup = () => {
    setSelectedNodeId(null);
    setBinLocations([]);
    setShowPanel(false);
  
    if (mapRef.current) {
      const map = mapRef.current;
  
      // Remove all current markers
      markerRefs.current.forEach((marker) => map.removeLayer(marker));
      markerRefs.current = [];
  
      // Re-add original markers with event handlers
      markerRefs.current = nodes.map((node) => {
        const marker = L.marker(node.coordinates, { icon: customIcon(node.id) })
          .addTo(map)
          .on("click", () => handleMarkerClick(node.id, node.coordinates))
          .on("mouseover", async () => {
            try {
              const response = await fetch(
                `https://ctop.iiit.ac.in/api/nodes/get-node/WM46-0032-0001/latest`
              );
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              const data = await response.json();
              const sensorValues = data["m2m:cin"]?.con
                ? JSON.parse(data["m2m:cin"].con.replace(/'/g, '"'))
                : "No data";
              const labels = data["m2m:cin"]?.lbl || [];
              const sensorReadings = labels.length
                ? labels.map((label, idx) => `${label}: ${sensorValues[idx]} ppm`).join(", ")
                : "No data";
              const popupContent = `
                <div>
                  <p><strong>Gas sensor:</strong> ${sensorReadings}</p>
                </div>
              `;
              const popup = L.popup()
                .setLatLng(node.coordinates)
                .setContent(popupContent)
                .openOn(map);
            } catch (error) {
              console.error("Error fetching node data:", error);
            }
          })
          .on("mouseout", () => {
            map.closePopup();
          });
  
        return marker;
      });
    }
  };
  

  const toggleGraphModal = () => {
    setShowGraphModal(!showGraphModal);
  };

  return (
    <>
    <Navbar isPanelOpen={showPanel} /> {/* Add Navbar here */}

    {/* Render MapComponent_copy if showMapCopy is true */}
    {showMapCopy ? (
      <MapComponentCopy onClose={handleCloseMapCopy} />
    ) : (
      <MapContainer center={[17.4455, 78.3489]} zoom={16} style={{ height: "calc(91vh - 1px)", width: "100%" }} ref={mapRef}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>
    )}

    <div
      className="spatial-route-button"
      style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        zIndex: 1000,
      }}
    >
      <button style={{ padding: "10px 20px", fontSize: "16px" }} onClick={handleSpatialRouteClick}>
        Spatial Route
      </button>
    </div>
      {showPanel && <SlidingPanel nodeDetails={nodeDetails[selectedNodeId]} onClose={handleClosePopup} toggleGraphModal={toggleGraphModal} />}
      {showGraphModal && (
        <GraphModal onClose={toggleGraphModal}>
          <div style={{ width: "100%", height: "100%" }}>
            <LineGraph nodeId={nodeDetails[selectedNodeId]?.node_id} /> {/* Pass nodeId as a prop */}
          </div>
        </GraphModal>
        
      )}

    </>
  );
};

export default MapComponent;
