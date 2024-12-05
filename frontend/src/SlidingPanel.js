import React, { useState, useEffect, useRef } from "react";
import "./SlidingPanel.css";
import LineGraph from "./LineGraph"; // Import LineGraph component
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faTruck } from "@fortawesome/free-solid-svg-icons";
import Groups2Icon from "@mui/icons-material/Groups2";
// Import the utility function
import Nodedeatils from "./Node";
const SlidingPanel = ({ nodeDetails, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nodes, setNodes] = useState([]); // State for fetched nodes
  const [showGraph, setShowGraph] = useState(false); // State to manage the visibility of the graph
  const [sensorData, setSensorData] = useState({ methane: null, co2: null }); // State for sensor data
  const imageRef = useRef(null);

  // Fetch nodes data
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch("http://10.3.0.214:5000/api/nodes");
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

  }, []);

  // Parse bindata to extract binId, status, and images
  const parseBindata = () => {
    if (!nodeDetails || !nodeDetails.bindata) return [];

    return nodeDetails.bindata.split(",").map((binData) => {
      const [binId, status, base64Image] = binData.split("-");
      const imageName = `${nodeDetails.node_id.replace(/:/g, "-")}_${binId.replace(/[\[\]]/g, "")}_${status}_image.jpg`;

      console.log("Generated imageName: ", imageName); // Add this for debugging

      return {
        binId: binId.replace(/[\[\]]/g, ""),
        status,
        imageName,
      };
    });
  };

  const binDataArray = parseBindata();

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + binDataArray.length) % binDataArray.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % binDataArray.length);
  };

  const handleImageError = (e) => {
    e.target.src = "/images/non.png"; // Fallback to non.png if the image is not found
  };

  const handleShowLineGraph = () => {
    setShowGraph(!showGraph); // Toggle the visibility of the graph
  };

  // Filter nodes for the selected node_id
  const filteredNodes = nodes.filter((node) => node.id === nodeDetails.node_id);
  const formatTimestamp = (timestamp) => {
    if (timestamp === "NA") {
      return "NA"; // Return 'NA' if the input is 'NA'
    }

    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Format the date
  };

  return (
    <div className={`sliding-panel ${nodeDetails ? "show" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        &#10005;
      </button>
      <div className="panel-content">
        {/* Left side - Image */}

        {/* Right side - Data */}
        <div className="popup-data">
          <div className="panel-location" style={{ fontSize: "22px" }}>
          <strong>Node_id: </strong>
            {nodeDetails.node_id}
          </div>
          <div className="panel-location">
          <strong>Location: </strong>
            {filteredNodes.length > 0 ? filteredNodes.map((node, index) => <div key={index}>{`${node.location}`}</div>) : <div>Location not found for this ID.</div>}
          </div>
          <div style={{ borderTop: "2px solid grey", margin: "10px 0" }} />
          <div className="panel-location">
            <strong>Bin Data:</strong>
          </div>
          <ul>
            {binDataArray.map((bin, index) => (
              <li key={index}>
                <span className={`circle ${bin.status === "Full" ? "full" : bin.status === "Half" ? "half" : ""}`}></span>
                {`${bin.binId}: ${bin.status}`}
              </li>
            ))}
          </ul>
        

          <div className="popup-image">
  {binDataArray.length > 0 ? (
    <>
      <img
        ref={imageRef}
        src={`/images/waste_images/${binDataArray[currentImageIndex].imageName}`}
        alt={`${binDataArray[currentImageIndex].binId} - ${binDataArray[currentImageIndex].status}`}
        onError={handleImageError} // Handle image not found error
      />
      <div className="overlay-text">{`${binDataArray[currentImageIndex].binId} - ${binDataArray[currentImageIndex].status}`}</div>
      <div className="image-nav">
        <button className="nav-btn prev" onClick={handlePrevImage}>
          &#8249; {/* Previous image arrow */}
        </button>
        <button className="nav-btn next" onClick={handleNextImage}>
          &#8250; {/* Next image arrow */}
        </button>
      </div>

    </>
  ) : (
    <img src="/images/non.png" alt="No Image Available" />
  )}
</div>


          {showGraph && (
            <div className="line-graph-container">
              <LineGraph nodeId={nodeDetails.node_id} />
            </div>
          )}

<button className="line-graph-btn" onClick={handleShowLineGraph}>
  {showGraph ? "Hide Analytics" : "Show Analytics"}
</button>
<div style={{  margin: "10px 0" }} />
          <div>
            <strong>Parameter Details:</strong>
          </div>
          <div style={{  margin: "10px 0" }} />
          <div className="node-detail">
            <FontAwesomeIcon
              icon={faClock}
              style={{ marginLeft: "5px", marginRight: "10px", fontSize: "20px" }} // Set desired size here
            />
            <strong>LCT: </strong>
            {formatTimestamp(nodeDetails.lct)}
          </div>

          <div className="node-detail">
            <Groups2Icon
              style={{ marginLeft: "5px", marginRight: "10px", fontSize: "20px" }} // Set desired size here
            />
            <strong>Polluters Count: </strong>
            {nodeDetails.polluters_count}
          </div>
          <div style={{ borderTop: "2px solid grey", margin: "10px 0" }} />
          <strong>Gas Sensor Paramters: </strong>
          <div style={{ margin: "10px 0" }} />
          <div className="table-containerSS-live">
            <Nodedeatils />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;