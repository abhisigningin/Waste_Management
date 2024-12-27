import cv2
import numpy as np
from datetime import datetime, timedelta
import json
import Person  
import requests
import time
import base64

# Define parameters
cnt_up = 0
username = "wm_ipc_01"
password = "iiit123"
camera_ip = "10.2.203.135"  # Your camera IP
rtsp_port = "8000"  # RTSP port
url = f"rtsp://{username}:{password}@{camera_ip}:{rtsp_port}/stream1"

frame_width = 900
frame_height = 492

bin_id = "Bin1"
# ROI coordinates for bin occupancy detection (original resolution)
roi_x, roi_y, roi_w, roi_h = 1411, 140, 741, 345  # Replace with your values

# API URL and headers for posting data
api_url = "https://ctop.iiit.ac.in/api/cin/create/51"
headers = {"Content-Type": "application/json", "Authorization": "Bearer 5072c3397de68148f425ad4eb764a0fc"}

# Retry parameters
max_retries = 5
retry_delay = 5  # Delay between retries in seconds

# Function to establish a connection to the camera
def connect_to_camera():
    retries = 0
    while retries < max_retries:
        cap = cv2.VideoCapture(url)
        if cap.isOpened():
            return cap
        else:
            print(f"Error: Unable to open RTSP stream. Retrying... ({retries + 1}/{max_retries})")
            time.sleep(retry_delay)
            retries += 1
    return None

# Connect to the camera
cap = connect_to_camera()
if cap is None:
    print("Error: Unable to establish connection to the camera after multiple retries.")
    exit()

# Background subtractor for people counting
fgbg = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
kernelOp = np.ones((3, 3), np.uint8)
kernelCl = np.ones((11, 11), np.uint8)
font = cv2.FONT_HERSHEY_SIMPLEX
persons = []
max_p_age = 5
pid = 1

# Timers
next_bin_check = datetime.now()
end_of_hour = next_bin_check.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

# Bin tracking variables
previous_fill_ratio = None
last_clean_time = None
hourly_data = []

# Frame rate control
fps = 5
frame_interval = 1 / fps  # Time between frames in seconds
last_frame_time = time.time()

