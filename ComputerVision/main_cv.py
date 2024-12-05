''' Posting data to ctop, phase 1 to post data of 2bins- base64 image, bin level,last clean time,pollutors count but different conditions'''

import cv2
import numpy as np
import time
import requests
import base64
from datetime import datetime

# Replace with your camera's IP, RTSP port, username, and password
username = "wm_ipc_01"
password = "iiit123"
camera_ip = "10.2.203.135"
rtsp_port = "8090"
url = f"rtsp://{username}:{password}@{camera_ip}:{rtsp_port}/stream1"

# API details for CTOP
ctop_url = "https://ctop.iiit.ac.in:443/api/cin/create/51"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer 5072c3397de68148f425ad4eb764a0fc"
}

# Load saved ROI coordinates for two bins
roi1 = (1422, 8, 624, 352)
roi2 = (2122, 198, 166, 82)
bin_id1 = "Bin1"
bin_id2 = "Bin2"

# Define conditions for each bin
full_threshold_bin1 = 0.15
half_full_threshold_bin1 = 0.07
clean_frame_count_bin1 = 4

full_threshold_bin2 = 0.2
half_full_threshold_bin2 = 0.1
clean_frame_count_bin2 = 6

# Open the video stream
cap = cv2.VideoCapture(url)
retry_attempts = 5

# Store previous fill ratio, polluters count, and last clean time for both bins
previous_fill_ratio1, previous_fill_ratio2 = None, None
consecutive_clean_frames1, consecutive_clean_frames2 = 0, 0
last_clean_time1, last_clean_time2 = 0,0
polluters_count1, polluters_count2 = 0, 0

# Convert frame to base64
def frame_to_base64(frame):
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

# Send data to CTOP endpoint and reset polluters count after posting
def post_to_ctop(data, polluters_count1, polluters_count2):
    try:
        response = requests.post(ctop_url, json=data, headers=headers)
        if response.status_code == 200:
            print("Data posted successfully:", response.text)
            # Reset polluters count after successful post
            return 0, 0  # Reset counts for both bins
        else:
            print("Error posting data:", response.status_code, response.text)
    except requests.exceptions.RequestException as e:
        print("Request failed:", e)
    return polluters_count1, polluters_count2  # Return existing counts if post fails

# Analyze frame and calculate fill ratio for a given ROI with different conditions
def process_roi(frame, roi, previous_fill_ratio, consecutive_clean_frames, last_clean_time, polluters_count, bin_id, full_threshold, half_full_threshold, clean_frame_count):
    x, y, w, h = roi
    roi_cropped = frame[y:y+h, x:x+w]

    # Convert to grayscale and detect edges
    gray = cv2.cvtColor(roi_cropped, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, threshold1=50, threshold2=150)

    # Calculate fill ratio
    edge_pixels = np.count_nonzero(edges)
    total_pixels = edges.size
    fill_ratio = edge_pixels / total_pixels

    # Determine fill status based on custom thresholds
    if fill_ratio > full_threshold:
        status = "Full"
    elif fill_ratio > half_full_threshold:
        status = "Half"
    else:
        status = "Empty"

    # Check for cleaning status
    if previous_fill_ratio is not None:
        if fill_ratio < previous_fill_ratio:
            consecutive_clean_frames += 1
            if consecutive_clean_frames >= clean_frame_count:
                last_clean_time = str(int(datetime.now().timestamp()))
                consecutive_clean_frames = 0
        else:
            consecutive_clean_frames = 0

        # Increment polluters count if fill ratio increases
        if fill_ratio > previous_fill_ratio:
            polluters_count += 1
    else:
        consecutive_clean_frames = 0

    previous_fill_ratio = fill_ratio

    # Convert the cropped ROI to a base64 image
    base64_image = frame_to_base64(roi_cropped)
    return status, base64_image, previous_fill_ratio, consecutive_clean_frames, last_clean_time, polluters_count

# Main loop
while retry_attempts > 0:
    if not cap.isOpened():
        print("Error: Unable to open RTSP stream. Retrying...")
        cap = cv2.VideoCapture(url)
        retry_attempts -= 1
        time.sleep(2)
        continue
    print("Camera feed opened successfully.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Unable to capture video frame. Reconnecting...")
            cap.release()
            cap = cv2.VideoCapture(url)
            break

        # Process Bin 1 with its specific conditions
        status1, base64_img1, previous_fill_ratio1, consecutive_clean_frames1, last_clean_time1, polluters_count1 = process_roi(
            frame, roi1, previous_fill_ratio1, consecutive_clean_frames1, last_clean_time1, polluters_count1,
            bin_id1, full_threshold_bin1, half_full_threshold_bin1, clean_frame_count_bin1
        )

        # Process Bin 2 with its specific conditions
        status2, base64_img2, previous_fill_ratio2, consecutive_clean_frames2, last_clean_time2, polluters_count2 = process_roi(
            frame, roi2, previous_fill_ratio2, consecutive_clean_frames2, last_clean_time2, polluters_count2,
            bin_id2, full_threshold_bin2, half_full_threshold_bin2, clean_frame_count_bin2
        )

        # Prepare the data to send to CTOP
        timestamp = datetime.now().isoformat()
        bin_data = f"[{bin_id1}-{status1}-{base64_img1}],[{bin_id2}-{status2}-{base64_img2}]"
        
        data = {
            "BinData": bin_data,
            #"LCT": str(last_clean_time1),
            "LCT": "1732060801",
            "Vehicle Number": "0",
            "Polluters Count": polluters_count1
        }

        # # Post data to the CTOP API
        # post_to_ctop(data)
        # Post data to the CTOP API and reset polluters count if successful
        polluters_count1, polluters_count2 = post_to_ctop(data, polluters_count1, polluters_count2)


        # Print the results for both bins
        print(f"Timestamp: {timestamp}")
        print(f"Bin 1 - Status: {status1}, Fill Ratio: {previous_fill_ratio1:.2f}, Last Clean Time: {last_clean_time1}, Polluters Count: {polluters_count1}")
        print(f"Bin 2 - Status: {status2}, Fill Ratio: {previous_fill_ratio2:.2f}, Last Clean Time: {last_clean_time2}, Polluters Count: {polluters_count2}")

        # Press 'q' to exit
        if cv2.waitKey(1000) & 0xFF == ord('q'):
            retry_attempts = 0
            break

        # Wait for 5 minutes before capturing the next frame
        time.sleep(3600)

# Release resources
cap.release()
cv2.destroyAllWindows()
