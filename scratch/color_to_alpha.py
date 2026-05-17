from PIL import Image

def color_to_alpha(img_path, output_path, bg_color):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    r_bg, g_bg, b_bg = bg_color
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Calculate alpha for each channel based on Color-to-Alpha algorithm
            if r > r_bg:
                a_r = (r - r_bg) / (255.0 - r_bg)
            elif r < r_bg:
                a_r = (r_bg - r) / float(r_bg)
            else:
                a_r = 0.0
                
            if g > g_bg:
                a_g = (g - g_bg) / (255.0 - g_bg)
            elif g < g_bg:
                a_g = (g_bg - g) / float(g_bg)
            else:
                a_g = 0.0
                
            if b > b_bg:
                a_b = (b - b_bg) / (255.0 - b_bg)
            elif b < b_bg:
                a_b = (b_bg - b) / float(b_bg)
            else:
                a_b = 0.0
                
            # The pixel's alpha is the maximum alpha across all channels
            alpha = max(a_r, a_g, a_b)
            
            if alpha > 0.001:
                # Calculate new foreground color
                r_fg = int(round((r - (1.0 - alpha) * r_bg) / alpha))
                g_fg = int(round((g - (1.0 - alpha) * g_bg) / alpha))
                b_fg = int(round((b - (1.0 - alpha) * b_bg) / alpha))
                
                # Clamp colors to 0-255
                r_fg = max(0, min(255, r_fg))
                g_fg = max(0, min(255, g_fg))
                b_fg = max(0, min(255, b_fg))
                a_val = int(round(alpha * 255))
                
                pixels[x, y] = (r_fg, g_fg, b_fg, a_val)
            else:
                pixels[x, y] = (0, 0, 0, 0)
                
    img.save(output_path, "PNG")
    print(f"SUCCESS: Converted {img_path} to transparent {output_path} using Color-to-Alpha!")

if __name__ == "__main__":
    color_to_alpha(
        r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png",
        r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png",
        (234, 234, 234)
    )
