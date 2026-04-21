#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/opt/business-automations"
SERVICE_NAME="receipt-parser"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo."
  exit 1
fi

echo "Stopping ${SERVICE_NAME}..."
systemctl stop "${SERVICE_NAME}"

echo "Pulling latest code..."
git -C "${APP_DIR}" pull

echo "Installing locked dependencies..."
npm --prefix "${APP_DIR}" ci

echo "Starting ${SERVICE_NAME}..."
systemctl start "${SERVICE_NAME}"

echo "Done. Current service status:"
systemctl --no-pager --full status "${SERVICE_NAME}"
