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
LOG_FILE="edgev3_install.log"
log() {
    local TYPE="$1"
    local MSG="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$TYPE] - $MSG" | tee -a "$LOG_FILE"
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
log "INFO" "Starting EDGEv3 installation script."
if command -v java &> /dev/null; then
    log "INFO" "Java is installed. Checking version..."
else
    log "INFO" "Java is not installed. Installing Java 17..."
    sudo dnf install -y java-21-openjdk
    echo 'export PATH=/usr/lib/jvm/java-17-openjdk-17.0.18.0.8-1.el9.x86_64/bin/:$PATH' >> ~/.bashrc
    log "INFO" "Java 17 installed."
fi
CURRENT_JAVA_VERSION=$(get_java_major_version)

# Check if the version is a number
if ! [[ "$CURRENT_JAVA_VERSION" =~ ^[0-9]+$ ]]; then
    log "ERROR" "Could not determine Java version or Java is not installed."
    exit 1
fi

# Compare the version using numeric comparison operators (-gt for "greater than")
if [ "$CURRENT_JAVA_VERSION" -gt 17 ]; then
    log "INFO" "Java version $CURRENT_JAVA_VERSION is greater than 17. Proceeding..."
    # Add the rest of your script logic here
else

    sudo dnf install -y java-17-openjdk
    echo 'export PATH=/usr/lib/jvm/java-17-openjdk-17.0.18.0.8-1.el9.x86_64/bin/:$PATH' >> ~/.bashrc
    log "INFO" "Java 17 installed."
fi


# ---- 3. Install Nextflow ------------------------------------------------

# Define installation paths
NEXTFLOW_BIN="/usr/local/bin/nextflow"
TMP_DIR=$(mktemp -d)
NEXTFLOW_URL="https://github.com/nextflow-io/nextflow/releases/latest/download/nextflow"
CHECKSUM_URL="https://github.com/nextflow-io/nextflow/releases/latest/download/nextflow.sha256"

log "INFO" "Downloading Nextflow..."
curl -fsSL -o "$TMP_DIR/nextflow" "$NEXTFLOW_URL"
sudo dnf install -y jq
log "INFO" "Verifying checksum..."
pushd "$TMP_DIR" >/dev/null
echo "$(curl -fsSL   -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2026-03-10"   https://api.github.com/repos/nextflow-io/nextflow/releases/latest | jq '.assets[0].digest' | sed 's/sha256://' | sed 's/"//g')  $TMP_DIR/nextflow"  | sha256sum -c
popd >/dev/null

log "INFO" "Installing Nextflow to $NEXTFLOW_BIN..."
sudo install -m 0755 "$TMP_DIR/nextflow" "$NEXTFLOW_BIN"
log "INFO" "Nextflow installed successfully."

# Cleanup
rm -rf "$TMP_DIR"

log "INFO" "Installation complete. Test with: nextflow -version"

log "INFO" "Installing Apptainer..."
sudo dnf install -y epel-release
sudo dnf install -y apptainer

#!/bin/bash

# Define the minimum expected Python version
REQUIRED_MAJOR=3
REQUIRED_MINOR=12

# 1. Check current default Python version
if command -v python3 &> /dev/null; then
    CURRENT_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    log "INFO" "Current default Python version: $CURRENT_VERSION"
else
    log "INFO" "Python 3 is not installed."
    CURRENT_VERSION="0.0"
fi

# 2. Compare versions
CURRENT_MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
CURRENT_MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)

if [ "$CURRENT_MAJOR" -lt "$REQUIRED_MAJOR" ] || ([ "$CURRENT_MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$CURRENT_MINOR" -lt "$REQUIRED_MINOR" ]); then
    log "INFO" "Current version is older than required ($REQUIRED_MAJOR.$REQUIRED_MINOR)."
    
    # 3. Check for and install newer Python versions via DNF
    log "INFO" "Checking available Python package updates via dnf..."
    # Enable EPEL or CRB if looking for non-standard or newer module streams
    sudo dnf check-update python3

    log "INFO" "To install or switch to newer module streams (e.g., python3.11 or python3.12), run:"
    log "INFO" "sudo dnf module install python3.11"
else
    log "INFO" "Your Python version is up to date or newer."
fi
log "INFO" "Configuring alternatives for python3..."
TARGET_VERSION="3.12"
TARGET_BINARY="/usr/bin/python${TARGET_VERSION}"

# 1. Register the original system python3 if not already registered (usually priority 1)
if [ -f /usr/bin/"$CURRENT_VERSION" ]; then
    sudo alternatives --install /usr/bin/python3 python3 /usr/bin/"$CURRENT_VERSION" 1
fi

# 2. Register the new target version with a higher priority (e.g., 10)
sudo alternatives --install /usr/bin/python3 python3 "$TARGET_BINARY" 10

# 3. Explicitly set the target version as the default provider for python3
sudo alternatives --set python3 "$TARGET_BINARY"

