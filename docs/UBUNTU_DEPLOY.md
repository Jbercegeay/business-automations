# Ubuntu Deployment

This project loads environment variables from a `.env` file in the project root.

If you deploy the repo to:

`/opt/business-automations`

then the runtime `.env` file must live at:

`/opt/business-automations/.env`

## 1. Install runtime dependencies

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Create an app user

```bash
sudo useradd --system --create-home --shell /bin/bash automation
```

If you want to run the service as a different user, update the service file before enabling it.

## 3. Clone the repo

```bash
sudo mkdir -p /opt
sudo chown "$USER":"$USER" /opt
cd /opt
git clone <YOUR_GIT_REMOTE> business-automations
cd /opt/business-automations
npm install
```

## 4. Create the production `.env`

```bash
cp .env.example .env
nano .env
```

Fill in the same values you used locally.

## 5. Prepare writable state

The receipt parser stores state in:

`/opt/business-automations/.data/receipt-parser-state.json`

Create the folder and assign ownership to the runtime user:

```bash
sudo mkdir -p /opt/business-automations/.data
sudo chown -R automation:automation /opt/business-automations
```

## 6. Install the systemd service

Copy the included service template into `systemd`:

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
git pull
npm install
sudo systemctl restart receipt-parser
```
