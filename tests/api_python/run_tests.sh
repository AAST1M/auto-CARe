#!/bin/bash
set -e

# Change to the directory of this script
cd "$(dirname "$0")"

echo "Setting up Python API Testing Environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created virtual environment."
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies quietly
echo "Installing dependencies..."
pip install -r requirements.txt > /dev/null

# Run pytest
echo "Running pytest..."
pytest -v

# Deactivate
deactivate
