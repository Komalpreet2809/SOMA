import collections
from PIL import Image, ImageFilter

def main():
    # Load original sleep image
    img_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png"
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # Target background color
    bg_color = (234, 234, 234)
    tr, tg, tb = bg_color
    tolerance = 15
    
    # 1. Create binary mask: 0 for background, 255 for brain
    mask = Image.new("L", (width, height), 255)
    mask_pixels = mask.load()
    
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
        
        if abs(r - tr) <= tolerance and abs(g - tg) <= tolerance and abs(b - tb) <= tolerance:
            mask_pixels[x, y] = 0
            
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
    # 2. Erode the mask by 1 pixel to completely remove the thin grey boundary halo.
    # MinFilter(3) replaces each pixel with the minimum in its 3x3 neighborhood.
    # Since background is 0 and brain is 255, this expands the 0 (transparent) area by 1 pixel.
    eroded_mask = mask.filter(ImageFilter.MinFilter(3))
    
    # 3. Apply a smooth Gaussian Blur of 1.2 pixels to make the cut-out edges beautifully smooth and anti-aliased.
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
    print("SUCCESS: Perfect glassy transparent cutout sleep_nobg.png created successfully!")

if __name__ == "__main__":
    main()
