import json, sys
from PIL import Image, ImageDraw, ImageFont
lst = json.load(open(sys.argv[1])); out = sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
ims = [(t, Image.open(p).convert("RGB")) for t, p in lst]
w, h = ims[0][1].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 8) + 8, rows * (h + 36) + 8), (30, 30, 30))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except Exception:
    font = ImageFont.load_default()
for i, (t, im) in enumerate(ims):
    x = 8 + (i % cols) * (w + 8); y = 8 + (i // cols) * (h + 36)
    sheet.paste(im, (x, y + 28)); d.text((x, y), f"{t}s", fill=(255, 220, 80), font=font)
sheet.save(out, quality=88)
print(sheet.size)
