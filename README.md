# MailFleet

Bulk email CLI with multi-provider support, markdown templates, variable substitution, browser preview, and a web dashboard for management.

## Features

- **5 email providers**: Brevo, Resend, SendGrid, Mailgun, SendPulse
- **Markdown templates**: Write emails in `.md` files, rendered to styled HTML
- **Variable substitution**: Use `{{name}}`, `{{company}}`, or any `{{nested.field}}` in subject and body
- **CSV + JSON recipients**: Auto-detected by file extension, also supports plain `.txt` email lists
- **Browser preview**: Render the email with the first recipient's data and open in your default browser
- **Batch sending**: Configurable batch size and delay between batches
- **Dry run**: Simulate sends without actually sending
- **SQLite history**: Every batch and individual send is logged for audit
- **Web dashboard**: React SPA for composing, previewing, sending, viewing history, and managing templates and config
- **Saved templates**: Store reusable markdown templates with subjects

## Quick Start

### Option 1: Install from npm (Recommended)

```bash
npm install -g mail-fleet-cli
```

After installation, you can use the CLI directly:

```bash
# Start the web dashboard
npx mail-fleet-cli dashboard

# Or use the build command
npx mail-fleet-cli build
```

### Option 2: Clone from source

```bash
git clone https://github.com/neang-mengseang/MailFleet.git
cd MailFleet
npm install
npm run build
```

Or use the CLI build command:

```bash
npm install
node dist/cli/index.js build
```

This builds both the CLI (TypeScript → `dist/`) and the web dashboard (`web/dist/`).

### Configure a provider

```bash
node dist/cli/index.js config set BREVO_API_KEY your-api-key-here
node dist/cli/index.js config set DEFAULT_FROM_EMAIL you@example.com
node dist/cli/index.js config set DEFAULT_FROM_NAME "Your Name"
```

### Send bulk emails

```bash
node dist/cli/index.js send \
  -m examples/welcome.md \
  -r examples/recipients.csv \
  -s "Welcome {{name}}!" \
  -f you@example.com \
  -p brevo
```

### Preview before sending

```bash
node dist/cli/index.js preview \
  -m examples/welcome.md \
  -s "Welcome {{name}}!" \
  -r examples/recipients.csv
```

Opens the rendered email in your browser using the first recipient's data.

### Dry run

Add `--dry-run` to simulate sending without actually sending emails:

```bash
node dist/cli/index.js send -m examples/welcome.md -r examples/recipients.csv -s "Test" -f you@example.com --dry-run
```

### Start the web dashboard

```bash
node dist/cli/index.js dashboard
```

Opens `http://localhost:3210` in your browser with a full management UI.

## CLI Commands

### `build`

Build MailFleet CLI and web dashboard.

```
Options:
  -w, --web-only              Build only the web dashboard
  -c, --cli-only              Build only the CLI
```

### `send`

Send bulk emails from a markdown template to a list of recipients.

```
Options:
  -m, --message <file>       Markdown file with the email body (required)
  -r, --recipients <file>    CSV or JSON file with recipient list (required)
  -s, --subject <text>       Email subject, supports {{variables}} (required)
  -p, --provider <id>        Email provider: brevo|resend|sendgrid|mailgun|sendpulse
  -f, --from <email>         From email address
  -n, --from-name <name>     From display name
  --reply-to <email>         Reply-to email address
  --batch-size <n>           Batch size (default: 50)
  --delay <ms>               Delay between batches in ms (default: 100)
  --tag <tag...>             Tags to attach to emails
  --dry-run                  Simulate without sending
  --no-progress              Hide per-recipient progress
```

### `preview`

Preview a rendered email in the browser.

```
Options:
  -m, --message <file>       Markdown file (required)
  -s, --subject <text>       Email subject (required)
  -r, --recipients <file>    Uses first recipient for variable substitution
  -o, --output <file>        Save HTML to file instead of opening browser
  --print                    Print rendered HTML to stdout
```

### `config`

Manage API keys and defaults.

```
Subcommands:
  set <key> <value>          Set a config value
  get <key>                  Get a config value
  list                       List all config (API keys masked)
  delete <key>               Delete a config value
  clear                      Clear all config
  path                       Show config file path
  providers                  Show provider configuration status
```

### `history`

View sending history.

```
Subcommands:
  batches [-l <limit>]       List recent send batches
  batch <id>                 Show details of a specific batch
  stats                      Show overall statistics
```

### `template`

Manage saved email templates.

```
Subcommands:
  save <name> -m <file> -s <subject>   Save a markdown file as a template
  list                                  List all templates
  show <name>                           Show a template
  delete <name>                         Delete a template
```