# 4. Verify the change
log "INFO" "Success! New default version details:"
python3 --version

log "INFO" "Installing Python packages"
sudo dnf install python3.12-pip -y
python3 -m venv edgev3_env
source edgev3_env/bin/activate
pip install jinja2 
cat  <<EOF >> ~/.bash_profile
source ~/edge-v3/workflows/Nextflow/edgev3_env/bin/activate
EOF
# prompt user for file paths and store as environment variables

log "INFO" "=== File Path Configuration ==="

export NXF_SYNTAX_PARSER=v1
# Prompt for path to root of projects directory
if [ -n "$PROJECTS_DIR" ]; then
    log "INFO" "PROJECTS_DIR is already set to: $PROJECTS_DIR"
    read -p "Do you want to change it? (y/n): " CHANGE_PROJECTS_DIR
    if [[ $CHANGE_PROJECTS_DIR != "y" && $CHANGE_PROJECTS_DIR != "Y" ]]; then
        log "INFO" "Keeping existing PROJECTS_DIR: $PROJECTS_DIR"
    else
        read -p "Enter new path to projects directory: " PROJECTS_DIR
        export PROJECTS_DIR
        log "INFO" "PROJECTS_DIR set to: $PROJECTS_DIR"
    fi
else
    read -p "Enter path to projects directory: " PROJECTS_DIR
    export PROJECTS_DIR
fi

# Prompt for path to directory for Nextflow intermediate files
if [ -n "$NEXTFLOW_OUT_DIR" ]; then
    log "INFO" "NEXTFLOW_OUT_DIR is already set to: $NEXTFLOW_OUT_DIR"
    read -p "Do you want to change it? (y/n): " CHANGE_NEXTFLOW_OUT_DIR
    if [[ $CHANGE_NEXTFLOW_OUT_DIR != "y" && $CHANGE_NEXTFLOW_OUT_DIR != "Y" ]]; then
        log "INFO" "Keeping existing NEXTFLOW_OUT_DIR: $NEXTFLOW_OUT_DIR"
    else
        read -p "Enter new path to directory for Nextflow intermediate files: " NEXTFLOW_OUT_DIR
        export NEXTFLOW_OUT_DIR
    fi
else
    read -p "Enter path to directory for Nextflow intermediate files: " NEXTFLOW_OUT_DIR
    export NEXTFLOW_OUT_DIR
fi

# Prompt for path to reference data
if [ -n "$REFDATA_DIR" ]; then
    log "INFO" "REFDATA_DIR is already set to: $REFDATA_DIR"
    read -p "Do you want to change it? (y/n): " CHANGE_REFDATA_DIR
    if [[ $CHANGE_REFDATA_DIR != "y" && $CHANGE_REFDATA_DIR != "Y" ]]; then
        log "INFO" "Keeping existing REFDATA_DIR: $REFDATA_DIR"
    else
        read -p "Enter new path to reference data: " REFDATA_DIR
        export REFDATA_DIR
    fi
else
    read -p "Enter path to reference data: " REFDATA_DIR
    export REFDATA_DIR
fi

# Prompt for path to OPAVER web directory
export OPAVER_WEB_DIR="$HOME/edge-v3/io/opaver_web"

# Prompt for path to template file used to render Nextflow config file
export TEMPLATE_FILE="$HOME/edge-v3/workflows/Nextflow/metagenomics/nextflow/scripts/nextflow_config.tmpl"
log "INFO" "=== Environment Variables Set ==="
log "INFO" "PROJECTS_DIR: $PROJECTS_DIR"
log "INFO" "NEXTFLOW_OUT_DIR: $NEXTFLOW_OUT_DIR"
log "INFO" "REFDATA_DIR: $REFDATA_DIR"
log "INFO" "OPAVER_WEB_DIR: $OPAVER_WEB_DIR"
log "INFO" "TEMPLATE_FILE: $TEMPLATE_FILE"

# Optional: Validate that files exist
log "INFO" "=== Validating Paths ==="
for var in PROJECTS_DIR NEXTFLOW_OUT_DIR REFDATA_DIR OPAVER_WEB_DIR; do
    path="${!var}"
    if [ -d "$path" ]; then
        log "INFO" "✓ ${var}: Directory exists"
    else
        log "INFO" "✗ ${var}: Directory not found (will be created if needed)"
        mkdir -p "$path"
    fi
done
if [ -f "$TEMPLATE_FILE" ]; then
    log "INFO" "✓ TEMPLATE_FILE: File exists"
else
    log "INFO" "✗ TEMPLATE_FILE: File not found (please check the path)"
fi

# Optional: Save to a file for persistence
log "INFO" "=== Save Environment Variables ==="
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
    log "INFO" "Variables saved to .bash_profile"
    log "INFO" "Source it later with: source ~/.bash_profile"
fi

exit 0