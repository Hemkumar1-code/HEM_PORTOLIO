const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'projects');
const mealDeskDir = path.join(baseDir, 'meal-desk');

const projects = [
  {
    id: 'daily-update',
    title: 'Daily Update System',
    subtitle: 'Automated EOD Reporting Workflow',
    desc: 'Automatically fetches task completions and time tracking data at the end of the day, generates an AI summary, and posts the report to Slack and WhatsApp.',
    tags: ['n8n', 'OpenAI', 'Slack API', 'WhatsApp'],
    nodes: [
      { id: 'schedule', name: 'Schedule', type: 'Cron Trigger', category: 'trigger', x: 60, y: 200, what: 'Triggers every day at 5:00 PM.', why: 'To automate end-of-day reporting.', howUsed: 'Set to run Mon-Fri at 17:00.', process: 'Triggers workflow.', input: 'Time', output: 'Start signal', next: 'Fetch Tasks' },
      { id: 'fetch-tasks', name: 'Fetch Tasks', type: 'HTTP Request', category: 'api', x: 260, y: 200, what: 'Gets completed tasks from Jira.', why: 'To know what was done.', howUsed: 'GET request to Jira API.', process: 'Fetches tickets moved to Done today.', input: 'API Key', output: 'JSON task list', next: 'Format Data' },
      { id: 'format-data', name: 'Format Data', type: 'Code Node', category: 'code', x: 460, y: 200, what: 'Parses JSON.', why: 'To clean up raw API data.', howUsed: 'JS snippet.', process: 'Extracts names and times.', input: 'Raw JSON', output: 'Clean array', next: 'AI Summary' },
      { id: 'ai-summary', name: 'AI Summary', type: 'OpenAI', category: 'ai', x: 660, y: 200, what: 'Writes a human-readable summary.', why: 'Raw data is hard to read.', howUsed: 'Prompt: Summarize these tasks.', process: 'LLM generation.', input: 'Clean array', output: 'Formatted text', next: 'Send Slack' },
      { id: 'send-slack', name: 'Send Slack', type: 'Slack', category: 'output', x: 860, y: 200, what: 'Posts to #daily-updates.', why: 'To notify the team.', howUsed: 'Slack Webhook.', process: 'Sends text.', input: 'Formatted text', output: 'Message ID', next: 'None' }
    ],
    connections: [
      { from: 'schedule', to: 'fetch-tasks' },
      { from: 'fetch-tasks', to: 'format-data' },
      { from: 'format-data', to: 'ai-summary' },
      { from: 'ai-summary', to: 'send-slack' }
    ],
    execSequence: [
      { nodeId: 'schedule', connTo: 'fetch-tasks', label: 'Triggered at 5:00 PM' },
      { nodeId: 'fetch-tasks', connTo: 'format-data', label: 'Fetched Jira tasks' },
      { nodeId: 'format-data', connTo: 'ai-summary', label: 'Data formatted' },
      { nodeId: 'ai-summary', connTo: 'send-slack', label: 'AI wrote summary' },
      { nodeId: 'send-slack', connTo: null, label: 'Report posted to Slack' }
    ]
  },
  {
    id: 'smart-canteen',
    title: 'Smart Canteen',
    subtitle: 'QR Code Ordering System',
    desc: 'Employees scan a QR code to order food. The workflow checks inventory in Google Sheets, generates a payment link, and sends order confirmation via WhatsApp.',
    tags: ['Webhook', 'Google Sheets', 'Stripe', 'WhatsApp'],
    nodes: [
      { id: 'webhook', name: 'Webhook', type: 'Webhook Trigger', category: 'trigger', x: 60, y: 200, what: 'Receives order from QR scan.', why: 'Entry point for orders.', howUsed: 'POST endpoint.', process: 'Receives user ID and item ID.', input: 'Order JSON', output: 'Order Data', next: 'Check Inventory' },
      { id: 'check-inv', name: 'Check Inventory', type: 'Google Sheets', category: 'api', x: 260, y: 200, what: 'Looks up stock.', why: 'To prevent ordering out-of-stock items.', howUsed: 'VLOOKUP by item ID.', process: 'Reads sheet.', input: 'Item ID', output: 'Stock count', next: 'In Stock?' },
      { id: 'in-stock', name: 'In Stock?', type: 'IF Node', category: 'logic', x: 460, y: 200, what: 'Checks if stock > 0.', why: 'Branching logic.', howUsed: 'Condition: stock > 0.', process: 'Routes flow.', input: 'Stock count', output: 'True/False', next: 'Payment Link (True)' },
      { id: 'payment', name: 'Payment Link', type: 'HTTP Request', category: 'api', x: 660, y: 140, what: 'Generates Stripe link.', why: 'To collect payment.', howUsed: 'POST to Stripe.', process: 'Creates session.', input: 'Price', output: 'URL', next: 'Send WA' },
      { id: 'send-wa', name: 'Send WhatsApp', type: 'WhatsApp', category: 'output', x: 860, y: 140, what: 'Sends link to user.', why: 'To notify them.', howUsed: 'Twilio API.', process: 'Sends template message.', input: 'URL, Phone', output: 'Sent status', next: 'None' },
      { id: 'out-of-stock', name: 'Out of Stock Msg', type: 'WhatsApp', category: 'error', x: 660, y: 260, what: 'Sends sorry message.', why: 'To inform user.', howUsed: 'Twilio API.', process: 'Sends text.', input: 'Phone', output: 'Sent status', next: 'None' }
    ],
    connections: [
      { from: 'webhook', to: 'check-inv' },
      { from: 'check-inv', to: 'in-stock' },
      { from: 'in-stock', to: 'payment', label: 'true' },
      { from: 'in-stock', to: 'out-of-stock', label: 'false' },
      { from: 'payment', to: 'send-wa' }
    ],
    execSequence: [
      { nodeId: 'webhook', connTo: 'check-inv', label: 'Order received' },
      { nodeId: 'check-inv', connTo: 'in-stock', label: 'Checked stock' },
      { nodeId: 'in-stock', connTo: 'payment', label: 'Item is in stock' },
      { nodeId: 'payment', connTo: 'send-wa', label: 'Generated payment link' },
      { nodeId: 'send-wa', connTo: null, label: 'Sent to WhatsApp' }
    ]
  },
  {
    id: 'task-tracker',
    title: 'Task Tracker',
    subtitle: 'DevOps Sync Automation',
    desc: 'When a GitHub PR is merged, this workflow extracts the ticket ID, updates the Jira status, logs it in Notion, and notifies the team on Discord.',
    tags: ['GitHub', 'Jira', 'Notion', 'Discord'],
    nodes: [
      { id: 'github', name: 'GitHub Webhook', type: 'Webhook Trigger', category: 'trigger', x: 60, y: 200, what: 'Listens for PR merges.', why: 'To automate post-merge tasks.', howUsed: 'GitHub webhook.', process: 'Triggers on pull_request closed.', input: 'PR JSON', output: 'PR details', next: 'Extract ID' },
      { id: 'extract-id', name: 'Extract Ticket ID', type: 'Code Node', category: 'code', x: 260, y: 200, what: 'Finds PROJ-123 in title.', why: 'To link to Jira.', howUsed: 'Regex match.', process: 'Parses string.', input: 'PR title', output: 'Ticket ID', next: 'Update Jira' },
      { id: 'update-jira', name: 'Update Jira', type: 'HTTP Request', category: 'api', x: 460, y: 200, what: 'Moves ticket to Done.', why: 'To keep board updated.', howUsed: 'PUT request.', process: 'Updates status.', input: 'Ticket ID', output: 'Success', next: 'Log Notion' },
      { id: 'log-notion', name: 'Log Notion', type: 'HTTP Request', category: 'api', x: 660, y: 200, what: 'Adds row to release notes.', why: 'For documentation.', howUsed: 'POST request.', process: 'Creates page.', input: 'PR title', output: 'Page ID', next: 'Discord' },
      { id: 'discord', name: 'Notify Discord', type: 'HTTP Request', category: 'output', x: 860, y: 200, what: 'Sends message to #dev.', why: 'To notify QA.', howUsed: 'Discord webhook.', process: 'Sends embed.', input: 'Message', output: 'Sent status', next: 'None' }
    ],
    connections: [
      { from: 'github', to: 'extract-id' },
      { from: 'extract-id', to: 'update-jira' },
      { from: 'update-jira', to: 'log-notion' },
      { from: 'log-notion', to: 'discord' }
    ],
    execSequence: [
      { nodeId: 'github', connTo: 'extract-id', label: 'PR Merged' },
      { nodeId: 'extract-id', connTo: 'update-jira', label: 'Extracted PROJ-123' },
      { nodeId: 'update-jira', connTo: 'log-notion', label: 'Ticket moved to Done' },
      { nodeId: 'log-notion', connTo: 'discord', label: 'Logged in Notion' },
      { nodeId: 'discord', connTo: null, label: 'QA Notified' }
    ]
  }
];

