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
cap = cv2.VideoCapture("v2.mp4")  # Use a video file or RTSP stream

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
next_bin_check = datetime.now().replace(minute=59, second=0, microsecond=0) + timedelta(hours=1)  # Set for the 59th minute of the next hour
end_of_hour = next_bin_check.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

# Bin tracking variables
previous_fill_ratio = None
last_clean_time = None
hourly_data = []

# Frame rate control
fps = 5
frame_interval = 1 / fps  # Time between frames in seconds
last_frame_time = time.time()

# Bin level detection function (captures 3 frames and checks majority)
def get_bin_fill_status(frame):
    roi_cropped = frame[y:y + h, x:x + w]
    gray = cv2.cvtColor(roi_cropped, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, threshold1=50, threshold2=150)

    # Calculate fill ratio
    edge_pixels = np.count_nonzero(edges)
    total_pixels = edges.size
    fill_ratio = edge_pixels / total_pixels

    status = (
        "Full" if fill_ratio > 0.50 else
        "Half-Full" if fill_ratio > 0.20 else
        "Empty"
    )

    return fill_ratio, status


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
    # Draw the prediction lines and limits
    cv2.line(frame, (0, int(3 * frame_height // 5)), (frame_width, int(3 * frame_height // 5)), (255, 0, 0), 2)  # Blue Line
    cv2.line(frame, (0, int(3 * frame_height // 5)), (frame_width, int(3 * frame_height // 5)), (0, 0, 255), 2)  # Red Line
    cv2.line(frame, (0, frame_height // 5), (frame_width, frame_height // 5), (255, 255, 0), 1)        # Top Line
    cv2.line(frame, (0, 4 * frame_height // 5), (frame_width, 4 * frame_height // 5), (255, 255, 0), 1)  # Bottom Line



    # Continuous people counting functionality
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
    frame = cv2.putText(frame, f'UP: {cnt_up}', (10, 40), font, 0.5, (0, 0, 255), 2, cv2.LINE_AA)
    cv2.imshow('Frame', frame)

    # Bin level detection at the 59th minute of every hour
    current_time = datetime.now()
    if current_time.minute == 59 and current_time.second == 0:
        print(f"[{current_time}] Running bin level detection...")

        # Capture 3 frames and determine majority status
        bin_statuses = []
        for _ in range(3):
            ret, frame = cap.read()
            if not ret:
                print("Error: Unable to read frame for bin detection.")
                break
            fill_ratio, status = get_bin_fill_status(frame)
            bin_statuses.append(status)

        # Determine majority status from 3 frames
        majority_status = max(set(bin_statuses), key=bin_statuses.count)
        print(f"Majority Bin Fill Status: {majority_status}")

        # Update last clean time if bin fill level has decreased
        if previous_fill_ratio is not None and majority_status != previous_fill_ratio:
            last_clean_time = current_time

        # Save the current fill ratio and status
        previous_fill_ratio = majority_status

        # Update next bin check time to the next hour (59th minute of next hour)
        next_bin_check = current_time.replace(minute=59, second=0, microsecond=0) + timedelta(hours=1)

    # Save hourly data
    if current_time >= end_of_hour:
        hourly_entry = {
            "timestamp": end_of_hour.strftime("%Y-%m-%d %H:%M:%S"),
            "bin_fill_ratio": previous_fill_ratio,
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
