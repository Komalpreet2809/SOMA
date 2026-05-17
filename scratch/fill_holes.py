import cv2
import numpy as np

def main():
    img = cv2.imread(r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png", cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Error loading image")
        return

    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

    b, g, r = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    
    # Target background
    is_bg = (r >= 190) & (r <= 226) & (g >= 190) & (g <= 226) & (b >= 190) & (b <= 226)
    
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    is_neutral = (max_c - min_c) <= 6
    
    bg_mask = is_bg & is_neutral
    
    brain_mask = np.zeros_like(r, dtype=np.uint8)
    brain_mask[~bg_mask] = 255
    
    # Close gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    closed_mask = cv2.morphologyEx(brain_mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return
        
    largest_contour = max(contours, key=cv2.contourArea)
    
    silhouette = np.zeros_like(brain_mask)
    # Draw contour with anti-aliasing
    cv2.drawContours(silhouette, [largest_contour], -1, 255, thickness=cv2.FILLED, lineType=cv2.LINE_AA)
    
    # Erode the silhouette slightly to shave off jaggedness and any remaining grey halo
    erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    silhouette = cv2.erode(silhouette, erode_kernel, iterations=1)
    
    # Smooth Gaussian blur to make the edges buttery smooth (feathering)
    silhouette_smoothed = cv2.GaussianBlur(silhouette, (9, 9), 0)
    
    img[:, :, 3] = silhouette_smoothed
    
    out_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png"
    cv2.imwrite(out_path, img)
    print("SUCCESS: Smooth edges applied!")

if __name__ == "__main__":
    main()
