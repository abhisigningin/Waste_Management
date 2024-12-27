import cv2
import numpy as np

# Load images (current and baseline)
baseline_image = cv2.imread('data/images/2.jpg')  # background without object
current_image = cv2.imread('data/images/2.jpg')  # image with potential object

# Define the ROI coordinates (x, y, width, height)
x, y, width, height = 931, 737, 1036, 280

# Crop the images to the ROI
baseline_roi = baseline_image[y:y+height, x:x+width]
current_roi = current_image[y:y+height, x:x+width]

# Convert to HSV (optional, but typically useful for color-based difference)
baseline_hsv = cv2.cvtColor(baseline_roi, cv2.COLOR_BGR2HSV)
current_hsv = cv2.cvtColor(current_roi, cv2.COLOR_BGR2HSV)

# Compute absolute difference between the ROI images
diff = cv2.absdiff(current_hsv, baseline_hsv)

# Convert the difference to grayscale for contour detection
diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)

# Threshold the difference to highlight significant changes
_, thresh = cv2.threshold(diff_gray, 30, 255, cv2.THRESH_BINARY)

# Apply morphological operations (optional)
kernel = np.ones((5, 5), np.uint8)
thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

# Find contours of detected regions
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Evaluate presence of objects based on contours
if len(contours) > 0:
    print("Object detected!")
else:
    print("No object detected.")
