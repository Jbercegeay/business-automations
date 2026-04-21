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

## 3. Choose repo access

Recommended: keep the repository private and give the server proper GitHub access.

Public access is optional and should only be used if you intentionally want the code public.

### Option A: Private repo deployment

Use an SSH deploy key or another deliberate GitHub auth method for the server, then clone:

```bash
sudo mkdir -p /opt/business-automations
sudo git clone <YOUR_PRIVATE_GIT_REMOTE> /opt/business-automations
cd /opt/business-automations
sudo npm ci
```

### Option B: Public repo deployment

If you intentionally make the repository public, you can clone it directly:

```bash
sudo mkdir -p /opt/business-automations
sudo git clone https://github.com/Jbercegeay/business-automations.git /opt/business-automations
cd /opt/business-automations
sudo npm ci
```

If the private repo clone fails over HTTPS, prefer fixing GitHub access on the server instead of making the repo public just for deployment.

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
sudo npm ci
sudo systemctl restart receipt-parser
```

## Notes

- The committed service file includes `EnvironmentFile=/opt/business-automations/.env`.
- A committed `package-lock.json` is now included, so `npm ci` is the preferred production install and update command.
- If `npm ci` fails because `package.json` and `package-lock.json` are out of sync, fix that mismatch in Git first and then pull again on the server.
