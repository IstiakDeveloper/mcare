"""Generate Mcare PWA icons from the brand mark. Requires Pillow."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"

PRIMARY = (5, 150, 105, 255)
ACCENT = (52, 211, 153, 255)
WHITE = (255, 255, 255, 255)


def draw_mark(base: Image.Image, ox: int, oy: int, size: int) -> None:
    plus = Image.new("RGBA", base.size, (0, 0, 0, 0))
    plus_draw = ImageDraw.Draw(plus)
    cx = ox + size / 2
    cy = oy + size / 2
    plus_w = max(2, int(size * 0.09))
    plus_len = size * 0.50
    plus_draw.line([(cx, cy - plus_len / 2), (cx, cy + plus_len / 2)], fill=(255, 255, 255, 90), width=plus_w)
    plus_draw.line([(cx - plus_len / 2, cy), (cx + plus_len / 2, cy)], fill=(255, 255, 255, 90), width=plus_w)
    base.alpha_composite(plus)

    draw = ImageDraw.Draw(base)
    pts = [(14, 34), (22, 34), (26, 23), (33, 43), (39, 28), (43, 34), (50, 34)]
    scale = size / 64
    ekg = [(ox + x * scale, oy + y * scale) for x, y in pts]
    ekg_w = max(3, int(size * 0.07))
    draw.line(ekg, fill=WHITE, width=ekg_w, joint="curve")
    radius = ekg_w / 2

    for point in (ekg[0], ekg[-1]):
        draw.ellipse(
            [point[0] - radius, point[1] - radius, point[0] + radius, point[1] + radius],
            fill=WHITE,
        )

    dot_r = max(2, size * 4 / 64)
    dx = ox + 48 * scale
    dy = oy + 16 * scale
    draw.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=ACCENT)


def make_standard(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.25)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=PRIMARY)

    inset = max(2, size // 16)
    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    highlight_draw = ImageDraw.Draw(highlight)
    highlight_draw.rounded_rectangle(
        (inset, inset, size - inset - 1, size - inset - 1),
        radius=max(1, int((size - 2 * inset) * 0.22)),
        fill=(52, 211, 153, 40),
    )
    img.alpha_composite(highlight)
    draw_mark(img, 0, 0, size)

    return img


def make_maskable(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), PRIMARY)
    pad = int(size * 0.14)
    draw_mark(img, pad, pad, size - 2 * pad)

    return img


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)

    for size in (32, 96, 192, 512):
        make_standard(size).save(ICONS / f"icon-{size}.png", "PNG", optimize=True)

    for size in (192, 512):
        make_maskable(size).save(ICONS / f"icon-maskable-{size}.png", "PNG", optimize=True)

    make_standard(180).save(PUBLIC / "apple-touch-icon.png", "PNG", optimize=True)
    print(f"Wrote PWA icons to {ICONS}")


if __name__ == "__main__":
    main()
