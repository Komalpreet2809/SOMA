import math
from PIL import Image

def main():
    # Load original sleep image
    img_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png"
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # Perfect ellipse center and radii matching the sleep brain shape
    cx, cy = 186, 182
    rx, ry = 160, 134
    
    final_img = Image.new("RGBA", (width, height))
    final_pixels = final_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Calculate distance to ellipse boundary
            dx = x - cx
            dy = y - cy
            
            # Elliptical distance ratio
            dist_ratio = math.sqrt((dx/rx)**2 + (dy/ry)**2)
            
            # Smooth step anti-aliasing at the boundary:
            # If ratio <= 0.96: 100% opaque (brain interior)
            # If ratio >= 1.00: 100% transparent (background)
            if dist_ratio <= 0.96:
                alpha_val = 255
            elif dist_ratio >= 1.00:
                alpha_val = 0
            else:
                # Smooth interpolation at the edge
                t = (dist_ratio - 0.96) / 0.04
                alpha_val = int(round((1.0 - t) * 255))
                
            final_pixels[x, y] = (r, g, b, alpha_val)
            
    output_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png"
    final_img.save(output_path, "PNG")
    print("SUCCESS: Perfect mathematical elliptical cutout sleep_nobg.png created successfully!")

if __name__ == "__main__":
    main()
