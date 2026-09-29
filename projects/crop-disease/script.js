/* ============================================================
   AI CROP DISEASE DETECTION — script.js
   ============================================================ */

'use strict';

/* ============================================================
   NODE DATA — mirrors the n8n workflow in the screenshot
   ============================================================ */
const NODES = [
  {
    id: 'webhook',
    name: 'Webhook',
    type: 'Webhook Trigger',
    category: 'trigger',
    x: 60, y: 200,
    what: 'Listens for incoming HTTP POST requests from the farmer\'s website. Activated the moment the farmer submits the leaf photo.',
    why: 'n8n needs an entry point to receive data from the outside world. The Webhook node is the door that lets the farmer\'s photo enter the automation.',
    howUsed: 'Configured as a POST endpoint. The website sends a JSON payload containing the base64-encoded leaf image and the farmer\'s crop name (optional).',
    process: 'Farmer selects a leaf photo on the website → JS encodes it to base64 → HTTP POST sent to this webhook URL → n8n workflow starts.',
    input: 'HTTP POST from browser: { image_base64: "...", crop_hint: "tomato" }',
    output: 'Workflow data object with image_base64 field available to next nodes.',
    next: 'Prepare Image'
  },
  {
    id: 'prepare',
    name: 'Prepare Image',
    type: 'Code Node',
    category: 'code',
    x: 240, y: 200,
    what: 'Extracts and formats the base64 image data into the exact structure that Gemini Vision API expects.',
    why: 'Gemini API requires a specific JSON format with inlineData and mimeType fields. Raw base64 from the browser needs to be restructured before sending.',
    howUsed: 'JavaScript code node that reads the incoming base64 string, strips any data URL prefix (data:image/jpeg;base64,) and wraps it in the Gemini-compatible format.',
    process: 'Reads image_base64 → strips prefix if present → builds { inlineData: { mimeType, data } } → passes to next node.',
    input: 'Raw base64 image string from Webhook node.',
    output: 'Formatted image object ready for Gemini Vision API call.',
    next: 'Gemini Analyze Image'
  },
  {
    id: 'gemini-vision',
    name: 'Gemini Analyze Image',
    type: 'HTTP Request',
    category: 'api',
    x: 440, y: 200,
    what: 'Sends the leaf photo to Google Gemini Vision API with a structured prompt asking it to identify the crop, disease and severity in JSON format.',
    why: 'Gemini\'s multimodal model can look at an image and describe what it sees in structured output. No custom ML model or training data needed.',
    howUsed: 'HTTP POST to https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent with the image and a JSON-schema prompt.',
    process: 'Sends image + prompt: "Analyze this leaf. Return JSON: { is_plant, crop, disease, severity, confidence }. If not a plant, set is_plant: false."',
    input: 'Formatted image object + Gemini API key.',
    output: 'Gemini raw response with candidates[0].content containing JSON string.',
    next: 'Parse Gemini'
  },
  {
    id: 'parse',
    name: 'Parse Gemini',
    type: 'Code Node',
    category: 'code',
    x: 640, y: 200,
    what: 'Extracts and parses the JSON from Gemini\'s text response into structured fields the workflow can use.',
    why: 'Gemini returns its answer wrapped inside a text block. This node isolates the JSON object so the IF node can read is_plant, crop, disease etc. as actual fields.',
    howUsed: 'Code node that reads the raw text from Gemini, finds the JSON block using regex, parses it with JSON.parse() and maps the fields into the workflow context.',
    process: 'Extract text → find JSON with regex → parse → expose: { is_plant, crop, disease, severity, confidence } as workflow fields.',
    input: 'Raw Gemini API response text.',
    output: '{ is_plant: true/false, crop: "Tomato", disease: "Early Blight", severity: "medium", confidence: 0.92 }',
    next: 'Is Plant?'
  },
  {
    id: 'is-plant',
    name: 'Is Plant?',
    type: 'IF Node',
    category: 'logic',
    x: 840, y: 200,
    what: 'Checks whether the uploaded image is actually a plant leaf. If someone uploads a random photo (a face, a car), the workflow rejects it gracefully.',
    why: 'Without this check the AI Agent would try to generate crop treatment for a non-plant image and produce garbage output. Validation must happen before expensive operations.',
    howUsed: 'IF node with condition: {{ $json.is_plant }} === true. True branch continues to AI Agent. False branch goes to the error responder.',
    process: 'Reads is_plant field → True: forward to AI Agent → False: forward to Respond Not Plant.',
    input: 'Parsed Gemini JSON with is_plant field.',
    output: 'True branch or False branch route.',
    next: 'AI Agent (True) / Respond Not Plant (False)'
  },
  {
    id: 'ai-agent',
    name: 'AI Agent',
    type: 'AI Agent Node',
    category: 'ai',
    x: 1060, y: 100,
    what: 'The intelligent solution generator. Takes the detected crop and disease, then writes complete Tamil-language treatment guidance including organic remedies, chemical options, prevention tips and a video script.',
    why: 'A simple LLM call gives one answer. An AI Agent can reason, use tools and produce structured multi-part responses. This gives farmers a complete, reliable action plan — not just a name.',
    howUsed: 'n8n AI Agent node connected to Gemini Chat Model. System prompt instructs it to act as an experienced agri officer, always respond in Tamil, and structure the output as: Cause → Treatment steps → Organic remedy → Chemical option → Prevention → Video script.',
    process: 'Receives crop + disease + severity → builds Tamil prompt → Gemini Chat generates solution → Agent formats and returns structured text.',
    input: '{ crop: "Tomato", disease: "Early Blight", severity: "medium" }',
    output: 'Full Tamil treatment plan + short video script as text.',
    next: 'Build Response'
  },
  {
    id: 'build-response',
    name: 'Build Response',
    type: 'Code Node',
    category: 'code',
    x: 1260, y: 100,
    what: 'Structures the final JSON response that the website will receive. Combines the AI Agent\'s Tamil text, the disease info and the video script into one clean payload.',
    why: 'The website needs a predictable JSON structure to render properly. This node acts as the "packaging" step before sending the response back to the farmer\'s browser.',
    howUsed: 'Code node that reads AI Agent output, disease metadata and assembles: { success: true, crop, disease, severity, solution_tamil, video_script, timestamp }.',
    process: 'Read AI Agent output + parsed Gemini fields → assemble response JSON → pass to Respond Success.',
    input: 'AI Agent Tamil text + disease metadata.',
    output: '{ success: true, crop, disease, severity, solution_tamil, video_script, timestamp }',
    next: 'Respond Success'
  },
  {
    id: 'respond-success',
    name: 'Respond Success',
    type: 'Respond to Webhook',
    category: 'output',
    x: 1460, y: 100,
    what: 'Sends the final JSON response back to the farmer\'s browser, closing the webhook HTTP request with a 200 OK and the solution payload.',
    why: 'The website is waiting for a response. This node completes the HTTP request-response cycle so the farmer sees the result immediately on the page.',
    howUsed: 'n8n Respond to Webhook node with HTTP 200 and the built response JSON as body.',
    process: 'Receives built JSON → sends HTTP 200 response to browser → farmer sees Tamil solution on website.',
    input: 'Final response JSON.',
    output: 'HTTP 200 response to browser with Tamil solution + video script.',
    next: 'None — workflow ends here'
  },
  {
    id: 'respond-not-plant',
    name: 'Respond Not Plant',
    type: 'Respond to Webhook',
    category: 'error',
    x: 1060, y: 340,
    what: 'Sends a friendly error message back to the farmer when the uploaded image is not recognized as a plant leaf.',
    why: 'Without this, the farmer would get a blank or confusing response. A clear error message tells them exactly what to fix — upload a proper leaf photo.',
    howUsed: 'n8n Respond to Webhook node with HTTP 200 and { success: false, message: "சரியான இலை photo அனுப்புங்கள்" (Please send a proper leaf photo) }.',
    process: 'Triggered when Is Plant? is false → returns Tamil error message → website shows the error to farmer.',
    input: 'is_plant: false from IF node.',
    output: '{ success: false, message: "சரியான இலை photo அனுப்புங்கள்" }',
    next: 'None — workflow ends here'
  }
];

