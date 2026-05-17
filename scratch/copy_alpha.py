import cv2

def main():
    # Load original sleep.png (the one with the solid background)
    sleep_img = cv2.imread(r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png", cv2.IMREAD_UNCHANGED)
    if sleep_img is None:
        print("Error loading sleep.png")
        return
        
    # Load Brain_nobg.png
    brain_nobg = cv2.imread(r"d:\PROJECTS\Soma\frontend\src\assets\brain\Brain_nobg.png", cv2.IMREAD_UNCHANGED)
    if brain_nobg is None:
        print("Error loading Brain_nobg.png")
        return
        
    # The brain_nobg image has 4 channels (BGRA)
    alpha_channel = brain_nobg[:, :, 3]
    
    # Resize alpha channel to match sleep_img exactly
    h, w = sleep_img.shape[:2]
    alpha_resized = cv2.resize(alpha_channel, (w, h), interpolation=cv2.INTER_LINEAR)
    
    # Add alpha channel to sleep_img
    if sleep_img.shape[2] == 3:
        sleep_img = cv2.cvtColor(sleep_img, cv2.COLOR_BGR2BGRA)
        
    sleep_img[:, :, 3] = alpha_resized
    
    # Save as sleep_nobg.png
    cv2.imwrite(r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png", sleep_img)
    print("SUCCESS: Copied perfect alpha channel from Brain_nobg.png!")

if __name__ == "__main__":
    main()
