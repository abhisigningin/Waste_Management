import cv2
import numpy as np
import json
import time
from datetime import datetime

# Function to analyze bin fill status
def analyze_bin_fill_status(baseline_image_path, current_frame, bin_roi, ground_roi):
    # Load baseline image
    baseline_image = cv2.imread(baseline_image_path)

    # Define ROIs
    bin_x, bin_y, bin_width, bin_height = bin_roi
    ground_x, ground_y, ground_width, ground_height = ground_roi

    # Crop images to ROIs
    baseline_bin_roi = baseline_image[bin_y:bin_y+bin_height, bin_x:bin_x+bin_width]
    current_bin_roi = current_frame[bin_y:bin_y+bin_height, bin_x:bin_x+bin_width]

    baseline_ground_roi = baseline_image[ground_y:ground_y+ground_height, ground_x:ground_x+ground_width]
    current_ground_roi = current_frame[ground_y:ground_y+ground_height, ground_x:ground_x+ground_width]

    # Convert to grayscale
    baseline_bin_gray = cv2.cvtColor(baseline_bin_roi, cv2.COLOR_BGR2GRAY)
    current_bin_gray = cv2.cvtColor(current_bin_roi, cv2.COLOR_BGR2GRAY)

    baseline_ground_gray = cv2.cvtColor(baseline_ground_roi, cv2.COLOR_BGR2GRAY)
    current_ground_gray = cv2.cvtColor(current_ground_roi, cv2.COLOR_BGR2GRAY)

    # Compute absolute difference for bin ROI
    bin_diff = cv2.absdiff(current_bin_gray, baseline_bin_gray)

    # Threshold to highlight changes in bin
    _, bin_thresh = cv2.threshold(bin_diff, 30, 255, cv2.THRESH_BINARY)

    # Apply morphological operations for bin
    kernel = np.ones((5, 5), np.uint8)
    bin_thresh = cv2.morphologyEx(bin_thresh, cv2.MORPH_OPEN, kernel)
    bin_thresh = cv2.morphologyEx(bin_thresh, cv2.MORPH_CLOSE, kernel)

    # Find contours for bin
    bin_contours, _ = cv2.findContours(bin_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Calculate filled area for bin
    bin_filled_area = sum(cv2.contourArea(contour) for contour in bin_contours)

    # Total area of bin ROI
    bin_total_area = bin_width * bin_height

    # Calculate fill percentage for bin
    fill_percentage = (bin_filled_area / bin_total_area) * 100

    # Classify bin fill level
    if fill_percentage < 20:
        bin_status = "Empty"
    elif 20 <= fill_percentage < 30:
        bin_status = "Half-full"
    else:
        bin_status = "Full"

    # Compute absolute difference for ground ROI
    ground_diff = cv2.absdiff(current_ground_gray, baseline_ground_gray)

    # Threshold to highlight changes in ground
    _, ground_thresh = cv2.threshold(ground_diff, 30, 255, cv2.THRESH_BINARY)

    # Apply morphological operations for ground
    ground_thresh = cv2.morphologyEx(ground_thresh, cv2.MORPH_OPEN, kernel)
    ground_thresh = cv2.morphologyEx(ground_thresh, cv2.MORPH_CLOSE, kernel)

    # Find contours for ground
    ground_contours, _ = cv2.findContours(ground_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Detect spill-over (if any contour is detected in ground ROI)
    spill_over = len(ground_contours) > 0

    return bin_status, fill_percentage, spill_over

# Function to capture frame from RTSP stream
def capture_frame(rtsp_url):
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print("Failed to open camera stream.")
        return None

    ret, frame = cap.read()
    cap.release()

    if ret:
        return frame
    else:
        print("Failed to capture frame.")
        return None

# Main function
if __name__ == "__main__":
    # Configuration
    rtsp_url = "rtsp://wm_ipc_01:iiit123@10.2.203.135:8000/stream1"
    baseline_image_path = "data/images/em1.jpg"
    bin_roi = (1411, 140, 741, 345)  # Adjust as needed
    ground_roi = (931, 737, 1036, 280)  # Adjust as needed
    output_json_path = "bin_status.json"

    while True:
        # Capture current frame directly
        current_frame = capture_frame(rtsp_url)
        if current_frame is not None:
            # Analyze bin fill status and spill-over
            bin_status, fill_percentage, spill_over = analyze_bin_fill_status(
                baseline_image_path, current_frame, bin_roi, ground_roi
            )

            # Save results to JSON
            result = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "fill_percentage": fill_percentage,
                "bin_status": bin_status,
                "spill_over": spill_over
            }

            with open(output_json_path, "a") as json_file:
                json.dump(result, json_file)
                json_file.write("\n")

            print("Result saved:", result)

        # Wait for 1 minute
        time.sleep(60)
