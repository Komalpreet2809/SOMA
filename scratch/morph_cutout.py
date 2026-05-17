import collections
from PIL import Image, ImageFilter

def main():
    # Load original sleep image
    img_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png"
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # 1. Create a binary threshold mask: 255 for non-background pixels, 0 for background pixels
    thresh = Image.new("L", (width, height), 0)
    thresh_pixels = thresh.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Background is neutral light-grey around (200-223)
            is_bg_color = (200 <= r <= 223) and (abs(r - g) <= 5) and (abs(g - b) <= 5)
            if not is_bg_color:
                thresh_pixels[x, y] = 255
                
    # 2. Apply Morphological Closing to completely seal any microscopic boundary gaps!
    # MaxFilter(9) dilates the 255 region by 4 pixels, closing any gaps in the outline.
    dilated = thresh.filter(ImageFilter.MaxFilter(9))
    # MinFilter(9) erodes it back by 4 pixels to restore the exact original boundary size.
    closed = dilated.filter(ImageFilter.MinFilter(9))
    
    # 3. Flood fill the outer background on the closed mask starting from all borders.
    # Since the closed mask has no gaps, the flood fill will stay strictly outside the brain!
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
        
    # The final silhouette mask starts as all 255 (brain). Flood filled pixels become 0 (transparent).
    silhouette = Image.new("L", (width, height), 255)
    sil_pixels = silhouette.load()
    closed_pixels = closed.load()
    
    while queue:
        x, y = queue.popleft()
        
        # If this pixel in the closed mask is 0 (background), it is outer background
        if closed_pixels[x, y] == 0:
            sil_pixels[x, y] = 0
            
            # Propagate
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
    # 4. Smooth the silhouette mask edges with a 1.2px Gaussian Blur for a perfect anti-aliased cut-out.
    smooth_silhouette = silhouette.filter(ImageFilter.GaussianBlur(1.2))
    
    # 5. Apply the perfect silhouette to the alpha channel of the original sleep.png image
    final_img = Image.new("RGBA", (width, height))
    final_pixels = final_img.load()
    smooth_pixels = smooth_silhouette.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            alpha_val = smooth_pixels[x, y]
            final_pixels[x, y] = (r, g, b, alpha_val)
            
    # 6. Save the perfect cutout back to sleep_nobg.png!
    output_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png"
    final_img.save(output_path, "PNG")
    print("SUCCESS: Perfect morphological cutout created successfully!")

if __name__ == "__main__":
    main()
