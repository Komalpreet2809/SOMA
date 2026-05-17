import collections
from PIL import Image

def main():
    # Load the original sleep brain image
    img_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png"
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size

    # The background color is exactly #eaeaea, which in RGB is (234, 234, 234)
    bg_color = (234, 234, 234, 255)

    # Start with all white mask (opaque)
    mask = Image.new("L", (width, height), 255)
    
    # Simple BFS flood fill to find background pixels
    visited = set()
    tolerance = 12
    tr, tg, tb = bg_color[:3]
    
    # We will start flood fill from the borders of the image (all 4 edges)
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
        
        # Get pixel color
        r, g, b, a = img.getpixel((x, y))
        
        # If it is close to target background color, it's outer background
        if abs(r - tr) <= tolerance and abs(g - tg) <= tolerance and abs(b - tb) <= tolerance:
            mask.putpixel((x, y), 0) # set to transparent
            
            # Neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))

    # Apply the mask back to the image
    for y in range(height):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            m_val = mask.getpixel((x, y))
            if m_val == 0:
                img.putpixel((x, y), (r, g, b, 0))

    # Save to sleep_nobg.png
    output_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png"
    img.save(output_path, "PNG")
    print("SUCCESS: Perfect transparent cutout sleep_nobg.png created successfully!")

if __name__ == "__main__":
    main()
