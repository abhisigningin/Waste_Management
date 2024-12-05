import React, { useState, useEffect } from "react";
import axios from "axios";
import CustomPopup from "./CustomPopup"; // Import CustomPopup component
import GasMeterIcon from '@mui/icons-material/GasMeter';
import Co2Icon from '@mui/icons-material/Co2';

const Team1 = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null); // State to track selected node
  const [isPopupOpen, setIsPopupOpen] = useState(false); // State to track popup visibility

  const fetchData = () => {
    axios
      .get("https://ctop.iiit.ac.in/api/nodes/get-node/WM46-0032-0001/latest")
      .then((response) => {
        console.log("API response:", response.data);
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();

  }, []);

  const openPopup = (nodeDetails) => {
    setSelectedNode(nodeDetails); // Set the selected node data
    setIsPopupOpen(true); // Open the popup
  };

  const closePopup = () => {
    setIsPopupOpen(false); // Close the popup
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const renderTableData = () => {
    if (!data || !data["m2m:cin"]) return null;

    const { con, lbl } = data["m2m:cin"];

    const cleanConString = con.replace(/'/g, '"');
    let conArray;
    try {
      conArray = JSON.parse(cleanConString);
    } catch (e) {
      console.error("Failed to parse con string:", e);
      return <div>Failed to parse con string</div>;
    }

    if (conArray.length !== lbl.length) {
      console.error("Mismatch between con array and lbl array lengths");
      return <div>Data mismatch error</div>;
    }

    return (
      <div className="parameter-container">
        {lbl.map((label, index) => (
          <div
            key={index}
            className="parameter"
            onClick={() => openPopup({ node_id: label, bindata: conArray[index] })}
            style={{
              display: "inline-block", // Keep the label-value pairs inline
              marginRight: "15px", // Space between label-value pairs
              marginBottom: "10px", // Space between rows
              minWidth: "200px", // Optional: Set a minimum width for each pair
            }}
          >
            <div className="label-value" style={{ display: "flex", alignItems: "center" }}>
              <span className="label-name" style={{ fontWeight: "bold", marginRight: "5px" }}>
                {/* Conditionally render GasMeterIcon for "methane" and Co2Icon for "co2" */}
                {label.toLowerCase() === "methane" && (
                  <GasMeterIcon style={{ marginRight: "5px" }} />
                )}
                {label.toLowerCase() === "co2" && (
                  <Co2Icon style={{ marginRight: "5px" }} />
                )}
                {label}: {/* The label */}
              </span>
              <span>{conArray[index]}</span> {/* The value */}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="container">{renderTableData()}</div>
      {/* Conditionally render CustomPopup if selectedNode is set */}
      {isPopupOpen && (
        <CustomPopup
          nodeDetails={selectedNode}
          closePopup={closePopup}
        />
      )}
    </div>
  );
};

export default Team1;