/* ============================================================
   EXECUTION SEQUENCE (learning mode step order)
   ============================================================ */
const EXEC_SEQUENCE = [
  { nodeId: 'webhook',           connTo: 'prepare',           label: 'Farmer submits leaf photo' },
  { nodeId: 'prepare',           connTo: 'gemini-vision',     label: 'Image formatted for Gemini' },
  { nodeId: 'gemini-vision',     connTo: 'parse',             label: 'Gemini Vision analyzes photo' },
  { nodeId: 'parse',             connTo: 'is-plant',          label: 'JSON extracted from response' },
  { nodeId: 'is-plant',          connTo: 'ai-agent',          label: 'Confirmed: it IS a plant' },
  { nodeId: 'ai-agent',          connTo: 'build-response',    label: 'Tamil solution generated' },
  { nodeId: 'build-response',    connTo: 'respond-success',   label: 'Response packaged' },
  { nodeId: 'respond-success',   connTo: null,                label: 'Farmer receives Tamil solution!' }
];

/* Connections to draw (all edges including false branch) */
const CONNECTIONS = [
  { from: 'webhook',         to: 'prepare' },
  { from: 'prepare',         to: 'gemini-vision' },
  { from: 'gemini-vision',   to: 'parse' },
  { from: 'parse',           to: 'is-plant' },
  { from: 'is-plant',        to: 'ai-agent',          label: 'true' },
  { from: 'is-plant',        to: 'respond-not-plant', label: 'false' },
  { from: 'ai-agent',        to: 'build-response' },
  { from: 'build-response',  to: 'respond-success' }
];

