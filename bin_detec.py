import cv2
import numpy as np

def detect_dustbin(reference_image_path, test_image_path):
    # Load the reference image and test image
    reference_image = cv2.imread(reference_image_path)
    test_image = cv2.imread(test_image_path)

    # Convert reference image to grayscale
    reference_gray = cv2.cvtColor(reference_image, cv2.COLOR_BGR2GRAY)
    test_gray = cv2.cvtColor(test_image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    reference_blur = cv2.GaussianBlur(reference_gray, (5, 5), 0)
    test_blur = cv2.GaussianBlur(test_gray, (5, 5), 0)

    # Detect edges using Canny edge detection
    reference_edges = cv2.Canny(reference_blur, 50, 150)
    test_edges = cv2.Canny(test_blur, 50, 150)

    # Find contours in the reference image
    ref_contours, _ = cv2.findContours(reference_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Assume the largest contour in the reference image is the dustbin
    ref_contours = sorted(ref_contours, key=cv2.contourArea, reverse=True)
    if ref_contours:
        dustbin_contour = ref_contours[0]

        # Compute the bounding rectangle for the dustbin in the reference image
        x, y, w, h = cv2.boundingRect(dustbin_contour)
        reference_roi = reference_image[y:y+h, x:x+w]

        # Resize ROI to match the scale of the test image (optional)
        test_h, test_w = test_gray.shape
        reference_roi = cv2.resize(reference_roi, (test_w, test_h))

        # Perform template matching on the test image
        result = cv2.matchTemplate(test_gray, cv2.cvtColor(reference_roi, cv2.COLOR_BGR2GRAY), cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

        # If match is found, draw the bounding box on the test image
        if max_val > 0.5:  # Adjust threshold as needed
            top_left = max_loc
            bottom_right = (top_left[0] + w, top_left[1] + h)
            cv2.rectangle(test_image, top_left, bottom_right, (0, 255, 0), 2)

            # Extract ROI from the test image
            roi = test_image[top_left[1]:bottom_right[1], top_left[0]:bottom_right[0]]

            # Display the results
            cv2.imshow("Detected Dustbin", test_image)
            cv2.imshow("ROI", roi)
            cv2.waitKey(0)
            cv2.destroyAllWindows()
        else:
            print("Dustbin not found in the test image.")
    else:
        print("No dustbin contour found in the reference image.")

# Provide paths to the reference dustbin image and test image
reference_image_path = 'data/images/fldb.jpg'  # Path to the reference image of the dustbin
test_image_path = 'data/images/full2.jpg'             # Path to the test image

detect_dustbin(reference_image_path, test_image_path)