# Main processing loop
while True:
    current_time = time.time()
    # Ensure processing aligns with the desired frame rate
    if current_time - last_frame_time < frame_interval:
        continue
    last_frame_time = current_time

    try:
        ret, frame = cap.read()
        if not ret:
            print("Error: Unable to read frame from RTSP stream. Retrying...")
            cap.release()
            cap = connect_to_camera()
            if cap is None:
                print("Error: Unable to reconnect to the camera after multiple retries.")
                break
            continue
    except cv2.error as e:
        print(f"CV2 error: {e}. Reconnecting to camera...")
        cap.release()
        cap = connect_to_camera()
        if cap is None:
            print("Error: Unable to reconnect to the camera after multiple retries.")
            break
        continue

    # Save a copy of the original frame for ROI extraction
    original_frame = frame.copy()

    # Resize frame for processing and display
    frame = cv2.resize(frame, (frame_width, frame_height))

    # Check if it's time for bin occupancy detection
    current_time = datetime.now()
    if current_time >= next_bin_check:
        print(f"[{current_time}] Processing bin occupancy...")

        # Process ROI for bin occupancy detection (from the original frame)
        roi_cropped = original_frame[roi_y:roi_y + roi_h, roi_x:roi_x + roi_w]
        gray = cv2.cvtColor(roi_cropped, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, threshold1=50, threshold2=150)

        # Debugging: Save the ROI and edges for inspection
        cv2.imwrite("debug_roi.jpg", roi_cropped)
        cv2.imwrite("debug_edges.jpg", edges)

        # Calculate fill ratio
        edge_pixels = np.count_nonzero(edges)
        total_pixels = edges.size
        fill_ratio = edge_pixels / total_pixels

        # Apply rolling average to stabilize fill ratio
        if previous_fill_ratio is not None:
            alpha = 0.5  # Smoothing factor
            fill_ratio = alpha * fill_ratio + (1 - alpha) * previous_fill_ratio

        # Update last clean time if bin is cleaned
        if previous_fill_ratio is not None and fill_ratio < previous_fill_ratio:
            last_clean_time = current_time

        # Log the bin fill status
        previous_fill_ratio = fill_ratio
        status = (
            "Full" if fill_ratio > 0.11 else
            "Half" if fill_ratio > 0.1 else
            "Empty"
        )
        print(f"Bin Fill Status: {status}")
        print(f"Fill Ratio: {fill_ratio:.2f}")

        # Encode the ROI as a base64 image
        _, buffer = cv2.imencode('.jpg', roi_cropped)
        print(_)
        print(buffer)
        roi_base64 = base64.b64encode(buffer).decode('utf-8')

        # Save bin data
        bin_data = f"[{bin_id}-{status}-{roi_base64}]"

        # Set the next check time to 15 minutes later
        next_bin_check = current_time + timedelta(minutes=15)

    # Continue with people counting functionality
    fgmask = fgbg.apply(frame)
    try:
        ret, imBin = cv2.threshold(fgmask, 200, 255, cv2.THRESH_BINARY)
        mask = cv2.morphologyEx(imBin, cv2.MORPH_OPEN, kernelOp)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernelCl)
    except:
        print('EOF')
        print('UP:', cnt_up)
        break

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > (frame_width * frame_height) / 250:  # Minimum area
            cnt_x, cnt_y, cnt_w, cnt_h = cv2.boundingRect(cnt)  # Use distinct variable names
            aspect_ratio = cnt_h / cnt_w  # Height-to-width ratio

            # Filter based on aspect ratio and size
            if 1.5 <= aspect_ratio <= 4.0 and cnt_h > 50:  # Tune values as per resolution
                M = cv2.moments(cnt)
                if M['m00'] != 0:  # Ensure division by zero doesn't occur
                    cx = int(M['m10'] / M['m00'])
                    cy = int(M['m01'] / M['m00'])

                    new = True
                    if cy in range(frame_height // 5, 4 * frame_height // 5):
                        for i in persons:
                            if abs(cnt_x - i.getX()) <= cnt_w and abs(cnt_y - i.getY()) <= cnt_h:
                                new = False
                                i.updateCoords(cx, cy)

                                if i.going_UP(int(2.5 * frame_height // 5), int(2.5 * frame_height // 5)):
                                    cnt_up += 1
                                break

                        if new:
                            p = Person.MyPerson(pid, cx, cy, max_p_age)
                            persons.append(p)
                            pid += 1

                    cv2.circle(frame, (cx, cy), 5, (0, 0, 255), -1)
                    cv2.rectangle(frame, (cnt_x, cnt_y), (cnt_x + cnt_w, cnt_y + cnt_h), (0, 255, 0), 2)

    for i in persons:
        if i.timedOut():
            index = persons.index(i)
            persons.pop(index)
            del i

    # Save hourly data
    if current_time >= end_of_hour:
        bin_status = (
            "Full" if fill_ratio > 0.50 else
            "Half-Full" if fill_ratio > 0.20 else
            "Empty"
        )

        hourly_entry = {
            "BinData": bin_data,
            "LCT": last_clean_time.strftime("%Y-%m-%d %H:%M:%S") if last_clean_time else "N/A",
            "Vehicle Number": "example_vehicle",
            "Polluters Count": cnt_up
        }

        # Append to the hourly data list and save to JSON
        hourly_data.append(hourly_entry)
        with open("hourly_data.json", "w") as f:
            json.dump(hourly_data, f, indent=4)

        print(f"Hourly data saved: {hourly_entry}")

        # Post the data to the API
        response = requests.post(api_url, data=json.dumps(hourly_entry), headers=headers)

        if response.status_code == 200:
            print("Data posted successfully:", response.text)
        else:
            print("Error posting data:", response.status_code, response.text)

        # Reset count only after data is posted for the hour
        cnt_up = 0
        end_of_hour += timedelta(hours=1)

    # Check for exit
    k = cv2.waitKey(30) & 0xFF
    if k == 27:  # Escape key
        print("Exiting...")
        break

cap.release()
cv2.destroyAllWindows()
