/* ============================================================
   MEAL DESK — script.js
   Interactive Workflow Visualization Engine (Learning Mode)
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */

const SVG_NS = 'http://www.w3.org/2000/svg';
const NODE_W = 150;
const NODE_H = 60;
const PAD_R  = 60;
const PAD_B  = 60;

/* Learning Mode Timings */
const ANIM_DURATION = 1200; // Pulse travel time (ms)
const NODE_HOLD_MIN = 3500; // Minimum time node stays active (ms)
const NODE_HOLD_MAX = 5000;

/* ══════════════════════════════════════════════════════════════
   ICONS & CATEGORIES
══════════════════════════════════════════════════════════════ */

const ICONS = {
  trigger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  config: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/></svg>`,
  sheets: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5 a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  logic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  webhook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
};

const CAT_STYLE = {
  trigger:  { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
  webhook:  { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
  config:   { bg: 'rgba(99,179,255,0.15)',  color: '#63b3ff' },
  sheets:   { bg: 'rgba(52,168,83,0.15)',   color: '#34a853' },
  whatsapp: { bg: 'rgba(37,211,102,0.15)',  color: '#25d366' },
  logic:    { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
};

/* ══════════════════════════════════════════════════════════════
   DATA MODULES
══════════════════════════════════════════════════════════════ */

const WORKFLOW_MODULES = {

  /* --- 1. FOOD POLLING --- */
  polling: {
    title: "Food Polling Workflow",
    desc: "Automatically sends food poll WhatsApp messages at scheduled times based on the current menu in Google Sheets.",
    nodes: [
      { id: 'breakfast-schedule', name: 'Breakfast Poll Schedule', type: 'Schedule', category: 'trigger', x: 20, y: 20,
        what: 'Triggers the breakfast food polling workflow at a configured time each morning.',
        why: 'The workflow must start automatically at the correct meal time.',
        howUsed: 'Fires every morning before breakfast hours (e.g. 7:00 AM).',
        input: 'Time configuration', process: 'Checks cron schedule', output: 'Execution trigger', next: 'Set Breakfast Meal' },
      { id: 'set-breakfast', name: 'Set Breakfast Meal', type: 'Set Node', category: 'config', x: 220, y: 20,
        what: 'Sets the meal_type variable to "Breakfast".', why: 'Downstream nodes need to know which meal is being processed.',
        howUsed: 'Sets meal_type="Breakfast" so WhatsApp messages are formatted correctly.',
        input: 'Trigger', process: 'Sets internal variable', output: '{ "meal_type": "Breakfast" }', next: 'Read Food Menu' },

      { id: 'lunch-schedule', name: 'Lunch Poll Schedule', type: 'Schedule', category: 'trigger', x: 20, y: 120,
        what: 'Triggers the lunch food polling workflow.', why: 'Lunch runs on an independent schedule.',
        howUsed: 'Fires at midday (e.g. 11:30 AM).',
        input: 'Time configuration', process: 'Checks cron schedule', output: 'Execution trigger', next: 'Set Lunch Meal' },
      { id: 'set-lunch', name: 'Set Lunch Meal', type: 'Set Node', category: 'config', x: 220, y: 120,
        what: 'Sets the meal_type variable to "Lunch".', why: 'Identifies the lunch meal period for downstream processing.',
        howUsed: 'Sets meal_type="Lunch".',
        input: 'Trigger', process: 'Sets internal variable', output: '{ "meal_type": "Lunch" }', next: 'Read Food Menu' },

      { id: 'dinner-schedule', name: 'Dinner Poll Schedule', type: 'Schedule', category: 'trigger', x: 20, y: 220,
        what: 'Triggers the dinner food polling workflow.', why: 'Dinner runs on its own evening schedule.',
        howUsed: 'Fires before dinner (e.g. 6:30 PM).',
        input: 'Time configuration', process: 'Checks cron schedule', output: 'Execution trigger', next: 'Set Dinner Meal' },
      { id: 'set-dinner', name: 'Set Dinner Meal', type: 'Set Node', category: 'config', x: 220, y: 220,
        what: 'Sets the meal_type variable to "Dinner".', why: 'Identifies the evening meal period.',
        howUsed: 'Sets meal_type="Dinner".',
        input: 'Trigger', process: 'Sets internal variable', output: '{ "meal_type": "Dinner" }', next: 'Read Food Menu' },

      { id: 'read-menu', name: 'Read Food Menu', type: 'Google Sheets', category: 'sheets', x: 420, y: 120,
        what: "Reads the food menu from Google Sheets.", why: "Poll messages must include actual menu items.",
        howUsed: "Reads the daily menu sheet, returning available food items.",
        input: 'meal_type (e.g. Lunch)', process: 'API Call to Google Sheets -> GET Rows', output: '[{"item": "Chicken Rice", "available": true}]', next: 'Pick Today Food Item' },
      { id: 'pick-food', name: 'Pick Today Food Item', type: 'Code Node', category: 'logic', x: 620, y: 120,
        what: "Formats the food items for today's meal.", why: "The raw data needs to be turned into a readable string.",
        howUsed: "Formats the JSON items into a WhatsApp message block.",
        input: 'Array of food items', process: 'Iterates and concatenates strings', output: '"Today\'s Menu: Chicken Rice"', next: 'Get Employee List' },
      { id: 'get-employees', name: 'Get Employee List', type: 'Google Sheets', category: 'sheets', x: 820, y: 120,
        what: "Retrieves the list of active employees.", why: "Workflow needs phone numbers to send messages.",
        howUsed: "Fetches employee registry from Sheets.",
        input: 'Registry Sheet ID', process: 'API Call -> GET Rows where status=Active', output: '[{"name": "Alice", "phone": "123456"}]', next: 'Send WhatsApp Poll' },
      { id: 'send-whatsapp', name: 'Send WhatsApp Poll', type: 'WhatsApp API', category: 'whatsapp', x: 1020, y: 120,
        what: "Sends the poll to each employee.", why: "WhatsApp is the primary communication channel.",
        howUsed: "Iterates through employees and sends the personalized poll.",
        input: 'Employee List + Menu String', process: 'API Call -> POST Messages', output: 'Delivery Status (Success)', next: 'Workflow Complete' },
    ],
    connections: [
      { id: 'c1', from: 'breakfast-schedule', to: 'set-breakfast', type: 'right' },
      { id: 'c2', from: 'set-breakfast', to: 'read-menu', type: 'diag-down' },
      { id: 'c3', from: 'lunch-schedule', to: 'set-lunch', type: 'right' },
      { id: 'c4', from: 'set-lunch', to: 'read-menu', type: 'right' },
      { id: 'c5', from: 'dinner-schedule', to: 'set-dinner', type: 'right' },
      { id: 'c6', from: 'set-dinner', to: 'read-menu', type: 'diag-up' },
      { id: 'c7', from: 'read-menu', to: 'pick-food', type: 'right' },
      { id: 'c8', from: 'pick-food', to: 'get-employees', type: 'right' },
      { id: 'c9', from: 'get-employees', to: 'send-whatsapp', type: 'right' }
    ],
    sequence: [
      'breakfast-schedule', 'set-breakfast', 'read-menu', 'pick-food', 'get-employees', 'send-whatsapp',
      'lunch-schedule', 'set-lunch', 'read-menu', 'pick-food', 'get-employees', 'send-whatsapp',
      'dinner-schedule', 'set-dinner', 'read-menu', 'pick-food', 'get-employees', 'send-whatsapp'
    ]
  },

  /* --- 2. EMPLOYEE RESPONSE --- */
  response: {
    title: "Employee Response Workflow",
    desc: "Receives WhatsApp replies from employees, validates them, and logs confirmed bookings to Google Sheets.",
    nodes: [
      { id: 'wh-reply', name: 'WhatsApp Reply Webhook', type: 'Webhook', category: 'webhook', x: 20, y: 300,
        what: 'Receives incoming WhatsApp messages.', why: 'Acts as the entry point for employee responses.',
        howUsed: 'Listens for POST requests from Meta API.',
        input: 'HTTP POST Data', process: 'Receives request body', output: 'Raw WhatsApp JSON payload', next: 'IF Meta Verification' },
      
      { id: 'meta-verify', name: 'IF Meta Verification', type: 'IF Node', category: 'logic', x: 220, y: 300,
        what: 'Handles webhook verification.', why: 'Meta requires webhooks to echo a challenge token on setup.',
        howUsed: 'Checks if request is a verification challenge or actual message.',
        input: 'hub.challenge parameter', process: 'Evaluate if parameter exists', output: 'Branch (False)', next: 'Parse Incoming Reply' },
      
      { id: 'resp-challenge', name: 'Respond Challenge', type: 'Webhook Response', category: 'webhook', x: 420, y: 180,
        what: 'Responds to Meta verification.', why: 'Required to authorize the webhook.',
        howUsed: 'Echoes the challenge string.',
        input: 'Challenge string', process: 'Respond HTTP 200', output: 'Success', next: 'None' },

      { id: 'parse-reply', name: 'Parse Incoming Reply', type: 'Code Node', category: 'logic', x: 420, y: 420,
        what: 'Extracts the message text and sender phone number.', why: 'Raw WhatsApp JSON is complex.',
        howUsed: 'Extracts the `text.body` and `from` fields.',
        input: 'Raw WhatsApp JSON', process: 'JSON parsing', output: '{ "sender": "12345", "text": "YES" }', next: 'IF Not From Bot' },
      
      { id: 'if-bot', name: 'IF Not From Bot', type: 'IF Node', category: 'logic', x: 620, y: 420,
        what: 'Filters out automated system messages.', why: 'Prevents infinite loops if the bot replies to itself.',
        howUsed: 'Checks sender ID against bot ID.',
        input: 'Sender phone number', process: 'Evaluate sender !== bot', output: 'Branch (True)', next: 'IF Reply Is YES' },
      
      { id: 'if-yes', name: 'IF Reply Is YES', type: 'IF Node', category: 'logic', x: 820, y: 420,
        what: 'Checks if the user replied YES.', why: 'Only YES replies create a booking.',
        howUsed: 'Regex match for "yes" (case insensitive).',
        input: 'Message text ("YES")', process: 'Regex evaluation', output: 'Branch (True)', next: 'Check Poll Window' },

      { id: 'resp-not-yes', name: 'Respond Not Yes', type: 'WhatsApp API', category: 'whatsapp', x: 1020, y: 540,
        what: 'Sends a clarification message.', why: 'If the user says something else, guide them.',
        howUsed: 'Sends "Please reply with YES or NO".',
        input: 'Sender phone', process: 'API Call', output: 'Sent message', next: 'None' },

      { id: 'check-window', name: 'Check Poll Window', type: 'Code Node', category: 'logic', x: 1020, y: 420,
        what: 'Checks the current time against the meal cutoff.', why: 'Employees cannot book a meal after the cutoff time.',
        howUsed: 'Compares current time to cutoff time.',
        input: 'Current Timestamp', process: 'Compare with cutoff', output: 'isValid: true', next: 'IF Window Valid' },
      
      { id: 'if-window', name: 'IF Window Valid', type: 'IF Node', category: 'logic', x: 1220, y: 420,
        what: 'Branches based on time validity.', why: 'To block late responses.',
        howUsed: 'Checks isValid == true.',
        input: 'isValid: true', process: 'Evaluate condition', output: 'Branch (True)', next: 'Lookup Employee' },

      { id: 'resp-closed', name: 'Respond Polling Closed', type: 'WhatsApp API', category: 'whatsapp', x: 1420, y: 540,
        what: 'Notifies employee they are late.', why: 'To inform them the meal window is closed.',
        howUsed: 'Sends "Polling is closed for this meal".',
        input: 'Sender phone', process: 'API Call', output: 'Sent message', next: 'None' },
      
      { id: 'lookup-emp', name: 'Lookup Employee', type: 'Google Sheets', category: 'sheets', x: 1420, y: 300,
        what: 'Finds the employee matching the phone number.', why: 'To link the response to a specific person.',
        howUsed: 'Searches employee registry by phone number.',
        input: 'Phone number ("12345")', process: 'API Call -> Search Rows', output: 'Employee ID (EMP-001)', next: 'IF Employee Found' },
      
      { id: 'if-emp', name: 'IF Employee Found', type: 'IF Node', category: 'logic', x: 1620, y: 300,
        what: 'Ensures the sender is a registered employee.', why: 'To prevent unauthorized bookings.',
        howUsed: 'Checks if Employee ID exists.',
        input: 'Employee ID', process: 'Evaluate exists', output: 'Branch (True)', next: 'Check Duplicate' },

      { id: 'resp-no-emp', name: 'Respond No Employee', type: 'WhatsApp API', category: 'whatsapp', x: 1820, y: 420,
        what: 'Notifies sender they are not registered.', why: 'Security feedback.',
        howUsed: 'Sends "You are not registered".',
        input: 'Sender phone', process: 'API Call', output: 'Sent message', next: 'None' },

      { id: 'check-dup', name: 'Check Duplicate', type: 'Google Sheets', category: 'sheets', x: 1820, y: 180,
        what: 'Checks if they already booked today.', why: 'Prevents double counting and billing.',
        howUsed: 'Searches daily responses sheet for this Employee ID today.',
        input: 'Employee ID + Date', process: 'API Call -> Search Rows', output: '0 matches found', next: 'Evaluate Duplicate' },
      
      { id: 'eval-dup', name: 'Evaluate Duplicate', type: 'Code Node', category: 'logic', x: 2020, y: 180,
        what: 'Parses duplicate search results.', why: 'Determines if match count > 0.',
        howUsed: 'Returns isDuplicate boolean.',
        input: 'Match count (0)', process: 'Evaluate count == 0', output: 'isDuplicate: false', next: 'IF Not Duplicate' },

      { id: 'if-not-dup', name: 'IF Not Duplicate', type: 'IF Node', category: 'logic', x: 2220, y: 180,
        what: 'Branches based on duplicate check result.', why: 'Route to append data or send error message.',
        howUsed: 'If isDuplicate == false, proceed to append.',
        input: 'isDuplicate: false', process: 'Evaluate condition', output: 'Branch (True)', next: 'Append Polling Response' },

      { id: 'resp-dup', name: 'Respond Already Recorded', type: 'WhatsApp API', category: 'whatsapp', x: 2420, y: 300,
        what: 'Notifies employee of duplicate.', why: 'Prevents confusion.',
        howUsed: 'Sends "You have already responded today".',
        input: 'Sender phone', process: 'API Call', output: 'Sent message', next: 'None' },

      { id: 'append-resp', name: 'Append Polling Response', type: 'Google Sheets', category: 'sheets', x: 2420, y: 60,
        what: 'Saves the booking.', why: 'Creates the official record for canteen and billing.',
        howUsed: 'Appends a new row with Employee ID, YES, and Timestamp.',
        input: 'Employee ID, YES, Timestamp', process: 'API Call -> Append Row', output: 'Success', next: 'Respond Success' },
      
      { id: 'respond-success', name: 'Respond Success', type: 'WhatsApp API', category: 'whatsapp', x: 2620, y: 60,
        what: 'Sends a confirmation to the employee.', why: 'Provides peace of mind and the booking code.',
        howUsed: 'Sends "Booking confirmed!" WhatsApp message.',
        input: 'Phone number, Success Message', process: 'API Call -> POST Message', output: 'Delivery Status', next: 'Workflow Complete' },
    ],
    connections: [
      { id: 'c1', from: 'wh-reply', to: 'meta-verify', type: 'right' },
      
      { id: 'c2_true', from: 'meta-verify', to: 'resp-challenge', type: 'right' },
      { id: 'c2_false', from: 'meta-verify', to: 'parse-reply', type: 'right' },
      
      { id: 'c3', from: 'parse-reply', to: 'if-bot', type: 'right' },
      { id: 'c4', from: 'if-bot', to: 'if-yes', type: 'right' },
      
      { id: 'c5_false', from: 'if-yes', to: 'resp-not-yes', type: 'right' },
      { id: 'c5_true', from: 'if-yes', to: 'check-window', type: 'right' },
      
      { id: 'c6', from: 'check-window', to: 'if-window', type: 'right' },
      
      { id: 'c7_false', from: 'if-window', to: 'resp-closed', type: 'right' },
      { id: 'c7_true', from: 'if-window', to: 'lookup-emp', type: 'right' },

      { id: 'c8', from: 'lookup-emp', to: 'if-emp', type: 'right' },

      { id: 'c9_false', from: 'if-emp', to: 'resp-no-emp', type: 'right' },
      { id: 'c9_true', from: 'if-emp', to: 'check-dup', type: 'right' },

      { id: 'c10', from: 'check-dup', to: 'eval-dup', type: 'right' },
      { id: 'c11', from: 'eval-dup', to: 'if-not-dup', type: 'right' },

      { id: 'c12_false', from: 'if-not-dup', to: 'resp-dup', type: 'right' },
      { id: 'c12_true', from: 'if-not-dup', to: 'append-resp', type: 'right' },

      { id: 'c13', from: 'append-resp', to: 'respond-success', type: 'right' },
    ],
    sequence: [
      'wh-reply', 'meta-verify', 'parse-reply', 'if-bot', 'if-yes', 
      'check-window', 'if-window', 'lookup-emp', 'if-emp', 'check-dup', 
      'eval-dup', 'if-not-dup', 'append-resp', 'respond-success'
    ]
  },

  /* --- 3. API / REPORTING --- */
  api: {
    title: "API & Reporting Workflow",
    desc: "Provides REST API endpoints for the web frontend to query daily polling responses and monthly bill totals.",
    nodes: [
      /* Daily API */
      { id: 'api-daily', name: 'Website API Webhook', type: 'Webhook', category: 'webhook', x: 20, y: 60,
        what: 'Provides a REST GET endpoint.', why: 'The web dashboard needs to fetch today\'s stats.',
        howUsed: 'Listens for GET /api/daily-stats',
        input: 'HTTP GET Request', process: 'Receives request', output: 'Trigger Data', next: 'Read Polling Responses' },
      { id: 'read-responses', name: 'Read Polling Responses', type: 'Google Sheets', category: 'sheets', x: 250, y: 60,
        what: 'Fetches today\'s bookings.', why: 'To calculate total meals required.',
        howUsed: 'Reads all YES responses for the current date.',
        input: 'Current Date', process: 'API Call -> GET Rows', output: 'Array of today\'s bookings', next: 'Format Website Response' },
      { id: 'fmt-daily', name: 'Format Website Response', type: 'Code Node', category: 'logic', x: 480, y: 60,
        what: 'Formats data into clean JSON for the frontend.', why: 'Raw sheet data has extra metadata.',
        howUsed: 'Aggregates counts (e.g. 45 total meals).',
        input: 'Raw Sheet Rows', process: 'Aggregates data', output: '{ "totalMeals": 45 }', next: 'Respond Website Data' },
      { id: 'resp-daily', name: 'Respond Website Data', type: 'Webhook Response', category: 'webhook', x: 710, y: 60,
        what: 'Returns the HTTP response.', why: 'Completes the API request lifecycle.',
        howUsed: 'Sends 200 OK with the JSON payload.',
        input: 'JSON Data', process: 'Constructs HTTP Response', output: 'HTTP 200 OK', next: 'Workflow Complete' },

      /* Monthly API */
      { id: 'api-monthly', name: 'Monthly Bill API Webhook', type: 'Webhook', category: 'webhook', x: 20, y: 220,
        what: 'Provides a REST GET endpoint for billing.', why: 'Dashboard needs monthly financial totals.',
        howUsed: 'Listens for GET /api/monthly-bills',
        input: 'HTTP GET Request', process: 'Receives request', output: 'Trigger Data', next: 'Read Monthly Bill Data' },
      { id: 'read-bills', name: 'Read Monthly Bill Data', type: 'Google Sheets', category: 'sheets', x: 250, y: 220,
        what: 'Fetches calculated bills.', why: 'To display employee payroll deductions.',
        howUsed: 'Reads the monthly billing sheet.',
        input: 'Month/Year parameter', process: 'API Call -> GET Rows', output: 'Array of billing records', next: 'Format Monthly Bill Response' },
      { id: 'fmt-monthly', name: 'Format Monthly Bill Response', type: 'Code Node', category: 'logic', x: 480, y: 220,
        what: 'Formats billing data.', why: 'To match the frontend table structure.',
        howUsed: 'Transforms rows into a specific JSON schema.',
        input: 'Raw Sheet Rows', process: 'Maps fields', output: '[{ "employee": "Alice", "amount": 150.00 }]', next: 'Respond Monthly Bill Data' },
      { id: 'resp-monthly', name: 'Respond Monthly Bill Data', type: 'Webhook Response', category: 'webhook', x: 710, y: 220,
        what: 'Returns the HTTP response.', why: 'Completes the API request.',
        howUsed: 'Sends 200 OK with the billing JSON.',
        input: 'JSON Data', process: 'Constructs HTTP Response', output: 'HTTP 200 OK', next: 'Workflow Complete' }
    ],
    connections: [
      { id: 'c1', from: 'api-daily', to: 'read-responses', type: 'right' },
      { id: 'c2', from: 'read-responses', to: 'fmt-daily', type: 'right' },
      { id: 'c3', from: 'fmt-daily', to: 'resp-daily', type: 'right' },
      
      { id: 'c4', from: 'api-monthly', to: 'read-bills', type: 'right' },
      { id: 'c5', from: 'read-bills', to: 'fmt-monthly', type: 'right' },
      { id: 'c6', from: 'fmt-monthly', to: 'resp-monthly', type: 'right' }
    ],
    sequence: [
      'api-daily', 'read-responses', 'fmt-daily', 'resp-daily',
      'api-monthly', 'read-bills', 'fmt-monthly', 'resp-monthly'
    ]
  },

  /* --- 4. BILLING --- */
  billing: {
    title: "Monthly Billing Workflow",
    desc: "Calculates total employee meal deductions at the end of the month based on daily responses and food rates.",
    nodes: [
      { id: 'gen-bill', name: 'Generate Monthly Bill Webhook', type: 'Webhook', category: 'webhook', x: 20, y: 120,
        what: 'Triggers the billing calculation process.', why: 'Run at the end of the month by admin.',
        howUsed: 'Listens for POST /api/generate-bills',
        input: 'Admin POST request', process: 'Validates request', output: 'Trigger Event', next: 'Read Polling Responses For Month & Read Food Rates' },
      
      { id: 'read-resp-month', name: 'Read Polling Responses', type: 'Google Sheets', category: 'sheets', x: 250, y: 40,
        what: 'Fetches all YES responses for the entire month.', why: 'Need historical data to calculate costs.',
        howUsed: 'Reads responses sheet filtered by month.',
        input: 'Target Month (e.g. Oct 2026)', process: 'API Call -> GET Rows', output: 'Array of all bookings', next: 'Merge Responses And Rates' },
      { id: 'read-rates', name: 'Read Food Rates', type: 'Google Sheets', category: 'sheets', x: 250, y: 200,
        what: 'Fetches unit prices for meals.', why: 'Prices may vary by meal type (Breakfast vs Dinner).',
        howUsed: 'Reads configuration sheet.',
        input: 'None', process: 'API Call -> GET Rows', output: '{"Breakfast": 5.00, "Lunch": 8.50}', next: 'Merge Responses And Rates' },

      { id: 'merge', name: 'Merge Responses And Rates', type: 'Merge Node', category: 'logic', x: 480, y: 120,
        what: 'Waits for both data streams to complete.', why: 'Calculation requires both quantities and prices.',
        howUsed: 'Merges the two input branches into a single payload.',
        input: 'Responses (Branch 1) + Rates (Branch 2)', process: 'Combine JSON objects', output: 'Merged Data Object', next: 'Calculate Bill' },
      { id: 'calc-bill', name: 'Calculate Bill', type: 'Code Node', category: 'logic', x: 680, y: 120,
        what: 'Computes the total deduction per employee.', why: 'Core business logic of the billing system.',
        howUsed: 'Groups by Employee ID, multiplies count by rate.',
        input: 'Merged Data Object', process: 'Aggregation math', output: '[{"empId": "E01", "total": 125.50}]', next: 'Write Monthly Bill' },
      { id: 'write-bill', name: 'Write Monthly Bill', type: 'Google Sheets', category: 'sheets', x: 880, y: 120,
        what: 'Saves the final calculated bills.', why: 'Persists data for payroll processing.',
        howUsed: 'Writes the aggregated array to the Monthly Bills sheet.',
        input: 'Calculated Totals', process: 'API Call -> Append Rows', output: 'Success', next: 'Respond Website Data' },
      { id: 'resp-web', name: 'Respond Website Data', type: 'Webhook Response', category: 'webhook', x: 1080, y: 120,
        what: 'Notifies the admin that generation is complete.', why: 'To provide UI feedback.',
        howUsed: 'Sends 200 OK with success message.',
        input: 'Success status', process: 'Construct HTTP Response', output: 'HTTP 200 OK', next: 'Workflow Complete' },
    ],
    connections: [
      { id: 'c1', from: 'gen-bill', to: 'read-resp-month', type: 'diag-up' },
      { id: 'c2', from: 'gen-bill', to: 'read-rates', type: 'diag-down' },
      { id: 'c3', from: 'read-resp-month', to: 'merge', type: 'diag-down' },
      { id: 'c4', from: 'read-rates', to: 'merge', type: 'diag-up' },
      { id: 'c5', from: 'merge', to: 'calc-bill', type: 'right' },
      { id: 'c6', from: 'calc-bill', to: 'write-bill', type: 'right' },
      { id: 'c7', from: 'write-bill', to: 'resp-web', type: 'right' }
    ],
    sequence: ['gen-bill', 'read-resp-month', 'merge', 'calc-bill', 'write-bill', 'resp-web']
  }
};

let currentModuleId = 'polling';
let NODES_DATA = [];
let CONNECTIONS_DATA = [];
let EXEC_SEQUENCE = [];
let nodeMap = {};
let connMap = {};

function loadWorkflow(moduleId) {
  const mod = WORKFLOW_MODULES[moduleId];
  if (!mod) return;
  currentModuleId = moduleId;
  NODES_DATA = mod.nodes;
  CONNECTIONS_DATA = mod.connections;
  
  /* Build exec sequence (adding connection IDs between sequential nodes) */
  EXEC_SEQUENCE = [];
  for (let i = 0; i < mod.sequence.length; i++) {
    const nodeId = mod.sequence[i];
    let connId = null;
    if (i > 0) {
      const prevNodeId = mod.sequence[i-1];
      const conn = CONNECTIONS_DATA.find(c => c.from === prevNodeId && c.to === nodeId);
      if (conn) connId = conn.id;
    }
    EXEC_SEQUENCE.push({ nodeId, connId });
  }

  nodeMap = Object.fromEntries(NODES_DATA.map(n => [n.id, n]));
  connMap = Object.fromEntries(CONNECTIONS_DATA.map(c => [c.id, c]));

  document.getElementById('ws-title').textContent = mod.title;
  
  engine.reset();
  renderConnections();
  renderNodes();
  updateTimelineHighlight();
}

/* ══════════════════════════════════════════════════════════════
   SVG PATH BUILDER
══════════════════════════════════════════════════════════════ */
function buildPath(from, to, type) {
  const rp = n => ({ x: n.x + NODE_W, y: n.y + NODE_H / 2 });
  const lp = n => ({ x: n.x, y: n.y + NODE_H / 2 });
  const bp = n => ({ x: n.x + NODE_W / 2, y: n.y + NODE_H });
  const tp = n => ({ x: n.x + NODE_W / 2, y: n.y });

  if (type === 'right') {
    const s = rp(from), e = lp(to);
    const dx = (e.x - s.x) * 0.45;
    return `M ${s.x} ${s.y} C ${s.x + dx} ${s.y}, ${e.x - dx} ${e.y}, ${e.x} ${e.y}`;
  }
  if (type === 'left') {
    const s = rp(from), e = lp(to);
    const arc = 24;
    return `M ${s.x} ${s.y} C ${s.x} ${s.y + arc}, ${e.x} ${e.y + arc}, ${e.x} ${e.y}`;
  }
  if (type === 'vertical') {
    const s = bp(from), e = tp(to);
    const dy = (e.y - s.y) * 0.5;
    return `M ${s.x} ${s.y} C ${s.x} ${s.y + dy}, ${e.x} ${e.y - dy}, ${e.x} ${e.y}`;
  }
  if (type === 'diag-down' || type === 'diag-up') {
    const s = rp(from), e = lp(to);
    return `M ${s.x} ${s.y} C ${s.x + 44} ${s.y}, ${e.x - 44} ${e.y}, ${e.x} ${e.y}`;
  }
  const s = rp(from), e = lp(to);
  return `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
}

