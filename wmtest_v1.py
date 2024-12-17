import cv2
import numpy as np
from datetime import datetime, timedelta
import json
import Person
import time

# Define parameters
cnt_up = 0
username = "wm_ipc_01"
password = "iiit123"
camera_ip = "10.2.203.135"  # Your camera IP
rtsp_port = "8000"  # RTSP port
url = f"rtsp://{username}:{password}@{camera_ip}:{rtsp_port}/stream1"

frame_width = 900
frame_height = 492

# ROI coordinates for bin occupancy detection
x, y, w, h = 491, 1, 242, 113  # Replace with actual saved values

# Open the RTSP stream
# cap = cv2.VideoCapture(url)
cap = cv2.VideoCapture("v2.mp4")

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
        if area > (frame_width * frame_height) / 250:
            M = cv2.moments(cnt)
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])
            x, y, w, h = cv2.boundingRect(cnt)

            new = True
            if cy in range(frame_height // 5, 4 * frame_height // 5):
                for i in persons:
                    if abs(x - i.getX()) <= w and abs(y - i.getY()) <= h:
                        new = False
                        i.updateCoords(cx, cy)

                        if i.going_UP(3 * frame_height // 5, 3 * frame_height // 5):
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
    frame = cv2.putText(frame, f'UP: {cnt_up}', (10, 40), font, 0.5, (0, 0, 255), 2, cv2.LINE_AA)
    cv2.imshow('Frame', frame)

    # Save hourly data
    if current_time >= end_of_hour:
        hourly_entry = {
            "timestamp": end_of_hour.strftime("%Y-%m-%d %H:%M:%S"),
            "bin_fill_ratio": fill_ratio,
            "last_clean_time": last_clean_time.strftime("%Y-%m-%d %H:%M:%S") if last_clean_time else "N/A",
            "people_count": cnt_up
        }
        hourly_data.append(hourly_entry)
        with open("hourly_data.json", "w") as f:
            json.dump(hourly_data, f, indent=4)

        print(f"Hourly data saved: {hourly_entry}")
        cnt_up = 0
        end_of_hour += timedelta(hours=1)

    # Check for exit
    k = cv2.waitKey(30) & 0xFF
    if k == 27:  # Escape key
        print("Exiting...")
        break

cap.release()
cv2.destroyAllWindows()
