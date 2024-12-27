#Reduced frame size
import cv2
import numpy as np
from matplotlib import pyplot as plt

# Step 1: Select the ROI and save coordinates
# Uncomment these lines to select and save ROI once. Then comment them out after saving the ROI.

# image = cv2.imread("1730443006775.jpg")  # Initial image to define the ROI
# roi = cv2.selectROI("Select ROI", image, fromCenter=False, showCrosshair=True)
# x, y, w, h = roi
# cv2.destroyAllWindows()
# print(f"Saved ROI coordinates: x={x}, y={y}, width={w}, height={h}")

# Manually define or load the saved ROI coordinates (update with your saved coordinates)
x, y, w, h = 318,252,354,96
# x, y, w, h = 289,62,185,84
# Step 2: Load the cropped image using the ROI
# image_path = '1730443006775.jpg'
# image_path = '1730700785651.jpg'
image_path = 'data/images/2.jpg'
image = cv2.imread(image_path)
# Get screen dimensions to scale the image if necessary
screen_res = 900, 492  # Example screen resolution, you can change it as needed
scale_width = screen_res[0] / image.shape[1]
scale_height = screen_res[1] / image.shape[0]
scale = min(scale_width, scale_height)

# Resize the image if it's larger than the screen
if scale < 1:
    new_width = int(image.shape[1] * scale)
    new_height = int(image.shape[0] * scale)
    image_resized = cv2.resize(image, (new_width, new_height))
else:
    image_resized = image
# Crop the ROI from the image using the saved coordinates
roi_cropped = image_resized[y:y+h, x:x+w]

# Step 3: Process the cropped image for fill-level detection
gray = cv2.cvtColor(roi_cropped, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
edges = cv2.Canny(blurred, threshold1=50, threshold2=150)

# Step 4: Calculate the fill ratio
edge_pixels = np.count_nonzero(edges)
total_pixels = edges.size
fill_ratio = edge_pixels / total_pixels

# Step 5: Define thresholds for classification
if fill_ratio > 0.1:
    status = "Spill Over"
else:
    status = "Clean"

# Show results
print(f"Fill Status: {status}")
print(f"Fill Ratio: {fill_ratio:.2f}")

# Display the edges
plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
plt.title("Original Image")
plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
plt.axis("off")

plt.subplot(1, 2, 2)
plt.title("Edge Detection (ROI)")
plt.imshow(edges, cmap='gray')
plt.axis("off")
plt.show()