/* ══════════════════════════════════════════════════════════════
   PULSE ANIMATOR
══════════════════════════════════════════════════════════════ */
class PulseAnimator {
  constructor() {
    this._rafId = null;
    this._dot = null;
    this._glow = null;
  }
  animate(svg, pathEl, duration, onComplete) {
    this.cancel();
    const len = pathEl.getTotalLength();
    if (!len) { onComplete && onComplete(); return; }

    this._glow = document.createElementNS(SVG_NS, 'circle');
    this._glow.setAttribute('r', '9');
    this._glow.setAttribute('fill', 'rgba(79,142,247,0.2)');

    this._dot = document.createElementNS(SVG_NS, 'circle');
    this._dot.setAttribute('r', '4');
    this._dot.setAttribute('fill', '#4f8ef7');
    this._dot.style.filter = 'drop-shadow(0 0 5px rgba(79,142,247,1))';

    svg.appendChild(this._glow);
    svg.appendChild(this._dot);

    const t0 = performance.now();
    const frame = (now) => {
      const raw = Math.min((now - t0) / duration, 1);
      const t = this._ease(raw);
      const pt = pathEl.getPointAtLength(t * len);

      this._dot.setAttribute('cx', pt.x);
      this._dot.setAttribute('cy', pt.y);
      this._glow.setAttribute('cx', pt.x);
      this._glow.setAttribute('cy', pt.y);

      if (raw < 1) {
        this._rafId = requestAnimationFrame(frame);
      } else {
        this._cleanup();
        onComplete && onComplete();
      }
    };
    this._rafId = requestAnimationFrame(frame);
  }
  cancel() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this._cleanup();
  }
  _cleanup() {
    this._dot?.remove(); this._dot = null;
    this._glow?.remove(); this._glow = null;
  }
  _ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
}

