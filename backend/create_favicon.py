#!/usr/bin/env python3
"""
Simple script to create a basic favicon for the EchoLingo application.
This creates a 16x16 pixel favicon with the letter 'E' in it.
"""

import os

from PIL import Image, ImageDraw, ImageFont


def create_favicon():
    """Create a simple favicon with the letter 'E' for EchoLingo."""
    # Create a 16x16 pixel image with a blue background
    img = Image.new("RGB", (32, 32), color=(41, 128, 185))

    # Get a drawing context
    draw = ImageDraw.Draw(img)

    # Try to use a font, or fall back to drawing a simple shape
    try:
        # Try to use a system font
        font = ImageFont.truetype("Arial", 24)
        # Draw the letter 'E' in white
        draw.text((8, 2), "E", fill=(255, 255, 255), font=font)
    except Exception:
        # If font loading fails, draw a simple shape
        draw.rectangle([(8, 8), (24, 24)], fill=(255, 255, 255))

    # Ensure the static directory exists
    os.makedirs("static", exist_ok=True)

    # Save the image as favicon.ico
    img.save("static/favicon.ico")
    print("Favicon created at static/favicon.ico")


if __name__ == "__main__":
    create_favicon()
