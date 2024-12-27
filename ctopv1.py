''' Working code'''
import cv2
import numpy as np
from datetime import datetime, timedelta
import json
import requests
import Person
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

bin_id="Bin1"
# ROI coordinates for bin occupancy detection
x, y, w, h = 491, 1, 242, 113  # Replace with actual saved values

# API URL and headers for posting data
api_url = "https://ctop.iiit.ac.in/api/cin/create/52"
headers = {"Content-Type": "application/json", "Authorization": "Bearer 5072c3397de68148f425ad4eb764a0fc"}

# Open the RTSP stream
cap = cv2.VideoCapture(url)
# cap = cv2.VideoCapture("v2.mp4")

if not cap.isOpened():
    print("Error: Unable to open RTSP stream.")
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

    ret, frame = cap.read()
    if not ret:
        print("Error: Unable to read frame from RTSP stream.")
        break

    # Resize frame
    frame = cv2.resize(frame, (frame_width, frame_height))

    # Check if it's time for bin occupancy detection
    current_time = datetime.now()
    if current_time >= next_bin_check:
        print(f"[{current_time}] Processing bin occupancy...")

        # Process ROI for bin occupancy detection
        roi_cropped = frame[y:y + h, x:x + w]
        gray = cv2.cvtColor(roi_cropped, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, threshold1=50, threshold2=150)

        # Calculate fill ratio
        edge_pixels = np.count_nonzero(edges)
        total_pixels = edges.size
        fill_ratio = edge_pixels / total_pixels

        # Update last clean time if bin is cleaned
        if previous_fill_ratio is not None and fill_ratio < previous_fill_ratio:
            last_clean_time = current_time

        # Log the bin fill status
        previous_fill_ratio = fill_ratio
        status = (
            "Full" if fill_ratio > 0.50 else
            "Half-Full" if fill_ratio > 0.20 else
            "Empty"
        )
        print(f"Bin Fill Status: {status}")
        print(f"Fill Ratio: {fill_ratio:.2f}")

        # Set the next check time to 15 minutes later
        next_bin_check = current_time + timedelta(minutes=15)

    # Draw the prediction lines and limits
    cv2.line(frame, (0, int(3 * frame_height // 5)), (frame_width, int(3 * frame_height // 5)), (255, 0, 0), 2)  # Blue Line
    cv2.line(frame, (0, int(3 * frame_height // 5)), (frame_width, int(3 * frame_height // 5)), (0, 0, 255), 2)  # Red Line
    cv2.line(frame, (0, frame_height // 5), (frame_width, frame_height // 5), (255, 255, 0), 1)        # Top Line
    cv2.line(frame, (0, 4 * frame_height // 5), (frame_width, 4 * frame_height // 5), (255, 255, 0), 1)  # Bottom Line


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
            x, y, w, h = cv2.boundingRect(cnt)
            aspect_ratio = h / w  # Height-to-width ratio

            # Filter based on aspect ratio and size
            if 1.5 <= aspect_ratio <= 4.0 and h > 50:  # Tune values as per  resolution
                # Proceed only if the object matches human-like dimensions
                M = cv2.moments(cnt)
                if M['m00'] != 0:  # Ensure division by zero doesn't occur
                    cx = int(M['m10'] / M['m00'])
                    cy = int(M['m01'] / M['m00'])
                    
                    new = True
                    if cy in range(frame_height // 5, 4 * frame_height // 5):
                        for i in persons:
                            if abs(x - i.getX()) <= w and abs(y - i.getY()) <= h:
                                new = False
                                i.updateCoords(cx, cy)

                                if i.going_UP(int(3 * frame_height // 5), int(3 * frame_height // 5)):
                                    cnt_up += 1
                                break

                        if new:
                            p = Person.MyPerson(pid, cx, cy, max_p_age)
                            persons.append(p)
                            pid += 1

                    cv2.circle(frame, (cx, cy), 5, (0, 0, 255), -1)
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    for i in persons:
        if i.timedOut():
            index = persons.index(i)
            persons.pop(index)
            del i

    # Display the frame
    #frame = cv2.putText(frame, f'UP: {cnt_up}', (10, 40), font, 0.5, (0, 0, 255), 2, cv2.LINE_AA)
    #cv2.imshow('Frame', frame)

    # Save hourly data
    if current_time >= end_of_hour:
        bin_status = (
            "Full" if fill_ratio > 0.50 else
            "Half-Full" if fill_ratio > 0.20 else
            "Empty"
        )
        
        # Encode the ROI as a base64 image
        _, buffer = cv2.imencode('.jpg', roi_cropped)
        roi_base64 = base64.b64encode(buffer).decode('utf-8')

        '''bin_data = {
            "bin1": [bin_status, roi_base64]
        }'''
	
        bin_data=f"[{bin_id}-{bin_status}-{roi_base64}]"

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
        
        cnt_up = 0
        end_of_hour += timedelta(hours=1)


    # Check for exit
    k = cv2.waitKey(30) & 0xFF
    if k == 27:  # Escape key
        print("Exiting...")
        break

cap.release()
cv2.destroyAllWindows()
