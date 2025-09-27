#!/usr/bin/env python3
import argparse
import importlib.util
import logging
import os
import subprocess
import sys
from typing import Optional


def setup_basic_logging(log_level: str = "INFO") -> None:
    """Set up basic logging configuration for the script."""
    level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )


def ensure_favicon_exists():
    """Ensure that a favicon exists in the static directory."""
    logger = logging.getLogger(__name__)

    static_dir = "static"
    favicon_path = os.path.join(static_dir, "favicon.ico")

    # Create static directory if it doesn't exist
    os.makedirs(static_dir, exist_ok=True)

    # Check if favicon already exists
    if not os.path.exists(favicon_path):
        logger.info("Creating favicon...")
        # Check if we have the create_favicon script
        if os.path.exists("create_favicon.py"):
            try:
                # Try to import and run the create_favicon module
                spec = importlib.util.spec_from_file_location("create_favicon", "create_favicon.py")
                if spec and spec.loader:
                    create_favicon = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(create_favicon)
                    create_favicon.create_favicon()
                    logger.info("Favicon created successfully.")
                else:
                    logger.warning("Could not load create_favicon module.")
            except Exception as e:
                logger.error(f"Error creating favicon: {e}", exc_info=True)
                logger.warning("Will use default favicon handling in FastAPI.")
        else:
            logger.warning(
                "create_favicon.py not found. Will use default favicon handling in FastAPI."
            )


def start_server(
    mode: str = "dev",
    port: int = 50000,
    host: str = "0.0.0.0",
    use_ngrok: bool = True,
    ngrok_domain: str = "fond-workable-firefly.ngrok-free.app",
    workers: Optional[int] = None,
    log_level: str = "INFO",
) -> None:
    """
    Start the FastAPI server in development or production mode with optional ngrok tunneling.

    Args:
        mode: Server mode - 'dev' for development or 'prod' for production
        port: Port number to run the server on
        host: Host address to bind the server to
        use_ngrok: Whether to use ngrok for tunneling
        ngrok_domain: The ngrok domain to use for tunneling
        workers: Number of worker processes (only used in production mode)
        log_level: Logging level
    """
    logger = logging.getLogger(__name__)

    # Ensure the src directory is in the Python path
    sys.path.insert(0, os.path.abspath("."))

    # Validate configuration before starting the server
    from src.core.config import create_directories, validate_config

    print("\n" + "=" * 60)
    print("🚀 Starting EchoLingo Backend Server")
    print("=" * 60 + "\n")

    is_valid, error_msg = validate_config()
    if not is_valid:
        print(error_msg)
        print("\n" + "=" * 60)
        sys.exit(1)

    # Create necessary directories
    try:
        create_directories()
        print("✅ Created necessary directories")
    except Exception as e:
        print(f"❌ Failed to create directories: {e}")
        sys.exit(1)

    print("\n" + "=" * 60 + "\n")

    # Ensure favicon exists
    ensure_favicon_exists()

    # Determine the command to run based on the mode
    if mode == "dev":
        logger.info("Configuring server in development mode")
        server_cmd = [
            "uvicorn",
            "src.app:app",
            "--reload",
            f"--host={host}",
            f"--port={port}",
            f"--log-level={log_level.lower()}",
        ]
    else:  # Production mode
        logger.info("Configuring server in production mode")
        server_cmd = [
            "uvicorn",
            "src.app:app",
            f"--host={host}",
            f"--port={port}",
            f"--log-level={log_level.lower()}",
        ]

        # Add workers in production mode if specified
        if workers:
            logger.info(f"Using {workers} workers")
            server_cmd.append(f"--workers={workers}")
        else:
            # Default to CPU count if not specified
            import multiprocessing

            cpu_count = multiprocessing.cpu_count()
            workers = min(cpu_count * 2 + 1, 8)  # Common formula: (2 * CPU cores) + 1, capped at 8
            logger.info(f"Auto-configuring {workers} workers based on CPU count")
            server_cmd.append(f"--workers={workers}")

    # Start ngrok in a separate process if requested
    ngrok_process = None
    if use_ngrok:
        logger.info(f"Starting ngrok tunnel to {ngrok_domain}...")
        ngrok_cmd = [
            "ngrok",
            "http",
            f"--domain={ngrok_domain}",
            str(port),
        ]
        ngrok_process = subprocess.Popen(
            ngrok_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        logger.info(f"Ngrok tunnel started at https://{ngrok_domain}")

    try:
        # Start the server
        logger.info(f"Starting server in {mode} mode on {host}:{port}")
        subprocess.run(server_cmd)
    except KeyboardInterrupt:
        logger.info("\nShutting down server...")
    finally:
        # Clean up ngrok process if it was started
        if ngrok_process:
            logger.info("Shutting down ngrok tunnel...")
            ngrok_process.terminate()
            ngrok_process.wait()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the FastAPI server in development or production mode"
    )
    parser.add_argument(
        "--mode",
        choices=["dev", "prod"],
        default="dev",
        help="Server mode: 'dev' for development with auto-reload, 'prod' for production",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=50000,
        help="Port number to run the server on (default: 50000)",
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host address to bind the server to (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--ngrok",
        action="store_true",
        default=True,
        help="Use ngrok for tunneling (default: True)",
    )
    parser.add_argument(
        "--no-ngrok",
        action="store_false",
        dest="ngrok",
        help="Disable ngrok tunneling",
    )
    parser.add_argument(
        "--ngrok-domain",
        default="fond-workable-firefly.ngrok-free.app",
        help="The ngrok domain to use for tunneling",
    )
    parser.add_argument(
        "--workers",
        type=int,
        help="Number of worker processes (only used in production mode)",
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        default="INFO",
        help="Logging level (default: INFO)",
    )

    args = parser.parse_args()

    # Set up basic logging for the script
    setup_basic_logging(args.log_level)

    start_server(
        mode=args.mode,
        port=args.port,
        host=args.host,
        use_ngrok=args.ngrok,
        ngrok_domain=args.ngrok_domain,
        workers=args.workers,
        log_level=args.log_level,
    )
