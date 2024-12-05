
# Waste Management System

This Python script monitors and analyzes the fill levels of two waste bins using computer vision techniques. By processing video streams from an RTSP-enabled camera, the system determines bin statuses, tracks polluter activity, and sends data to a CTOP API for centralized monitoring and action.

---

## Features

- **Real-time Monitoring:** Continuously processes RTSP video streams to determine bin fill levels.
- **Status Updates:** Categorizes bins as `Full`, `Half`, or `Empty` based on predefined thresholds.
- **Polluter Tracking:** Tracks cleaning events and polluter counts for enhanced monitoring.
- **CTOP API Integration:** Sends bin data (status, images, and timestamps) to a CTOP API for centralized management.

---

## Requirements

- Python 3.x
- [OpenCV](https://opencv.org/)
- [NumPy](https://numpy.org/)
- [Requests](https://docs.python-requests.org/)

---

## Installation

### 1. Clone the Repository
Clone this repository to your local machine:
```bash
git clone https://github.com/abhisigningin/Waste_Management.git
```

### 2. Install Dependencies
Navigate to the project directory and install the required dependencies:
```bash
cd Waste_Management
pip install opencv-python numpy requests
```

---

## Configuration

### 1. Camera Settings
Update the following placeholders in `main_cv.py` with your camera’s configuration:
- **IP Address**
- **Port**
- **Username**
- **Password**

### 2. CTOP API Settings
Replace the placeholders for the CTOP API in `main_cv.py`:
- `ctop_url`: Set this to your CTOP API endpoint.
- `headers`: Configure with your API authorization token.

### 3. ROI (Region of Interest) Settings
Define the regions of interest (ROIs) for the two bins by adjusting these variables:
- `roi1` for the first bin.
- `roi2` for the second bin.

### 4. Threshold Settings
Fine-tune the fill level thresholds:
- `full_threshold_bin1`, `half_full_threshold_bin1`
- `full_threshold_bin2`, `half_full_threshold_bin2`
- Configure additional parameters for cleaning detection (`clean_frame_count_bin1`, `clean_frame_count_bin2`).

---

## Running the Script

### 1. Navigate to the Project Directory
```bash
cd Waste_Management
```

### 2. Start the Script
Run the script to begin monitoring:
```bash
python main_cv.py
```

---

## How It Works

### 1. Camera Stream
- Opens an RTSP stream from the configured camera.
- Captures video frames for processing.

### 2. Frame Processing
- Extracts ROIs corresponding to the two bins.
- Uses edge detection to identify filled areas within the bins.
- Calculates the fill ratios for each bin.

### 3. Status Determination
- Compares fill ratios against predefined thresholds to classify the bin status:
  - `Full`
  - `Half`
  - `Empty`
- Tracks the number of cleaning events and polluters.

### 4. Data Preparation
- Compiles the following data for each bin:
  - Bin ID
  - Fill level status
  - Base64-encoded image of the bin
  - Timestamp of the last clean event
  - Polluter count

### 5. API Integration
- Sends the compiled data to the CTOP API using a POST request.

### 6. Output and Monitoring
- Prints the current status of each bin to the console.
- Continuously monitors the bins, triggering actions when conditions are met.

---

## Potential Improvements

1. **Error Handling:**
   - Add exception handling for network errors, camera connection issues, and API failures.

2. **Performance Optimization:**
   - Leverage asynchronous processing or hardware acceleration (e.g., GPUs) to boost performance.

3. **Advanced Image Processing:**
   - Integrate advanced algorithms for more accurate fill level detection.

4. **Machine Learning:**
   - Utilize ML models to automatically adjust thresholds and detect anomalies.

5. **User Interface:**
   - Build a dashboard for visualizing bin statuses, historical data, and alerts.

---

## Example Output

**Console Output:**
```
Bin 1: Status = Full
Bin 2: Status = Half-Full
Data sent to CTOP API successfully.
```

**API Payload Example:**
```json
{
  "bin_id": 1,
  "status": "Full",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAA...",
  "last_clean_time": "2024-12-05T10:30:00Z",
  "polluter_count": 3
}
```

---

## Contributing

We welcome contributions! To contribute:
1. Fork this repository.
2. Create a feature branch.
3. Commit your changes and open a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For any questions or support, feel free to contact:
- **Email:** [lokabhiram@outlook.com]
- **GitHub:** [Lokabhiram](https://github.com/abhisigningin)

