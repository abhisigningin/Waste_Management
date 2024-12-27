import cv2
import numpy as np

# Load images (current and baseline)
baseline_image = cv2.imread('data/images/2.jpg')  # empty dustbin (baseline)
current_image = cv2.imread('data/images/5.jpg')  # current image with filled dustbin

# Define the ROI coordinates for the dustbin (x, y, width, height)
x, y, width, height = 1411, 140, 741, 345 

# Crop the images to the dustbin ROI
baseline_roi = baseline_image[y:y+height, x:x+width]
current_roi = current_image[y:y+height, x:x+width]

# Convert the ROI images to grayscale
baseline_gray = cv2.cvtColor(baseline_roi, cv2.COLOR_BGR2GRAY)
current_gray = cv2.cvtColor(current_roi, cv2.COLOR_BGR2GRAY)

# Compute the absolute difference between the current and baseline images
diff = cv2.absdiff(current_gray, baseline_gray)

# Threshold the difference to highlight significant changes
_, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

# Apply morphological operations (optional)
kernel = np.ones((5, 5), np.uint8)
thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

# Find contours of detected regions
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Calculate the percentage of filled area in the dustbin
filled_area = 0
if len(contours) > 0:
    for contour in contours:
        filled_area += cv2.contourArea(contour)

# Get the total area of the dustbin ROI
total_area = width * height

# Calculate the percentage of filled area
fill_percentage = (filled_area / total_area) * 100
print(fill_percentage)

# Classify the dustbin fill level
if fill_percentage < 20:
    print("Dustbin is Empty")
elif 20 <= fill_percentage < 30:
    print("Dustbin is Half-full")
else:
    print("Dustbin is Full")
