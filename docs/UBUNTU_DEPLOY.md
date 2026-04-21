# Ubuntu Deployment

This project loads environment variables from a `.env` file in the project root.

If you deploy the repo to:

`/opt/business-automations`

then the runtime `.env` file must live at:

`/opt/business-automations/.env`

## 1. Install runtime dependencies

This guide assumes the server already has Node.js 20+ available. Verify first:

```bash
node -v
npm -v
sudo apt update
sudo apt install -y git
```

If Node.js is missing or older than 20, install or upgrade it before continuing.

## 2. Create an app user

```bash
id automation || sudo useradd --system --create-home --shell /bin/bash automation
```

If you want to run the service as a different user, update the service file before enabling it.

## 3. Clone the repo

```bash
sudo mkdir -p /opt/business-automations
sudo git clone <YOUR_GIT_REMOTE> /opt/business-automations
cd /opt/business-automations
sudo npm install
```

If the repository is private and HTTPS clone fails, use an SSH deploy key or clone as an authenticated user and then transfer ownership to `automation`.

## 4. Create the production `.env`

```bash
sudo cp .env.example .env
sudo nano .env
```

Fill in the same values you used locally.

Protect the repo and secret file:

```bash
sudo chown -R automation:automation /opt/business-automations
sudo chmod 750 /opt/business-automations
sudo chmod 640 /opt/business-automations/.env
```

## 5. Prepare writable state

The receipt parser stores state in:

`/opt/business-automations/.data/receipt-parser-state.json`

Create the folder and assign ownership to the runtime user:

```bash
sudo mkdir -p /opt/business-automations/.data
sudo chown -R automation:automation /opt/business-automations/.data
```

## 6. Install the systemd service

Copy the included service template into `systemd`. It expects the runtime `.env` at `/opt/business-automations/.env`:

```bash
sudo cp deploy/receipt-parser.service /etc/systemd/system/receipt-parser.service
sudo systemctl daemon-reload
sudo systemctl enable --now receipt-parser
```

## 7. Check logs

```bash
sudo systemctl status receipt-parser
sudo journalctl -u receipt-parser -f
```

## 8. Updating later

```bash
cd /opt/business-automations
sudo git pull
sudo npm install
sudo systemctl restart receipt-parser
```

## Notes

- The committed service file includes `EnvironmentFile=/opt/business-automations/.env`.
- `npm install` is used for now because the repo does not yet include a `package-lock.json`.
- Once a lockfile is committed, prefer a more repeatable install flow for production updates.