/* ============================================================
   NODE CATEGORY STYLES
   ============================================================ */
const CAT_STYLE = {
  trigger: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: '&#9889;' },
  code:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '&#123;&#125;' },
  api:     { color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)',  icon: '&#127760;' },
  logic:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '&#10006;' },
  ai:      { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  icon: '&#129302;' },
  output:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  icon: '&#10003;' },
  error:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '&#9888;' }
};

/* ============================================================
   BUILD NODE MAP
   ============================================================ */
const nodeMap = {};
NODES.forEach(n => { nodeMap[n.id] = n; });

/* ============================================================
   CANVAS RENDERING
   ============================================================ */
const CANVAS_W = 1700;
const CANVAS_H = 520;
const NODE_W   = 140;
const NODE_H   = 54;

function renderCanvas() {
  const canvas = document.getElementById('workflow-canvas');
  const svg    = document.getElementById('connections-svg');
  const cont   = document.getElementById('nodes-container');
  if (!canvas || !svg || !cont) return;

  canvas.style.width  = CANVAS_W + 'px';
  canvas.style.height = CANVAS_H + 'px';
  svg.setAttribute('width',  CANVAS_W);
  svg.setAttribute('height', CANVAS_H);
  svg.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);

  // Draw connections
  CONNECTIONS.forEach(conn => {
    const from = nodeMap[conn.from];
    const to   = nodeMap[conn.to];
    if (!from || !to) return;

    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
    path.setAttribute('class', 'wf-edge');
    path.setAttribute('data-from', conn.from);
    path.setAttribute('data-to', conn.to);
    if (conn.label) {
      path.setAttribute('data-label', conn.label);
    }
    svg.appendChild(path);

    // Label
    if (conn.label) {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', mx);
      txt.setAttribute('y', (y1 + y2) / 2 - 4);
      txt.setAttribute('class', 'edge-label');
      txt.textContent = conn.label;
      svg.appendChild(txt);
    }
  });

  // Draw nodes
  NODES.forEach(node => {
    const cat = CAT_STYLE[node.category] || CAT_STYLE.code;
    const div = document.createElement('div');
    div.className = 'wf-node';
    div.id = 'node-' + node.id;
    div.setAttribute('data-id', node.id);
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', node.name);
    div.style.left    = node.x + 'px';
    div.style.top     = node.y + 'px';
    div.style.width   = NODE_W + 'px';
    div.style.borderColor = cat.color + '55';

    div.innerHTML = `
      <div class="wf-node-icon" style="background:${cat.bg}; color:${cat.color}">${cat.icon}</div>
      <div class="wf-node-body">
        <div class="wf-node-type" style="color:${cat.color}">${node.type}</div>
        <div class="wf-node-name">${node.name}</div>
      </div>
      <div class="wf-node-status" id="status-${node.id}"></div>
    `;

    div.addEventListener('click', () => {
      if (engine.state === 'running') engine.pause();
      showInfoPanel(node.id);
    });
    div.addEventListener('keydown', e => { 
      if (e.key === 'Enter' || e.key === ' ') {
        if (engine.state === 'running') engine.pause();
        showInfoPanel(node.id);
      }
    });
    cont.appendChild(div);
  });
}

