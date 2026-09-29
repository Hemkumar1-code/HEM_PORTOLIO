const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const newCards = `
      <!-- PROJECT 3: Daily Update System -->
      <article class="project-card reveal" data-delay="0" aria-labelledby="card-daily-update">
        <div class="card-body" style="padding-top: var(--space-xl)">
          <span class="card-category">Internal Tool &middot; Workflow</span>
          <h3 class="card-title" id="card-daily-update">Daily Update System</h3>
          <p class="card-desc">
            Automated end-of-day reporting workflow. Fetches task completions and time tracking data, generates an AI summary, and posts to Slack.
          </p>
          <div class="card-tags">
            <span class="tag">n8n</span>
            <span class="tag">OpenAI</span>
            <span class="tag">Slack API</span>
          </div>
          <div class="card-footer">
            <a href="projects/daily-update/index.html" class="card-link" id="link-daily-update">
              View project &#8599;
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M7 7h10v10"/>
              </svg>
            </a>
          </div>
        </div>
      </article>

      <!-- PROJECT 4: Smart Canteen -->
      <article class="project-card reveal" data-delay="80" aria-labelledby="card-smart-canteen">
        <div class="card-body" style="padding-top: var(--space-xl)">
          <span class="card-category">Automation &middot; System</span>
          <h3 class="card-title" id="card-smart-canteen">Smart Canteen</h3>
          <p class="card-desc">
            QR code based ordering system. Checks inventory in Google Sheets in real-time, generates payment links, and confirms orders via WhatsApp.
          </p>
          <div class="card-tags">
            <span class="tag">Webhook</span>
            <span class="tag">Stripe</span>
            <span class="tag">WhatsApp</span>
          </div>
          <div class="card-footer">
            <a href="projects/smart-canteen/index.html" class="card-link" id="link-smart-canteen">
              View project &#8599;
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M7 7h10v10"/>
              </svg>
            </a>
          </div>
        </div>
      </article>

      <!-- PROJECT 5: Task Tracker -->
      <article class="project-card reveal" data-delay="160" aria-labelledby="card-task-tracker">
        <div class="card-body" style="padding-top: var(--space-xl)">
          <span class="card-category">DevOps &middot; Sync</span>
          <h3 class="card-title" id="card-task-tracker">Task Tracker Sync</h3>
          <p class="card-desc">
            When a GitHub PR is merged, this extracts the ticket ID, updates the Jira status to Done, logs release notes in Notion, and pings Discord.
          </p>
          <div class="card-tags">
            <span class="tag">GitHub</span>
            <span class="tag">Jira</span>
            <span class="tag">Notion</span>
          </div>
          <div class="card-footer">
            <a href="projects/task-tracker/index.html" class="card-link" id="link-task-tracker">
              View project &#8599;
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M7 7h10v10"/>
              </svg>
            </a>
          </div>
        </div>
      </article>
`;

if (!html.includes('Daily Update System')) {
  html = html.replace('    </div><!-- .projects-grid -->', newCards + '\n    </div><!-- .projects-grid -->');
  fs.writeFileSync(indexHtmlPath, html);
  console.log('Added cards');
} else {
  console.log('Cards already exist');
}
