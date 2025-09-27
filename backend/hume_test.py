import os
from pathlib import Path

from hume import HumeClient
from hume.tts import FormatMp3

VOICE_ID = "30edfa2e-7d75-45fb-8ccf-e280941393ee"


def test_hume_tts():
    """Test Hume TTS API and save output to local file."""

    # Create output directory if it doesn't exist
    output_dir = Path("temp/output")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Define output file path
    output_file = output_dir / "hume_test_output.mp3"

    try:
        # Initialize Hume client
        client = HumeClient(
            api_key="K59vZ571v0MJAhV0xdiIj5z8lRi4coRxy31ZG5TWZtDRRKOB",
        )

        print("Generating speech using Hume TTS...")

        # Generate speech using the simpler PostedUtterance with voice as dict
        response = client.tts.synthesize_file(
            format=FormatMp3(),
            num_generations=1,
            utterances=[
                {
                    "text": "Beauty is no quality in things themselves: "
                    "It exists merely in the mind which contemplates them.",
                    "voice": {"id": VOICE_ID},
                }
            ],
        )

        # Save the response to a local file
        with open(output_file, "wb") as f:
            for chunk in response:
                f.write(chunk)

        print(f"✅ Success! Audio saved to: {output_file}")
        print(f"File size: {os.path.getsize(output_file)} bytes")

        return str(output_file)

    except Exception as e:
        print(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    test_hume_tts()