/* ══════════════════════════════════════════════════════════════
   WORKFLOW ENGINE (Learning Mode)
══════════════════════════════════════════════════════════════ */
class WorkflowEngine {
  constructor(pulseAnimator) {
    this.pa = pulseAnimator;
    this.svg = null;
    this.step = -1;
    this.state = 'idle'; // idle | running | paused | completed
    this._timer = null;
  }

  start() {
    if (this.state === 'completed') this._hardReset();
    if (this.state !== 'idle' && this.state !== 'paused') return;
    this.state = 'running';
    if (this.step === -1) this._advance(0);
    else this._resumeSequence();
    updateAllUI();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    clearTimeout(this._timer);
    updateAllUI();
  }

  nextStep() {
    if (this.state === 'running') this.pause();
    if (this.state === 'completed') return;
    this.state = 'running'; // temp state for animation
    
    // Clear current timer and force immediate advance to next step
    clearTimeout(this._timer);
    if (this.step === -1) this._advance(0, true);
    else this._advance(this.step + 1, true);
  }

  exitLearningMode() {
    this.reset();
  }

  reset() {
    this.pa.cancel();
    clearTimeout(this._timer);
    this._hardReset();
    updateAllUI();
    closeInfoPanel();
  }

  replay() {
    this.reset();
    setTimeout(() => this.start(), 80);
  }

