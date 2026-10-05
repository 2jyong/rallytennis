"""Generate the site's small brand icons and its social sharing card."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1]
CREAM = (245, 244, 236)
LIME = (223, 255, 56)
DEEP = (11, 23, 17)
ARIAL_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
MALGUN_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")


def font(path, size):
    return ImageFont.truetype(str(path), size)


def draw_icon(size):
    scale = 4
    image = Image.new("RGB", (size * scale, size * scale), DEEP)
    draw = ImageDraw.Draw(image)
    w = size * scale
    draw.rounded_rectangle((0, 0, w - 1, w - 1), radius=round(w * .18), fill=DEEP)
    draw.text((w * .11, w * .045), "R", font=font(ARIAL_BOLD, round(w * .77)), fill=CREAM)
    r = round(w * .085)
    cx, cy = round(w * .79), round(w * .76)
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=LIME)
    return image.resize((size, size), Image.Resampling.LANCZOS)


for size, name in [(96, "favicon-96.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    draw_icon(size).save(ROOT / name, optimize=True)

draw_icon(256).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], format="ICO")


S = 2
W, H = 1200 * S, 630 * S
card = Image.new("RGB", (W, H), DEEP)
draw = ImageDraw.Draw(card)

# Subtle court markings add depth without competing with the headline.
for x in (104, 1410, 2300):
    draw.line((x, 0, x, H), fill=(43, 68, 49), width=2)
for y in (150, 1120):
    draw.line((0, y, W, y), fill=(43, 68, 49), width=2)
draw.line((104, 150, 104, 1120), fill=LIME, width=6)

cx, cy, radius = 2010, 690, 478
for r in range(radius, 0, -2):
    depth = 1 - (r / radius) ** 1.7
    color = (
        round(142 + 75 * depth),
        round(179 + 72 * depth),
        round(28 + 38 * depth),
    )
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=color)

# Two soft curved seams make the circle read as a tennis ball at thumbnail size.
def bezier(p0, p1, p2, p3, n=90):
    points = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        points.append((
            u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
            u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1],
        ))
    return points

seam = (245, 250, 203)
draw.line(bezier((1680, 365), (1945, 450), (1900, 940), (1660, 1010)), fill=seam, width=22, joint="curve")
draw.line(bezier((2350, 375), (2060, 460), (2100, 920), (2350, 1000)), fill=seam, width=22, joint="curve")

draw.text((180, 195), "RALLY", font=font(ARIAL_BOLD, 240), fill=CREAM)
draw.ellipse((1052, 382, 1093, 423), fill=LIME)
draw.text((186, 458), "TENNIS ACADEMY", font=font(ARIAL_BOLD, 37), fill=LIME, spacing=10)
draw.text((180, 634), "공을 읽고,", font=font(MALGUN_BOLD, 114), fill=CREAM)
draw.text((180, 782), "경기를 바꾸다.", font=font(MALGUN_BOLD, 114), fill=CREAM)
draw.text((184, 1080), "LESSON PROGRAMS   ·   COACHING METHOD", font=font(ARIAL_BOLD, 28), fill=(179, 199, 181))

card.resize((1200, 630), Image.Resampling.LANCZOS).save(ROOT / "assets" / "og-cover.jpg", quality=91, subsampling=0, optimize=True)