function generate() {
  const mealDeskHtml = fs.readFileSync(path.join(mealDeskDir, 'index.html'), 'utf8');
  const mealDeskCss = fs.readFileSync(path.join(mealDeskDir, 'style.css'), 'utf8');
  const mealDeskJs = fs.readFileSync(path.join(mealDeskDir, 'script.js'), 'utf8');

  for (const proj of projects) {
    const pDir = path.join(baseDir, proj.id);
    if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });

    // HTML
    let html = mealDeskHtml
      .replace(/Meal Desk - Interactive Workflow/g, `${proj.title} - Interactive Workflow`)
      .replace(/Meal Desk/g, proj.title)
      .replace(/Food polling and billing automation[^<]*/, proj.desc)
      .replace(/<p class="ph-subtitle">.*?<\/p>/, `<p class="ph-subtitle">${proj.subtitle}</p>`)
      .replace(/<div class="ws-tabs".*?<\/div>/s, `<div class="ws-tabs" role="tablist"><button class="ws-tab active" role="tab" aria-selected="true">Workflow</button></div>`) // Simple tab
      .replace(/id="card-mealdesk"/g, `id="card-${proj.id}"`);
    
    // Tech badges
    const badgesHtml = proj.tags.map(t => `<span class="tech-badge">${t}</span>`).join('\n      ');
    html = html.replace(/<div class="ph-tech">[\s\S]*?<\/div>/, `<div class="ph-tech">\n      ${badgesHtml}\n    </div>`);

    // JS
    let js = mealDeskJs.replace(/const NODES = \[[\s\S]*?\];/, `const NODES = ${JSON.stringify(proj.nodes, null, 2)};`);
    js = js.replace(/const EXEC_SEQUENCE = \[[\s\S]*?\];/, `const EXEC_SEQUENCE = ${JSON.stringify(proj.execSequence, null, 2)};`);
    js = js.replace(/const CONNECTIONS = \[[\s\S]*?\];/, `const CONNECTIONS = ${JSON.stringify(proj.connections, null, 2)};`);
    js = js.replace(/CANVAS_W = 2000/, `CANVAS_W = 1200`);

    fs.writeFileSync(path.join(pDir, 'index.html'), html);
    fs.writeFileSync(path.join(pDir, 'style.css'), mealDeskCss);
    fs.writeFileSync(path.join(pDir, 'script.js'), js);
    console.log(`Generated ${proj.id}`);
  }
}

generate();