  selectNode(nodeId) {
    if (this.state === 'running') this.pause();
    showInfoPanel(nodeId);
    setSelectedNode(nodeId);
  }

  _hardReset() {
    this.state = 'idle';
    this.step = -1;
    resetAllNodeStates();
    resetAllConnStates();
  }

  _resumeSequence() {
    // Resume hold timer for current node
    this._timer = setTimeout(() => this._advance(this.step + 1), NODE_HOLD_MIN);
  }

  _advance(stepIdx, pauseAfter = false) {
    if (this.state !== 'running') return;

    if (stepIdx >= EXEC_SEQUENCE.length) {
      const last = EXEC_SEQUENCE[EXEC_SEQUENCE.length - 1];
      setNodeState(last.nodeId, 'completed');
      this.state = 'completed';
      setStatusDesc("✓ Workflow Completed");
      updateAllUI();
      return;
    }

    const curr = EXEC_SEQUENCE[stepIdx];
    const prev = stepIdx > 0 ? EXEC_SEQUENCE[stepIdx - 1] : null;
    this.step = stepIdx;

    if (prev) {
      setNodeState(prev.nodeId, 'completed');
      if (prev.connId) setConnState(prev.connId, 'completed');
    }

    activateNode(curr.nodeId);
    updateStepCounter(stepIdx);
    setStatusDesc(`Executing: ${nodeMap[curr.nodeId]?.name}`);
    showInfoPanel(curr.nodeId);

    // If there is a connection leading to this node, animate pulse first
    if (curr.connId) {
      setConnState(curr.connId, 'active');
      const pathEl = document.getElementById(`conn-${curr.connId}`);
      if (pathEl && this.svg) {
        this.pa.animate(this.svg, pathEl, ANIM_DURATION, () => {
          if (this.state === 'running') {
            if (pauseAfter) {
              this.state = 'paused';
              updateAllUI();
            } else {
              this._timer = setTimeout(() => this._advance(stepIdx + 1), NODE_HOLD_MIN);
            }
          }
        });
        return;
      }
    }

    // No incoming connection (start node)
    if (pauseAfter) {
      this.state = 'paused';
      updateAllUI();
    } else {
      this._timer = setTimeout(() => this._advance(stepIdx + 1), NODE_HOLD_MIN);
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   DOM RENDERING
══════════════════════════════════════════════════════════════ */
function renderNodes() {
  const container = document.getElementById('nodes-container');
  const canvasInner = document.getElementById('workflow-canvas');
  if (!container || !canvasInner) return;
  container.innerHTML = '';

  let maxX = 0;
  let maxY = 0;

  NODES_DATA.forEach(node => {
    if (node.x > maxX) maxX = node.x;
    if (node.y > maxY) maxY = node.y;

    const cat = CAT_STYLE[node.category] || CAT_STYLE.logic;
    const icon = ICONS[node.category] || ICONS.logic;

    const el = document.createElement('div');
    el.className = 'wf-node';
    el.id = `node-${node.id}`;
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    
    el.innerHTML = `
      <div class="wf-node-icon" style="background:${cat.bg}; color:${cat.color}">${icon}</div>
      <div class="wf-node-body">
        <div class="wf-node-name">${node.name}</div>
        <div class="wf-node-type">${node.type}</div>
      </div>
      <div class="wf-node-status-dot"></div>
    `;
    
    el.addEventListener('click', () => engine.selectNode(node.id));
    container.appendChild(el);
  });

  // Set canvas dimensions
  canvasInner.style.width = (maxX + NODE_W + PAD_R) + 'px';
  canvasInner.style.height = (maxY + NODE_H + PAD_B) + 'px';
}

function renderConnections() {
  const svg = document.getElementById('connections-svg');
  if (!svg) return;
  svg.innerHTML = '';

  CONNECTIONS_DATA.forEach(conn => {
    const from = nodeMap[conn.from];
    const to = nodeMap[conn.to];
    if (!from || !to) return;

    const d = buildPath(from, to, conn.type);
    
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('id', `conn-${conn.id}`);
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'rgba(255,255,255,0.07)');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.classList.add('conn-path');
    svg.appendChild(path);

    let dotX = (conn.type === 'vertical') ? to.x + NODE_W / 2 : to.x;
    let dotY = (conn.type === 'vertical') ? to.y : to.y + NODE_H / 2;

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', dotX);
    dot.setAttribute('cy', dotY);
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', 'rgba(255,255,255,0.1)');
    dot.classList.add('conn-dot', `conn-dot-${conn.id}`);
    svg.appendChild(dot);
  });
}

/* ══════════════════════════════════════════════════════════════
   NODE STATE MANAGEMENT
══════════════════════════════════════════════════════════════ */
function setNodeState(nodeId, state) {
  const el = document.getElementById(`node-${nodeId}`);
  if (!el) return;
  el.classList.remove('node-active', 'node-running', 'node-completed', 'node-selected');
  if (state) el.classList.add(`node-${state}`);
}

function activateNode(nodeId) {
  document.querySelectorAll('.wf-node.node-active, .wf-node.node-running').forEach(el => {
    el.classList.remove('node-active', 'node-running');
  });
  const el = document.getElementById(`node-${nodeId}`);
  if (el) {
    el.classList.add('node-active', 'node-running');
    scrollNodeIntoView(el);
  }
}

function setSelectedNode(nodeId) {
  document.querySelectorAll('.wf-node.node-selected').forEach(el => el.classList.remove('node-selected'));
  const el = document.getElementById(`node-${nodeId}`);
  if (el) {
    el.classList.add('node-selected');
    scrollNodeIntoView(el);
  }
}

function scrollNodeIntoView(el) {
  const wrapper = document.getElementById('canvas-scroll');
  if (!wrapper) return;
  const nodeLeft = el.offsetLeft;
  const wrapW = wrapper.clientWidth;
  const nodeW = el.offsetWidth;
  const target = Math.max(0, nodeLeft - wrapW / 2 + nodeW / 2);
  if (Math.abs(wrapper.scrollLeft - target) > 40) {
    wrapper.scrollTo({ left: target, behavior: 'smooth' });
  }
}

function resetAllNodeStates() { NODES_DATA.forEach(n => setNodeState(n.id, null)); }

function setConnState(connId, state) {
  const path = document.getElementById(`conn-${connId}`);
  const dot = document.querySelector(`.conn-dot-${connId}`);
  if (path) {
    path.classList.remove('conn-active', 'conn-completed', 'conn-active-branch');
    if (state) path.classList.add(`conn-${state}`);
  }
  if (dot) {
    dot.classList.remove('conn-active', 'conn-completed', 'conn-active-branch');
    if (state) dot.classList.add(`conn-${state}`);
  }
}

function resetAllConnStates() { CONNECTIONS_DATA.forEach(c => setConnState(c.id, null)); }

/* ══════════════════════════════════════════════════════════════
   INFO PANEL
══════════════════════════════════════════════════════════════ */
function showInfoPanel(nodeId) {
  const node = nodeMap[nodeId];
  const panel = document.getElementById('info-panel');
  if (!node || !panel) return;

  const cat = CAT_STYLE[node.category] || CAT_STYLE.logic;
  const typeEl = panel.querySelector('#panel-type');
  if (typeEl) { typeEl.textContent = node.type; typeEl.style.color = cat.color; }

  setText('panel-name', node.name);
  setText('panel-what', node.what);
  setText('panel-why', node.why);
  setText('panel-how', node.howUsed);
  setText('panel-process', node.process);
  setText('panel-input', node.input);
  setText('panel-output', node.output);
  setText('panel-next', node.next || 'None');

  panel.classList.add('open');
}

function closeInfoPanel() {
  const panel = document.getElementById('info-panel');
  if (panel) panel.classList.remove('open');
  document.querySelectorAll('.wf-node.node-selected').forEach(el => el.classList.remove('node-selected'));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '';
}

/* ══════════════════════════════════════════════════════════════
   TIMELINE & TABS
══════════════════════════════════════════════════════════════ */
const TIMELINE_MAPPING = {
  0: 'polling',  // Daily Poll
  1: 'response', // Yes/No Reply
  2: 'response', // Sheet Updates
  3: 'response', // Code Sent (Included in response here)
  4: 'billing'   // QR Scan & Bill
};

function initTimeline() {
  const container = document.getElementById('timeline-steps');
  if (!container) return;
  const steps = container.querySelectorAll('.tl-step');
  steps.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tl-step').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      const targetMod = TIMELINE_MAPPING[i] || 'polling';
      document.querySelector(`.ws-tab[data-workflow="${targetMod}"]`)?.click();
    });
  });
}

