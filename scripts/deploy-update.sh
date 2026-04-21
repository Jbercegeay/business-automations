#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/opt/business-automations"
SERVICES=(
  "receipt-parser"
  "dad-joke-for-joey"
  "linkedin-ai-first-generator"
)

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo."
  exit 1
fi

for service in "${SERVICES[@]}"; do
  if systemctl list-unit-files "${service}.service" >/dev/null 2>&1; then
    echo "Stopping ${service}..."
    systemctl stop "${service}" || true
  fi
done

echo "Pulling latest code..."
git -C "${APP_DIR}" pull

echo "Installing locked dependencies..."
npm --prefix "${APP_DIR}" ci

for service in "${SERVICES[@]}"; do
  if systemctl list-unit-files "${service}.service" >/dev/null 2>&1; then
    echo "Starting ${service}..."
    systemctl start "${service}"
    echo "Current ${service} status:"
    systemctl --no-pager --full status "${service}"
  fi
done
