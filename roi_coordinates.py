import cv2

# Load the image
image_path = 'data/images/1.jpg'
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

# Display the resized image and let the user select the ROI
roi = cv2.selectROI("Select ROI", image_resized, fromCenter=False, showCrosshair=True)

# Extract the ROI coordinates (x, y, width, height) for the resized frame
x, y, w, h = roi

# Compute the scaling factors
scale_x = image.shape[1] / image_resized.shape[1]
scale_y = image.shape[0] / image_resized.shape[0]

# Map the ROI coordinates to the original image dimensions
x_orig = int(x * scale_x)
y_orig = int(y * scale_y)
w_orig = int(w * scale_x)
h_orig = int(h * scale_y)

# Display the ROI coordinates for both the resized and original frames
print(f"ROI coordinates for resized frame: x={x}, y={y}, width={w}, height={h}")
print(f"ROI coordinates for original frame: x={x_orig}, y={y_orig}, width={w_orig}, height={h_orig}")

# Close the selection window
cv2.destroyAllWindows()
