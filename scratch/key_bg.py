from PIL import Image

def main():
    # Load original sleep image
    img_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep.png"
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # We will simply key out the neutral light-grey background color range
    # Background pixels are neutral grey between 195 and 225
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # If the pixel is in the neutral background color range, make it transparent
            is_bg = (195 <= r <= 225) and (abs(r - g) <= 5) and (abs(g - b) <= 5)
            
            if is_bg:
                pixels[x, y] = (r, g, b, 0)
            else:
                pixels[x, y] = (r, g, b, 255)
                
    output_path = r"d:\PROJECTS\Soma\frontend\src\assets\brain\sleep_nobg.png"
    img.save(output_path, "PNG")
    print("SUCCESS: Keyed out background color successfully!")

if __name__ == "__main__":
    main()
