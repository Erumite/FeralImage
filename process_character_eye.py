import os
from PIL import Image

src_path = '/home/Eremite/.gemini/antigravity-cli/brain/62350ee8-ce34-41d8-9d75-2a0841b60c63/character_eye_icon_1787168633990.jpg'
out_dir = '/var/home/Eremite/Documents/Projects/FeralImages/icons'

os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert('RGBA')

for size in [16, 48, 128]:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    out_path = os.path.join(out_dir, f'icon{size}.png')
    resized.save(out_path, format='PNG')
    print(f"Saved {out_path} ({size}x{size})")

print("Character eye icon sizes generated successfully!")
