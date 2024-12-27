import cv2
import time
from datetime import datetime

# RTSP URL with credentials
username = "wm_ipc_01"
password = "iiit123"
camera_ip = "10.2.203.135"
rtsp_port = "8000"
url = f"rtsp://{username}:{password}@{camera_ip}:{rtsp_port}/stream1"

# Open the RTSP stream
cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("Error: Could not open the camera stream.")
    exit()

print("Connected to the camera stream. Capturing frames every 3 minutes...")

# Capture a frame every 3 minutes (180 seconds)
while True:
    # Read a frame from the camera
    ret, frame = cap.read()
    
    if not ret:
        print("Error: Failed to read frame from camera.")
        break

    # Get current timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save the captured frame with a timestamp
    filename = f"frame_{timestamp}.jpg"
    cv2.imwrite(filename, frame)
    print(f"Frame saved as {filename}")

    # Wait for 3 minutes (180 seconds) before capturing the next frame
    time.sleep(180)

# Release the video capture object
cap.release()
print("Camera stream closed.")
