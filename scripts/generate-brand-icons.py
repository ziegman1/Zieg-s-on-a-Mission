#!/usr/bin/env python3
"""Regenerate site + Mission Hub favicon/OG assets from repo branding files."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "public"
LOGO = ROOT / "logo" / "team-expansion.png"
HERO = ROOT / "images" / "hero-zieg-mission.png"

BRAND_PRIMARY = (131, 176, 218)
BRAND_CREAM = (234, 229, 225)


def crop_te_mark(img: Image.Image, size: int) -> Image.Image:
    w, h = img.size
    side = min(h, w)
    left = max(0, w - side)
    cropped = img.crop((left, 0, left + side, min(side, h)))
    if cropped.size[0] != cropped.size[1]:
        cropped = cropped.resize((side, side), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), BRAND_CREAM + (255,))
    inner = int(size * 0.88)
    mark = cropped.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(mark, (offset, offset), mark)
    return canvas


def make_mh_mark(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BRAND_PRIMARY + (255,))
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.42)
    font = None
    for name in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ):
        try:
            font = ImageFont.truetype(name, font_size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()
    text = "MH"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1] - int(size * 0.02)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    return img


def main() -> None:
    logo = Image.open(LOGO).convert("RGBA")
    for out, size in (("icon.png", 32), ("apple-touch-icon.png", 180)):
        crop_te_mark(logo, size).convert("RGB").save(ROOT / out, format="PNG", optimize=True)

    mh_dir = ROOT / "mission-hub"
    for name, size in (
        ("apple-touch-icon.png", 180),
        ("icon-192.png", 192),
        ("icon-512.png", 512),
    ):
        make_mh_mark(size).convert("RGB").save(mh_dir / name, format="PNG", optimize=True)

    ico_sizes = [16, 32, 48]
    ico_images = [crop_te_mark(logo, s).convert("RGBA") for s in ico_sizes]
    ico_images[0].save(
        ROOT / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )

    hero = Image.open(HERO).convert("RGB")
    target_w, target_h = 1200, 630
    w, h = hero.size
    scale = max(target_w / w, target_h / h)
    resized = hero.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    og = resized.crop((left, top, left + target_w, top + target_h))
    og.save(ROOT / "og-image.jpg", format="JPEG", quality=88, optimize=True)
    print("Brand icons and og-image.jpg updated under public/")


if __name__ == "__main__":
    main()