/* ============================================================
   PULSE ANIMATOR
   ============================================================ */
class PulseAnimator {
  constructor() { this.animations = []; }

  pulse(fromId, toId, onDone) {
    const path = document.querySelector(`path[data-from="${fromId}"][data-to="${toId}"]`);
    if (!path) { if (onDone) onDone(); return; }

    const svg   = document.getElementById('connections-svg');
    const dot   = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '5');
    dot.setAttribute('class', 'pulse-dot');
    svg.appendChild(dot);

    const len      = path.getTotalLength();
    const duration = 900;
    const start    = performance.now();

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const pt = path.getPointAtLength(t * len);
      dot.setAttribute('cx', pt.x);
      dot.setAttribute('cy', pt.y);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        dot.remove();
        if (onDone) onDone();
      }
    };
    requestAnimationFrame(animate);
  }

  highlightEdge(fromId, toId) {
    document.querySelectorAll('.wf-edge.edge-active').forEach(e => e.classList.remove('edge-active'));
    const path = document.querySelector(`path[data-from="${fromId}"][data-to="${toId}"]`);
    if (path) path.classList.add('edge-active');
  }

  setNodeState(nodeId, state) {
    const el = document.getElementById('node-' + nodeId);
    if (!el) return;
    el.classList.remove('node-running', 'node-done', 'node-selected');
    if (state) el.classList.add('node-' + state);
    const dot = document.getElementById('status-' + nodeId);
    if (dot) {
      dot.className = 'wf-node-status';
      if (state === 'running') { dot.classList.add('status-running-dot'); dot.textContent = ''; }
      else if (state === 'done') { dot.classList.add('status-done-dot'); dot.textContent = '✓'; }
      else { dot.textContent = ''; }
    }
  }

  resetAll() {
    NODES.forEach(n => this.setNodeState(n.id, null));
    document.querySelectorAll('.wf-edge.edge-active').forEach(e => e.classList.remove('edge-active'));
    document.querySelectorAll('.pulse-dot').forEach(d => d.remove());
  }
}

/* ============================================================
   WORKFLOW ENGINE
   ============================================================ */
class WorkflowEngine {
  constructor(animator) {
    this.animator  = animator;
    this.state     = 'idle'; // idle | running | paused | completed
    this.stepIdx   = 0;
    this.timer     = null;
    this.svg       = null;
  }

  start() {
    if (this.state === 'idle') { this.stepIdx = 0; this.animator.resetAll(); }
    this.state = 'running';
    updateAllUI();
    this._runStep();
  }

  pause() { this.state = 'paused'; clearTimeout(this.timer); updateAllUI(); }

  nextStep() {
    if (this.state === 'paused' || this.state === 'running') {
      clearTimeout(this.timer);
      this._executeStep(this.stepIdx);
    }
  }

  replay() { this.state = 'idle'; this.stepIdx = 0; this.animator.resetAll(); this.start(); }

  exitLearningMode() {
    clearTimeout(this.timer);
    this.state = 'idle';
    this.stepIdx = 0;
    this.animator.resetAll();
    updateAllUI();
    setStatusDesc('Click "Run workflow" to start the learning mode simulation.');
    updateStepCounter(0);
  }

  _runStep() {
    if (this.state !== 'running') return;
    this._executeStep(this.stepIdx);
  }

  _executeStep(idx) {
    if (idx >= EXEC_SEQUENCE.length) {
      this.state = 'completed';
      updateAllUI();
      setStatusDesc('✅ Workflow complete! Farmer received Tamil disease solution.');
      return;
    }

    const step = EXEC_SEQUENCE[idx];
    this.animator.setNodeState(step.nodeId, 'running');
    updateStepCounter(idx);
    setStatusDesc(step.label);
    updateStatusIndicator();
    showInfoPanel(step.nodeId);

    this.timer = setTimeout(() => {
      this.animator.setNodeState(step.nodeId, 'done');

      if (step.connTo) {
        this.animator.highlightEdge(step.nodeId, step.connTo);
        this.animator.pulse(step.nodeId, step.connTo, () => {
          this.stepIdx = idx + 1;
          if (this.state === 'running') {
            this.timer = setTimeout(() => this._runStep(), 300);
          }
        });
      } else {
        this.stepIdx = idx + 1;
        if (this.state === 'running') this._runStep();
      }
    }, 1100);
  }
}

