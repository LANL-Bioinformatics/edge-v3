#!/usr/bin/env bash
# ------------------------------------------------------------
# LANL‑compliant installation script for Java (>= 1.8) and Nextflow
# ------------------------------------------------------------
# Requirements:
#   • Run as a regular user; sudo will be invoked when needed.
#   • Internet access must be authorized per P909‑03.
#   • Checksums must be verified per P210‑01.
# ------------------------------------------------------------

set -euo pipefail

# ---- Helper Functions -------------------------------------------------

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

#!/bin/bash

# Function to extract the major Java version
get_java_major_version() {
    local version_output=$(java -version 2>&1)
    local major_version

    # Extract version string using awk or similar tools
    # This handles both "version 1.x" (older) and "openjdk version x" (newer) formats
    if [[ "$version_output" =~ "openjdk version" ]]; then
        major_version=$(echo "$version_output" | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    else
        major_version=$(echo "$version_output" | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
        if [[ "$major_version" == "1" ]]; then
            # Handle versions like 1.8, 1.7 by getting the second number
            major_version=$(echo "$version_output" | awk -F '"' '/version/ {print $2}' | cut -d'.' -f2)
        fi
    fi
    echo "$major_version"
}

if command -v java &> /dev/null; then
    log "Java is installed. Checking version..."
else
    log "Java is not installed. Installing Java 17..."
    sudo dnf install -y java-21-openjdk
    echo 'export PATH=/usr/lib/jvm/java-17-openjdk-17.0.18.0.8-1.el9.x86_64/bin/:$PATH' >> ~/.bashrc
    log "Java 17 installed."
fi
CURRENT_JAVA_VERSION=$(get_java_major_version)

# Check if the version is a number
if ! [[ "$CURRENT_JAVA_VERSION" =~ ^[0-9]+$ ]]; then
    echo "Error: Could not determine Java version or Java is not installed."
    exit 1
fi

# Compare the version using numeric comparison operators (-gt for "greater than")
if [ "$CURRENT_JAVA_VERSION" -gt 17 ]; then
    echo "Java version $CURRENT_JAVA_VERSION is greater than 17. Proceeding..."
    # Add the rest of your script logic here
else

    sudo dnf install -y java-17-openjdk
    echo 'export PATH=/usr/lib/jvm/java-17-openjdk-17.0.18.0.8-1.el9.x86_64/bin/:$PATH' >> ~/.bashrc
    log "Java 17 installed."
fi


# ---- 3. Install Nextflow ------------------------------------------------

# Define installation paths
NEXTFLOW_BIN="/usr/local/bin/nextflow"
TMP_DIR=$(mktemp -d)
NEXTFLOW_URL="https://github.com/nextflow-io/nextflow/releases/latest/download/nextflow"
CHECKSUM_URL="https://github.com/nextflow-io/nextflow/releases/latest/download/nextflow.sha256"

log "Downloading Nextflow..."
curl -fsSL -o "$TMP_DIR/nextflow" "$NEXTFLOW_URL"

log "Verifying checksum..."
pushd "$TMP_DIR" >/dev/null
echo "$(curl -fsSL   -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2026-03-10"   https://api.github.com/repos/nextflow-io/nextflow/releases/latest | jq '.assets[0].digest' | sed 's/sha256://' | sed 's/"//g')  $TMP_DIR/nextflow"  | sha256sum -c
popd >/dev/null

log "Installing Nextflow to $NEXTFLOW_BIN..."
sudo install -m 0755 "$TMP_DIR/nextflow" "$NEXTFLOW_BIN"
log "Nextflow installed successfully."

# Cleanup
rm -rf "$TMP_DIR"

log "Installation complete. Test with: nextflow -version"

log "Installing Apptainer..."
sudo dnf install -y epel-release
sudo dnf install -y apptainer

log "Installing Python packages"
sudo dnf install python3.12-pip -y
python3 -m venv edgev3_env
source edgev3_env/bin/activate
pip install jinja2 
cat  <<EOF >> ~/.bash_profile
source ~/edge-v3/workflows/Nextflow/edgev3_env/bin/activate
EOF
# prompt user for file paths and store as environment variables

echo "=== File Path Configuration ==="
echo ""

export NXF_SYNTAX_PARSER=v1
# Prompt for path to root of projects directory
read -p "Enter path to projects directory: " PROJECTS_DIR
export PROJECTS_DIR

# Prompt for path to directory for Nextflow intermediate files
read -p "Enter path to directory for Nextflow intermediate files: " NEXTFLOW_OUT_DIR
export NEXTFLOW_OUT_DIR

# Prompt for path to reference data
read -p "Enter path to reference data: " REFDATA_DIR
export REFDATA_DIR

# Prompt for path to OPAVER web directory
export OPAVER_WEB_DIR="$HOME/edge-v3/io/opaver_web"

# Prompt for path to template file used to render Nextflow config file
export TEMPLATE_FILE="$HOME/edge-v3/workflows/Nextflow/metagenomics/nextflow/scripts/nextflow_config.tmpl"
echo ""
echo "=== Environment Variables Set ==="
echo "PROJECTS_DIR: $PROJECTS_DIR"
echo "NEXTFLOW_OUT_DIR: $NEXTFLOW_OUT_DIR"
echo "REFDATA_DIR: $REFDATA_DIR"
echo "OPAVER_WEB_DIR: $OPAVER_WEB_DIR"
echo "TEMPLATE_FILE: $TEMPLATE_FILE"
echo ""

# Optional: Validate that files exist
echo "=== Validating Paths ==="
for var in PROJECTS_DIR NEXTFLOW_OUT_DIR REFDATA_DIR OPAVER_WEB_DIR; do
    path="${!var}"
    if [ -d "$path" ]; then
        echo "✓ ${var}: Directory exists"
    else
        echo "✗ ${var}: Directory not found (will be created if needed)"
        mkdir -p "$path"
    fi
done
if [ -f "$TEMPLATE_FILE" ]; then
    echo "✓ TEMPLATE_FILE: File exists"
else
    echo "✗ TEMPLATE_FILE: File not found (please check the path)"
fi

# Optional: Save to a file for persistence
echo ""
read -p "Save these variables to .bash_profile? (y/n): " SAVE_ENV

if [[ $SAVE_ENV == "y" || $SAVE_ENV == "Y" ]]; then
    cat  <<EOF >> ~/.bash_profile
export PROJECTS_DIR="$PROJECTS_DIR"
export NEXTFLOW_OUT_DIR="$NEXTFLOW_OUT_DIR"
export REFDATA_DIR="$REFDATA_DIR"
export OPAVER_WEB_DIR="$OPAVER_WEB_DIR"
export TEMPLATE_FILE="$TEMPLATE_FILE"
alias run_edge='python $HOME/edge-v3/workflows/Nextflow/metagenomics/nextflow/scripts/run_edge.py'
EOF
    echo "Variables saved to .bash_profile"
    echo "Source it later with: source ~/.bash_profile"
fi

exit 0