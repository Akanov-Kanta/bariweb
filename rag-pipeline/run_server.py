#!/usr/bin/env python3
"""
run_server.py — Convenience script to start the retrieval API server.

Usage:
    python run_server.py
    python run_server.py --port 8080
    python run_server.py --reload

The server starts on http://localhost:8000 by default.
API docs are available at http://localhost:8000/docs
"""

import argparse
import os
import sys

# Add project root to path so imports work from any directory.
sys.path.insert(0, os.path.dirname(__file__))


def main():
    parser = argparse.ArgumentParser(
        description="Start the retrieval API server"
    )
    parser.add_argument(
        "--host", default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port", type=int, default=8001,
        help="Port to listen on (default: 8001)",
    )
    parser.add_argument(
        "--reload", action="store_true",
        help="Enable auto-reload on code changes (development mode)",
    )
    args = parser.parse_args()

    # Lazy import so startup errors are caught cleanly.
    import uvicorn

    print(f"\n{'='*60}")
    print(f"  Retrieval API Server (Step 4)")
    print(f"  Host: {args.host}")
    print(f"  Port: {args.port}")
    print(f"  Docs: http://localhost:{args.port}/docs")
    print(f"{'='*60}\n")

    uvicorn.run(
        "api.app:create_app",
        factory=True,
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
