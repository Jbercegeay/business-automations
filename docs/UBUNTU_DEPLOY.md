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

## 3. Configure private GitHub access

Recommended: keep the repository private and use a read-only SSH deploy key on the Ubuntu server.

### 3a. Create the deploy key on Ubuntu

```bash
sudo mkdir -p /root/.ssh
sudo ssh-keygen -t ed25519 -C "business-automations-deploy" -f /root/.ssh/business-automations-deploy -N ""
sudo cat /root/.ssh/business-automations-deploy.pub
```

Copy the public key output.

### 3b. Add the deploy key in GitHub

In the GitHub repository:

- open `Settings`
- open `Deploy keys`
- click `Add deploy key`
- use a title like `ubuntu-business-automations`
- paste the public key
- leave `Allow write access` unchecked

### 3c. Configure SSH for GitHub on Ubuntu

```bash
sudo bash -c 'cat > /root/.ssh/config <<EOF
Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/business-automations-deploy
  IdentitiesOnly yes
EOF'
sudo chmod 600 /root/.ssh/config
sudo ssh-keyscan github.com | sudo tee -a /root/.ssh/known_hosts >/dev/null
sudo chmod 644 /root/.ssh/known_hosts
sudo ssh -T git@github.com
```

GitHub will usually respond with an authenticated message and `no shell access`. That is expected.

## 4. Clone the repo and install dependencies

```bash
sudo git clone git@github.com:Jbercegeay/business-automations.git /opt/business-automations
cd /opt/business-automations
sudo npm ci
```

## 5. Create the production `.env`

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

## 6. Prepare writable state

The receipt parser stores state in:

`/opt/business-automations/.data/receipt-parser-state.json`

Create the folder and assign ownership to the runtime user:

```bash
sudo mkdir -p /opt/business-automations/.data
sudo chown -R automation:automation /opt/business-automations/.data
```

## 7. Install the systemd service

Copy the included service template into `systemd`. It expects the runtime `.env` at `/opt/business-automations/.env`:

```bash
sudo cp deploy/receipt-parser.service /etc/systemd/system/receipt-parser.service
sudo systemctl daemon-reload
sudo systemctl enable --now receipt-parser
```

## 8. Check logs

```bash
sudo systemctl status receipt-parser
sudo journalctl -u receipt-parser -f
```

## 9. Updating later

```bash
sudo systemctl stop receipt-parser
sudo git -C /opt/business-automations pull
sudo npm --prefix /opt/business-automations ci
sudo systemctl start receipt-parser
```

## Notes

- The committed service file includes `EnvironmentFile=/opt/business-automations/.env`.
- A committed `package-lock.json` is now included, so `npm ci` is the preferred production install and update command.
- If `npm ci` fails because `package.json` and `package-lock.json` are out of sync, fix that mismatch in Git first and then pull again on the server.
- Because the repository is cloned by `root`, future Git operations on the server are simplest if you keep using `sudo`.
- The `git -C` and `npm --prefix` forms avoid needing to `cd` into `/opt/business-automations` from a user that does not have direct directory access.
- Be careful when pasting the Google private key into `.env`; formatting matters, especially if the key uses escaped newlines.