### `providers`

List all available email providers and their configuration status.

### `dashboard`

Start the web dashboard.

```
Options:
  -p, --port <port>          Port (default: 3210)
  --no-open                  Don't open browser automatically
```

## Provider Configuration

Each provider requires specific API credentials stored in the config file at `~/.mailfleet/config.json`:

| Provider | Config Keys |
|---|---|
| Brevo | `BREVO_API_KEY` |
| Resend | `RESEND_API_KEY` |
| SendGrid | `SENDGRID_API_KEY` |
| Mailgun | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` |
| SendPulse | `SENDPULSE_CLIENT_ID`, `SENDPULSE_CLIENT_SECRET` |

Default settings:

| Key | Description |
|---|---|
| `DEFAULT_FROM_EMAIL` | Default sender email |
| `DEFAULT_FROM_NAME` | Default sender name |
| `DEFAULT_PROVIDER` | Default provider id |

## Recipients File Formats

### CSV

```csv
name,email,company
Alice,alice@example.com,Acme Corp
Bob,bob@example.com,Globex
```

All columns become variables available in templates via `{{column_name}}`.

### JSON

```json
[
  { "name": "Alice", "email": "alice@example.com", "company": "Acme Corp" },
  { "name": "Bob", "email": "bob@example.com", "company": "Globex" }
]
```

### TXT (plain email list)

```
alice@example.com
bob@example.com
```

## Markdown Templates

Write emails in standard Markdown (GitHub Flavored). Use `{{variable}}` syntax for per-recipient substitution:

```markdown
# Hello {{name}}

Welcome to our service! Your company **{{company}}** is now registered.

Here's what you can do next:
- Complete your profile
- Invite team members
- Start your first project

Best regards,
The Team
```

Variables are substituted from the recipient data (CSV columns or JSON fields). Nested fields are supported with dot notation: `{{address.city}}`.

## Web Dashboard

The dashboard (`mailfleet dashboard`) provides a full management UI:

- **Dashboard**: Overview stats and provider status
- **Compose**: Write markdown emails, preview inline, send to recipients
- **History**: Browse all send batches, click to see per-recipient results
- **Templates**: Save and manage reusable email templates
- **Settings**: Configure provider API keys and defaults

## Data Storage

- Config: `~/.mailfleet/config.json`
- Database: `~/.mailfleet/mailfleet.db` (SQLite)

## Requirements

- Node.js 22+ (uses built-in `node:sqlite`)
- npm

## Development

```bash
# CLI dev (watch mode)
npx tsx watch src/cli/main.ts --help

# Web dashboard dev (hot reload)
npm run dev:web

# API server dev (watch mode)
npm run dev:server

# Typecheck
npm run typecheck

# Build everything
npm run build

# Or use CLI build command
node dist/cli/index.js build
```

## Project Structure

```
MailFleet/
├── src/
│   ├── cli/              # CLI commands (commander)
│   │   ├── index.ts      # Entry point (suppresses warnings)
│   │   ├── main.ts       # Process handlers
│   │   ├── program.ts    # Commander program setup
│   │   ├── send.ts       # send command
│   │   ├── preview.ts    # preview command
│   │   ├── config-cmd.ts # config command
│   │   ├── dashboard.ts  # dashboard command
│   │   ├── history.ts    # history command
│   │   ├── providers-cmd.ts
│   │   └── template.ts   # template command
│   ├── providers/        # Email provider adapters (all use fetch)
│   │   ├── base.ts       # Provider interface
│   │   ├── brevo.ts
│   │   ├── resend.ts
│   │   ├── sendgrid.ts
│   │   ├── mailgun.ts
│   │   ├── sendpulse.ts
│   │   └── index.ts      # Registry
│   ├── core/
│   │   ├── renderer.ts   # Markdown → HTML
│   │   ├── templater.ts  # {{variable}} substitution
│   │   ├── recipients.ts # CSV/JSON/TXT parser
│   │   ├── sender.ts     # Bulk send orchestration
│   │   └── preview.ts    # Browser preview
│   ├── db/
│   │   └── index.ts      # SQLite (node:sqlite) schema + queries
│   ├── server/
│   │   └── index.ts      # Express API + static SPA serving
│   └── config/
│       └── index.ts      # Config file management
├── web/                  # React SPA dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── index.css
│   │   └── components/
│   │       ├── Dashboard.tsx
│   │       ├── Compose.tsx
│   │       ├── SentHistory.tsx
│   │       ├── Templates.tsx
│   │       └── SettingsPage.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── examples/
│   ├── welcome.md
│   └── recipients.csv
├── package.json
└── tsconfig.json
```