function updateTimelineHighlight() {
  // Simple highlight based on active tab
  const tabsToStep = { 'polling': 0, 'response': 1, 'api': 1, 'billing': 4 };
  const idx = tabsToStep[currentModuleId] || 0;
  const steps = document.querySelectorAll('.tl-step');
  steps.forEach((el, i) => el.classList.toggle('active', i === idx));
}

function initTabs() {
  const tabs = document.querySelectorAll('.ws-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadWorkflow(tab.dataset.workflow);
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   STATUS UI
══════════════════════════════════════════════════════════════ */
function updateStatusIndicator() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (!dot || !text) return;

  const cfg = {
    idle: { cls: 'status-idle', label: 'LEARNING MODE READY' },
    running: { cls: 'status-running', label: 'LEARNING MODE RUNNING' },
    paused: { cls: 'status-paused', label: 'LEARNING MODE PAUSED' },
    completed: { cls: 'status-completed', label: 'LEARNING MODE COMPLETED' },
  };

  const c = cfg[engine.state] || cfg.idle;
  dot.className = 'status-indicator ' + c.cls;
  text.textContent = c.label;
}

function updateStepCounter(stepIdx) {
  const el = document.getElementById('step-counter');
  if (el) {
    if (engine.state === 'idle') el.textContent = `Step 00 / ${EXEC_SEQUENCE.length}`;
    else el.textContent = `Step ${String(stepIdx + 1).padStart(2, '0')} / ${EXEC_SEQUENCE.length}`;
  }
}

function setStatusDesc(msg) {
  const el = document.getElementById('status-desc');
  if (el) el.textContent = msg;
}

function updateControlsUI() {
  const btnRun = document.getElementById('btn-run');
  const btnPause = document.getElementById('btn-pause');
  const btnResume = document.getElementById('btn-resume');
  const btnNext = document.getElementById('btn-next');
  const btnReplay = document.getElementById('btn-replay');
  const btnReset = document.getElementById('btn-reset');

  const isRunning = engine.state === 'running';
  const isPaused = engine.state === 'paused';
  const isCompleted = engine.state === 'completed';
  const isIdle = engine.state === 'idle';

  if (btnRun) btnRun.style.display = (isIdle) ? '' : 'none';
  if (btnPause) btnPause.style.display = isRunning ? '' : 'none';
  if (btnResume) btnResume.style.display = isPaused ? '' : 'none';
  if (btnNext) btnNext.style.display = (isPaused || isRunning) ? '' : 'none';
  
  if (btnReplay) btnReplay.style.display = (isCompleted || isPaused) ? '' : 'none';
  if (btnReset) btnReset.style.display = (!isIdle) ? '' : 'none';
}

function updateAllUI() {
  updateStatusIndicator();
  updateControlsUI();
  if (engine.state === 'idle') {
    setStatusDesc('Click "Run workflow" to start the learning mode simulation.');
    updateStepCounter(0);
  }
}

/* ══════════════════════════════════════════════════════════════
   CONTROLS INIT & BOOT
══════════════════════════════════════════════════════════════ */
function initControls() {
  document.getElementById('btn-run')?.addEventListener('click', () => engine.start());
  document.getElementById('btn-pause')?.addEventListener('click', () => engine.pause());
  document.getElementById('btn-resume')?.addEventListener('click', () => engine.start());
  document.getElementById('btn-next')?.addEventListener('click', () => engine.nextStep());
  document.getElementById('btn-reset')?.addEventListener('click', () => engine.exitLearningMode());
  document.getElementById('btn-replay')?.addEventListener('click', () => engine.replay());
  document.getElementById('panel-close')?.addEventListener('click', () => closeInfoPanel());
}

const pulseAnimator = new PulseAnimator();
const engine = new WorkflowEngine(pulseAnimator);

document.addEventListener('DOMContentLoaded', () => {
  const svgEl = document.getElementById('connections-svg');
  if (svgEl) engine.svg = svgEl;

  initTimeline();
  initTabs();
  initControls();
  
  // Load default module
  loadWorkflow('polling');

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeInfoPanel();
  });
});
