import os
import math
from PIL import Image, ImageDraw, ImageFont

def render_logo_icon(size=512):
    scale = 4
    w = size * scale
    img = Image.new('RGBA', (w, w), (0, 0, 0, 0))
    
    corner_r = int(w * 0.24)
    mask = Image.new('L', (w, w), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, w, w], radius=corner_r, fill=255)
    
    grad = Image.new('RGBA', (w, w))
    for y in range(w):
        t = y / w
        r = int(67 + (139 - 67) * t)
        g = int(56 + (92 - 56) * t)
        b = int(202 + (246 - 202) * t)
        for x in range(w):
            grad.putpixel((x, y), (r, g, b, 255))
    img.paste(grad, (0, 0), mask)
    
    draw = ImageDraw.Draw(img)
    cx, cy = w / 2, w / 2
    r_ring = w * 0.27
    stroke = int(w * 0.075)
    
    # Open progress arc: start around 35 deg, end around 310 deg
    draw.arc([cx - r_ring, cy - r_ring, cx + r_ring, cy + r_ring], start=38, end=305, fill=(255, 255, 255, 255), width=stroke)
    
    # Arrow head at the end of arc
    # The end is around 305 degrees (which is around -55 deg)
    ang = math.radians(305)
    ax = cx + r_ring * math.cos(ang)
    ay = cy + r_ring * math.sin(ang)
    # triangle pointing tangentially
    arrow_size = stroke * 1.3
    # tangent direction is perp to radius (-sin, cos)
    tx, ty = -math.sin(ang), math.cos(ang)
    nx, ny = -ty, tx
    p_tip = (ax + tx * arrow_size * 0.8, ay + ty * arrow_size * 0.8)
    p_left = (ax - tx * arrow_size * 0.4 + nx * arrow_size * 0.7, ay - ty * arrow_size * 0.4 + ny * arrow_size * 0.7)
    p_right = (ax - tx * arrow_size * 0.4 - nx * arrow_size * 0.7, ay - ty * arrow_size * 0.4 - ny * arrow_size * 0.7)
    draw.polygon([p_tip, p_left, p_right], fill=(255, 255, 255, 255))
    
    # Checkmark inside ring
    p1 = (cx - r_ring * 0.45, cy + r_ring * 0.12)
    p2 = (cx - r_ring * 0.10, cy + r_ring * 0.48)
    p3 = (cx + r_ring * 0.68, cy - r_ring * 0.35)
    draw.line([p1, p2, p3], fill=(255, 255, 255, 255), width=stroke, joint='round')
    
    return img.resize((size, size), Image.Resampling.LANCZOS)

targets = [
    ('app/android/app/src/main/res/drawable/splash.png', 480, 320),
    ('app/android/app/src/main/res/drawable-land-hdpi/splash.png', 800, 480),
    ('app/android/app/src/main/res/drawable-land-mdpi/splash.png', 480, 320),
    ('app/android/app/src/main/res/drawable-land-xhdpi/splash.png', 1280, 720),
    ('app/android/app/src/main/res/drawable-land-xxhdpi/splash.png', 1600, 960),
    ('app/android/app/src/main/res/drawable-land-xxxhdpi/splash.png', 1920, 1280),
    ('app/android/app/src/main/res/drawable-port-hdpi/splash.png', 480, 800),
    ('app/android/app/src/main/res/drawable-port-mdpi/splash.png', 320, 480),
    ('app/android/app/src/main/res/drawable-port-xhdpi/splash.png', 720, 1280),
    ('app/android/app/src/main/res/drawable-port-xxhdpi/splash.png', 960, 1600),
    ('app/android/app/src/main/res/drawable-port-xxxhdpi/splash.png', 1280, 1920),
]

master_icon = render_logo_icon(1024)

# Try loading standard font or fallback
font_candidates = [
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/calibri.ttf',
]
font_path = None
for f in font_candidates:
    if os.path.exists(f):
        font_path = f
        break

for path, w, h in targets:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Background: dark obsidian slate
    bg = Image.new('RGB', (w, h), (11, 15, 25))
    
    # Calculate icon size: ~22-26% of smaller dimension, clamped between 72 and 360
    min_dim = min(w, h)
    icon_size = max(72, min(int(min_dim * 0.25), 360))
    
    icon_resized = master_icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    
    # Offset slightly upwards to leave room for text
    y_center = int(h * 0.45)
    x_center = int(w * 0.5)
    
    icon_x = x_center - icon_size // 2
    icon_y = y_center - icon_size // 2
    
    bg.paste(icon_resized, (icon_x, icon_y), icon_resized)
    
    draw = ImageDraw.Draw(bg)
    
    # Text "studyzflow"
    text = "studyzflow"
    font_size = max(18, int(icon_size * 0.24))
    if font_path:
        font = ImageFont.truetype(font_path, font_size)
    else:
        font = ImageFont.load_default()
    
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
    except Exception:
        tw = font_size * 5
        th = font_size
    
    tx = (w - tw) // 2
    ty = icon_y + icon_size + int(icon_size * 0.16)
    
    # Draw soft subtle tagline / app name
    draw.text((tx, ty), text, fill=(255, 255, 255), font=font)
    
    # Sub-text "Smart Academic Companion"
    sub_text = "FOCUS  •  PLAN  •  ACHIEVE"
    sub_font_size = max(9, int(font_size * 0.38))
    if font_path:
        sub_font = ImageFont.truetype(font_path, sub_font_size)
        try:
            sbox = draw.textbbox((0, 0), sub_text, font=sub_font)
            sw = sbox[2] - sbox[0]
        except Exception:
            sw = sub_font_size * 12
        sx = (w - sw) // 2
        sy = ty + th + int(icon_size * 0.08)
        draw.text((sx, sy), sub_text, fill=(148, 163, 184), font=sub_font)
    
    bg.save(path, format='PNG', optimize=True)
    print(f"Generated {path} ({w}x{h})")

# Clean up test files if any
if os.path.exists('test_logo.png'):
    os.remove('test_logo.png')
