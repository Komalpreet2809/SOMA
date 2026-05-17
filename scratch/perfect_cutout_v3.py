import collections
import math
from PIL import Image, ImageFilter

def main():
    # Load original sleep image
    img_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png"
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # 1. Create binary mask: 0 for background, 255 for brain
    mask = Image.new("L", (width, height), 255)
    mask_pixels = mask.load()
    
    # Center of the 380x380 image
    cx, cy = 190, 190
    
    # BFS queue
    visited = set()
    edge_pixels = []
    for x in range(width):
        edge_pixels.append((x, 0))
        edge_pixels.append((x, height - 1))
    for y in range(height):
        edge_pixels.append((0, y))
        edge_pixels.append((width - 1, y))
        
    queue = collections.deque(edge_pixels)
    for p in edge_pixels:
        visited.add(p)
        
    while queue:
        x, y = queue.popleft()
        r, g, b, a = pixels[x, y]
        
        # Calculate horizontal ellipse distance to protect the brain interior from leaks
        # Brain center is 190, 190. Vertical radius is smaller than horizontal radius.
        dx = x - cx
        dy = y - cy
        
        # Scale dy to account for horizontal elliptical shape of the brain
        ellipse_dist = math.sqrt(dx*dx + (dy * 1.25)*(dy * 1.25))
        
        # Absolute protection boundary: if we are deep inside the brain area (ellipse_dist <= 145),
        # do not allow BFS to propagate here, preventing any leaks into the brain folds!
        if ellipse_dist <= 145:
            continue
            
        # Background criteria: R, G, B are neutral light grey background
        is_bg = (195 <= r <= 224) and (abs(r - g) <= 6) and (abs(g - b) <= 6)
        
        if is_bg:
            mask_pixels[x, y] = 0 # set to transparent
            
            # Neighbors
            for dx_n, dy_n in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx_n, y + dy_n
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
    # 2. Erode the mask by 1 pixel to remove the thin grey boundary outline
    eroded_mask = mask.filter(ImageFilter.MinFilter(3))
    
    # 3. Apply a smooth Gaussian Blur of 1.2 pixels to anti-alias the cut-out edge
    smooth_mask = eroded_mask.filter(ImageFilter.GaussianBlur(1.2))
    
    # 4. Write the smoothed mask into the alpha channel of our original image
    final_img = Image.new("RGBA", (width, height))
    final_pixels = final_img.load()
    smooth_pixels = smooth_mask.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            alpha_val = smooth_pixels[x, y]
            final_pixels[x, y] = (r, g, b, alpha_val)
            
    # 5. Save the perfect cutout
    output_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png"
    final_img.save(output_path, "PNG")
    print("SUCCESS: Leak-free transparent cutout sleep_nobg.png created successfully!")

if __name__ == "__main__":
    main()