/* ============================================================
   INFO PANEL
   ============================================================ */
function showInfoPanel(nodeId) {
  const node  = nodeMap[nodeId];
  const panel = document.getElementById('info-panel');
  if (!node || !panel) return;

  const cat    = CAT_STYLE[node.category] || CAT_STYLE.code;
  const typeEl = panel.querySelector('#panel-type');
  if (typeEl) { typeEl.textContent = node.type; typeEl.style.color = cat.color; }

  setText('panel-name',    node.name);
  setText('panel-what',    node.what);
  setText('panel-why',     node.why);
  setText('panel-how',     node.howUsed);
  setText('panel-process', node.process);
  setText('panel-input',   node.input);
  setText('panel-output',  node.output);
  setText('panel-next',    node.next || 'None');

  panel.classList.add('open');

  // Highlight selected node
  document.querySelectorAll('.wf-node.node-selected').forEach(el => el.classList.remove('node-selected'));
  const nodeEl = document.getElementById('node-' + nodeId);
  if (nodeEl) nodeEl.classList.add('node-selected');
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

/* ============================================================
   STATUS UI
   ============================================================ */
function updateStatusIndicator() {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (!dot || !text) return;
  const cfg = {
    idle:      { cls: 'status-idle',      label: 'LEARNING MODE READY' },
    running:   { cls: 'status-running',   label: 'LEARNING MODE RUNNING' },
    paused:    { cls: 'status-paused',    label: 'LEARNING MODE PAUSED' },
    completed: { cls: 'status-completed', label: 'LEARNING MODE COMPLETED' }
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
  const btnRun     = document.getElementById('btn-run');
  const btnPause   = document.getElementById('btn-pause');
  const btnResume  = document.getElementById('btn-resume');
  const btnNext    = document.getElementById('btn-next');
  const btnReplay  = document.getElementById('btn-replay');
  const btnReset   = document.getElementById('btn-reset');

  const isIdle      = engine.state === 'idle';
  const isRunning   = engine.state === 'running';
  const isPaused    = engine.state === 'paused';
  const isCompleted = engine.state === 'completed';

  if (btnRun)    btnRun.style.display    = isIdle ? '' : 'none';
  if (btnPause)  btnPause.style.display  = isRunning ? '' : 'none';
  if (btnResume) btnResume.style.display = isPaused ? '' : 'none';
  if (btnNext)   btnNext.style.display   = (isPaused || isRunning) ? '' : 'none';
  if (btnReplay) btnReplay.style.display = (isCompleted || isPaused) ? '' : 'none';
  if (btnReset)  btnReset.style.display  = !isIdle ? '' : 'none';
}

function updateAllUI() {
  updateStatusIndicator();
  updateControlsUI();
  if (engine.state === 'idle') {
    setStatusDesc('Click "Run workflow" to start the learning mode simulation.');
    updateStepCounter(0);
  }
}


/* ============================================================
   TABS
   ============================================================ */
function initTabs() {
  const tabs = document.querySelectorAll('.ws-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      // Reset engine when switching tabs
      if (engine.state !== 'idle') engine.exitLearningMode();
    });
  });
}
/* ============================================================
   CONTROLS INIT & BOOT
   ============================================================ */
function initControls() {
  document.getElementById('btn-run')?.addEventListener('click',    () => engine.start());
  document.getElementById('btn-pause')?.addEventListener('click',  () => engine.pause());
  document.getElementById('btn-resume')?.addEventListener('click', () => engine.start());
  document.getElementById('btn-next')?.addEventListener('click',   () => engine.nextStep());
  document.getElementById('btn-reset')?.addEventListener('click',  () => engine.exitLearningMode());
  document.getElementById('btn-replay')?.addEventListener('click', () => engine.replay());
  document.getElementById('panel-close')?.addEventListener('click',() => closeInfoPanel());
}

const pulseAnimator = new PulseAnimator();
const engine        = new WorkflowEngine(pulseAnimator);

document.addEventListener('DOMContentLoaded', () => {
  renderCanvas();
  initTabs();
  initControls();
  updateAllUI();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfoPanel(); });
});
