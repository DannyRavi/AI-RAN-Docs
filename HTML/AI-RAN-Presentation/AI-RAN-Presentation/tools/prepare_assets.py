# -*- coding: utf-8 -*-
"""
Prepare presentation image assets from the project's `images/` folder.

Source images live in <project root>/images and are never modified.
This script only writes new, descriptively named copies into
AI-RAN-Presentation/assets/images (optionally downscaled / re-encoded).

Run:
    python tools/prepare_assets.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
PROJ = HERE.parent
SRC = PROJ.parent / "images"
DST = PROJ / "assets" / "images"

# (source file name, destination file name, mode)
#   mode "diagram" -> keep crisp line art, save optimized PNG
#   mode "render"  -> photographic / 3D render, save JPEG (quality 90)
MAP = [
    ("Pasted image 20261103112018.png", "5g-three-layers.png", "diagram"),
    ("Pasted image 20261103112146.png", "ngran-topology.png", "diagram"),
    ("Pasted image 20261102192844.png", "ai-ran-architecture.png", "diagram"),
    ("Pasted image 20261102192023.png", "wg1-functionality-map.png", "diagram"),
    ("Pasted image 20261102192034.png", "wg1-air-interface-evolution.png", "diagram"),
    ("Pasted image 20261102192051.png", "wg1-csi-autoencoder.png", "diagram"),
    ("Pasted image 20261102192102.png", "wg1-mu-mimo-beamforming.png", "diagram"),
    ("Pasted image 20261102192113.png", "wg1-beam-management.png", "diagram"),
    ("Pasted image 20261102192145.png", "wg1-distributed-mimo.png", "diagram"),
    ("Pasted image 20261102192203.png", "wg1-antenna-muting.png", "diagram"),
    ("Pasted image 20261102191314.png", "ai-and-ran-shared-resources.png", "diagram"),
    ("Pasted image 20261102191241.png", "ai-and-ran-scenarios-bc.png", "diagram"),
    ("Pasted image 20261102191344.png", "ai-ran-orchestrator-arch.png", "diagram"),
    ("Pasted image 20261102191333.png", "ai-ran-network-overview.png", "diagram"),
    ("Pasted image 20261102190602.png", "ai-grade-shift.png", "diagram"),
    ("Pasted image 20261102190618.png", "mobile-native-ai-agent.png", "diagram"),
    ("Pasted image 20261102190634.png", "predictability-vs-peak-rate.png", "diagram"),
    ("Pasted image 20261102190657.png", "ai-grade-pillars.png", "diagram"),
    ("Pasted image 20261102190713.png", "monetizing-pain-moments.png", "diagram"),
    ("Pasted image 20261102190722.png", "aggregator-value-chain.png", "diagram"),
    ("Pasted image 20261103110642.png", "sionna-rt-radio-map.jpg", "render"),
    ("Pasted image 20261103110720.png", "sionna-rt-ray-paths.jpg", "render"),
    ("Pasted image 20261103110742.png", "sionna-rt-rtx-view.jpg", "render"),
    ("Pasted image 20261103110659.png", "sionna-rt-pathloss-ui.jpg", "render"),
    ("Pasted image 20261103112130.png", "rf-coverage-cells.png", "diagram"),
]

MAX_W = 1900  # keep quality high, avoid multi-megabyte payloads


def process(src: Path, dst: Path, mode: str) -> str:
    with Image.open(src) as im:
        im.load()
        w, h = im.size
        if w > MAX_W:
            nh = int(round(h * MAX_W / w))
            im = im.resize((MAX_W, nh), Image.LANCZOS)
        if mode == "render":
            im = im.convert("RGB")
            dst = dst.with_suffix(".jpg")
            im.save(dst, "JPEG", quality=90, optimize=True, progressive=True)
        else:
            if im.mode not in ("RGB", "RGBA", "P"):
                im = im.convert("RGBA")
            im.save(dst, "PNG", optimize=True)
        return f"{dst.name}: {im.size[0]}x{im.size[1]} -> {dst.stat().st_size // 1024} KB"


def main() -> int:
    if not SRC.is_dir():
        print(f"source folder not found: {SRC}", file=sys.stderr)
        return 1
    DST.mkdir(parents=True, exist_ok=True)
    missing = 0
    for sname, dname, mode in MAP:
        src = SRC / sname
        if not src.is_file():
            print(f"MISSING: {sname}", file=sys.stderr)
            missing += 1
            continue
        dst = DST / dname
        try:
            print(process(src, dst, mode))
        except Exception as exc:  # pragma: no cover
            print(f"ERROR {sname}: {exc}", file=sys.stderr)
            missing += 1
    print(f"\n{len(MAP) - missing}/{len(MAP)} assets prepared in {DST}")
    return 0 if missing == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
