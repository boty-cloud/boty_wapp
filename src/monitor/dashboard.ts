export function loginPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Boty Monitor - Login</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; display: flex; align-items: center; justify-content: center; height: 100vh; }
  .login-box { background: #1a1a2e; padding: 2.5rem; border-radius: 12px; width: 340px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .login-box h1 { font-size: 1.4rem; margin-bottom: 1.5rem; color: #25d366; text-align: center; }
  .login-box input { width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 8px; background: #16213e; color: #e0e0e0; font-size: 0.95rem; margin-bottom: 1rem; outline: none; }
  .login-box input:focus { border-color: #25d366; }
  .login-box button { width: 100%; padding: 0.75rem; border: none; border-radius: 8px; background: #25d366; color: #000; font-weight: 600; font-size: 1rem; cursor: pointer; }
  .login-box button:hover { background: #1da851; }
  .error { color: #ff6b6b; font-size: 0.85rem; margin-bottom: 0.5rem; text-align: center; display: none; }
</style>
</head>
<body>
<form class="login-box" method="POST" action="/monitor/login">
  <h1>Boty Monitor</h1>
  <p id="err" class="error">Contrasena incorrecta</p>
  <input type="password" name="password" placeholder="Contrasena" autofocus required>
  <button type="submit">Ingresar</button>
</form>
<script>
  if (location.search.includes('error=1')) document.getElementById('err').style.display = 'block';
</script>
</body>
</html>`;
}

export function dashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Boty Monitor</title>
<style>
  :root {
    --bg: #0a0a0a;
    --panel: #1a1a2e;
    --border: #2a2a3e;
    --text: #e0e0e0;
    --text-dim: #888;
    --green: #25d366;
    --green-dark: #1da851;
    --blue: #4a9eff;
    --msg-in: #1a2a1a;
    --msg-out-bot: #1a1a2e;
    --msg-out-human: #1a2a3e;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); height: 100vh; overflow: hidden; }

  .app { display: flex; height: 100vh; }

  /* Sidebar */
  .sidebar { width: 360px; min-width: 360px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--panel); }
  .sidebar-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .sidebar-header h1 { font-size: 1.1rem; color: var(--green); }
  .sidebar-header .status { font-size: 0.75rem; color: var(--text-dim); }
  .search-box { padding: 0.5rem 1rem; border-bottom: 1px solid var(--border); }
  .search-box input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-size: 0.85rem; outline: none; }
  .search-box input:focus { border-color: var(--green); }
  .conv-list { flex: 1; overflow-y: auto; }
  .conv-item { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; gap: 0.75rem; align-items: center; transition: background 0.15s; }
  .conv-item:hover { background: rgba(37, 211, 102, 0.05); }
  .conv-item.active { background: rgba(37, 211, 102, 0.1); }
  .conv-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; color: var(--green); flex-shrink: 0; }
  .conv-info { flex: 1; min-width: 0; }
  .conv-name { font-weight: 600; font-size: 0.9rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-preview { font-size: 0.8rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-meta { text-align: right; flex-shrink: 0; }
  .conv-time { font-size: 0.7rem; color: var(--text-dim); }
  .conv-unread { background: var(--green); color: #000; font-size: 0.7rem; font-weight: 700; border-radius: 10px; padding: 1px 6px; margin-top: 4px; display: inline-block; }

  /* Chat area */
  .chat { flex: 1; display: flex; flex-direction: column; background: var(--bg); }
  .chat-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); background: var(--panel); display: flex; align-items: center; gap: 0.75rem; }
  .chat-header .name { font-weight: 600; font-size: 1rem; }
  .chat-header .bsuid { font-size: 0.8rem; color: var(--text-dim); margin-left: 0.5rem; }
  .chat-header .header-actions { margin-left: auto; }
  .btn-delete { padding: 0.4rem 0.85rem; border: 1px solid #ff4444; border-radius: 8px; background: transparent; color: #ff4444; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
  .btn-delete:hover { background: #ff4444; color: #fff; }
  .chat-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-dim); font-size: 1rem; }
  .messages { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .msg { max-width: 65%; padding: 0.6rem 0.85rem; border-radius: 12px; font-size: 0.9rem; line-height: 1.4; position: relative; word-wrap: break-word; }
  .msg.in { align-self: flex-start; background: var(--msg-in); border-bottom-left-radius: 4px; }
  .msg.out-bot { align-self: flex-end; background: var(--msg-out-bot); border: 1px solid var(--border); border-bottom-right-radius: 4px; }
  .msg.out-human { align-self: flex-end; background: var(--msg-out-human); border: 1px solid var(--blue); border-bottom-right-radius: 4px; }
  .msg .msg-sender { font-size: 0.7rem; font-weight: 600; margin-bottom: 2px; }
  .msg.in .msg-sender { color: var(--green); }
  .msg.out-bot .msg-sender { color: var(--text-dim); }
  .msg.out-human .msg-sender { color: var(--blue); }
  .msg .msg-time { font-size: 0.65rem; color: var(--text-dim); margin-top: 4px; text-align: right; }
  .msg .msg-body { white-space: pre-wrap; }
  .msg .msg-media img { max-width: 280px; max-height: 280px; border-radius: 8px; margin: 4px 0; cursor: pointer; }
  .msg .msg-media video { max-width: 320px; border-radius: 8px; margin: 4px 0; }
  .msg .msg-media audio { margin: 4px 0; width: 100%; max-width: 280px; }
  .msg .msg-media a { color: var(--blue); text-decoration: none; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px; }
  .msg .msg-media a:hover { text-decoration: underline; }
  .msg .msg-delete { position: absolute; top: 4px; right: 6px; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 0.7rem; opacity: 0; transition: opacity 0.15s; padding: 2px 4px; border-radius: 4px; }
  .msg:hover .msg-delete { opacity: 1; }
  .msg .msg-delete:hover { color: #ff4444; background: rgba(255,68,68,0.1); }

  /* Compose */
  .compose { padding: 0.75rem 1.25rem; border-top: 1px solid var(--border); background: var(--panel); display: flex; gap: 0.5rem; align-items: flex-end; }
  .compose textarea { flex: 1; padding: 0.6rem 0.85rem; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); color: var(--text); font-size: 0.9rem; font-family: inherit; resize: none; outline: none; max-height: 120px; min-height: 42px; line-height: 1.4; }
  .compose textarea:focus { border-color: var(--green); }
  .compose button { padding: 0.6rem 1.25rem; border: none; border-radius: 12px; background: var(--green); color: #000; font-weight: 600; font-size: 0.9rem; cursor: pointer; white-space: nowrap; height: 42px; }
  .compose button:hover { background: var(--green-dark); }
  .compose button:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-attach { padding: 0.6rem; border: none; border-radius: 12px; background: var(--border); color: var(--text); font-size: 1.1rem; cursor: pointer; height: 42px; width: 42px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; flex-shrink: 0; }
  .btn-attach:hover { background: var(--green); color: #000; }
  .file-preview { padding: 0.5rem 1.25rem; border-top: 1px solid var(--border); background: var(--panel); display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-dim); }
  .file-preview .file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-preview .file-remove { background: none; border: none; color: #ff4444; cursor: pointer; font-size: 1rem; padding: 0 4px; }
  .file-preview .file-caption { padding: 0.35rem 0.6rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); font-size: 0.82rem; outline: none; width: 200px; }
  .file-preview .file-caption:focus { border-color: var(--green); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* Empty state */
  .no-conv { padding: 2rem; text-align: center; color: var(--text-dim); }
</style>
</head>
<body>
<div class="app">
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>Boty Monitor</h1>
      <span class="status" id="conn-status">Conectando...</span>
    </div>
    <div class="search-box">
      <input type="text" id="search" placeholder="Buscar conversacion...">
    </div>
    <div class="conv-list" id="conv-list">
      <div class="no-conv">Cargando conversaciones...</div>
    </div>
  </div>

  <div class="chat">
    <div id="chat-header" class="chat-header" style="display:none;">
      <div class="conv-avatar" id="chat-avatar"></div>
      <div>
        <span class="name" id="chat-name"></span>
        <span class="bsuid" id="chat-bsuid"></span>
      </div>
      <div class="header-actions">
        <button class="btn-delete" onclick="deleteConv()">Eliminar</button>
      </div>
    </div>
    <div class="chat-empty" id="chat-empty">Selecciona una conversacion para ver los mensajes</div>
    <div class="messages" id="messages" style="display:none;"></div>
    <div class="file-preview" id="file-preview" style="display:none;">
      <span class="file-name" id="file-name"></span>
      <input class="file-caption" id="file-caption" type="text" placeholder="Caption (opcional)">
      <button class="file-remove" onclick="clearFile()">&times;</button>
    </div>
    <div class="compose" id="compose" style="display:none;">
      <input type="file" id="file-input" style="display:none;" onchange="onFileSelected()">
      <button class="btn-attach" onclick="document.getElementById('file-input').click()" title="Adjuntar archivo">&#128206;</button>
      <textarea id="reply-input" placeholder="Escribe un mensaje..." rows="1"></textarea>
      <button id="send-btn" onclick="sendMessage()">Enviar</button>
    </div>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
let conversations = [];
let selectedBsuid = null;

const convListEl = document.getElementById('conv-list');
const messagesEl = document.getElementById('messages');
const chatEmpty = document.getElementById('chat-empty');
const chatHeader = document.getElementById('chat-header');
const composeEl = document.getElementById('compose');
const searchInput = document.getElementById('search');
const replyInput = document.getElementById('reply-input');
const sendBtn = document.getElementById('send-btn');
const connStatus = document.getElementById('conn-status');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const fileNameEl = document.getElementById('file-name');
const fileCaptionEl = document.getElementById('file-caption');
let pendingFile = null;

socket.on('connect', () => { connStatus.textContent = 'En vivo'; connStatus.style.color = '#25d366'; });
socket.on('disconnect', () => { connStatus.textContent = 'Desconectado'; connStatus.style.color = '#ff6b6b'; });

replyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

replyInput.addEventListener('input', () => {
  replyInput.style.height = 'auto';
  replyInput.style.height = Math.min(replyInput.scrollHeight, 120) + 'px';
});

searchInput.addEventListener('input', () => renderConversations());

async function loadConversations() {
  const res = await fetch('/api/conversations');
  conversations = await res.json();
  renderConversations();
}

function renderConversations() {
  const query = searchInput.value.toLowerCase();
  const filtered = conversations.filter(c =>
    c.contactName.toLowerCase().includes(query) || c.bsuid.includes(query)
  );

  if (!filtered.length) {
    convListEl.innerHTML = '<div class="no-conv">No hay conversaciones</div>';
    return;
  }

  convListEl.innerHTML = filtered.map(c => {
    const initials = c.contactName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const time = c.lastMessageAt ? formatTime(c.lastMessageAt) : '';
    const active = c.bsuid === selectedBsuid ? ' active' : '';
    const unread = c.unread > 0 ? '<span class="conv-unread">' + c.unread + '</span>' : '';
    return '<div class="conv-item' + active + '" onclick="selectConv(\\'' + c.bsuid + '\\')">'
      + '<div class="conv-avatar">' + initials + '</div>'
      + '<div class="conv-info"><div class="conv-name">' + esc(c.contactName) + '</div>'
      + '<div class="conv-preview">' + esc(c.lastMessage) + '</div></div>'
      + '<div class="conv-meta"><div class="conv-time">' + time + '</div>' + unread + '</div></div>';
  }).join('');
}

async function selectConv(bsuid) {
  selectedBsuid = bsuid;
  renderConversations();

  const conv = conversations.find(c => c.bsuid === bsuid);
  document.getElementById('chat-avatar').textContent = conv ? conv.contactName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  document.getElementById('chat-name').textContent = conv ? conv.contactName : bsuid;
  document.getElementById('chat-bsuid').textContent = bsuid;

  chatHeader.style.display = 'flex';
  chatEmpty.style.display = 'none';
  messagesEl.style.display = 'flex';
  composeEl.style.display = 'flex';

  const res = await fetch('/api/conversations/' + bsuid + '/messages');
  const msgs = await res.json();
  renderMessages(msgs);

  fetch('/api/conversations/' + bsuid + '/read', { method: 'POST' });
  const c = conversations.find(c => c.bsuid === bsuid);
  if (c) { c.unread = 0; renderConversations(); }
}

function renderMessages(msgs) {
  messagesEl.innerHTML = msgs.map(m => {
    let cls = 'msg ';
    let senderLabel = '';
    if (m.direction === 'in') {
      cls += 'in';
      senderLabel = 'Usuario';
    } else if (m.sender === 'human') {
      cls += 'out-human';
      senderLabel = 'Operador';
    } else {
      cls += 'out-bot';
      senderLabel = 'Bot';
    }
    const delBtn = m.id ? '<button class="msg-delete" onclick="deleteMsg(\\'' + m.id + '\\')">&times;</button>' : '';
    const mediaHtml = renderMediaHtml(m);
    return '<div class="' + cls + '" data-id="' + (m.id || '') + '">'
      + delBtn
      + '<div class="msg-sender">' + senderLabel + '</div>'
      + mediaHtml
      + '<div class="msg-body">' + esc(m.body) + '</div>'
      + '<div class="msg-time">' + formatTime(m.timestamp) + '</div></div>';
  }).join('');
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function onFileSelected() {
  const file = fileInput.files[0];
  if (!file) return;
  pendingFile = file;
  fileNameEl.textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
  filePreview.style.display = 'flex';
}

function clearFile() {
  pendingFile = null;
  fileInput.value = '';
  filePreview.style.display = 'none';
  fileCaptionEl.value = '';
}

async function sendMessage() {
  if (!selectedBsuid) return;

  if (pendingFile) {
    sendBtn.disabled = true;
    const form = new FormData();
    form.append('file', pendingFile);
    const caption = fileCaptionEl.value.trim();
    if (caption) form.append('caption', caption);

    try {
      await fetch('/api/conversations/' + selectedBsuid + '/attachment', { method: 'POST', body: form });
    } catch (e) {
      console.error('Error sending file:', e);
    }
    clearFile();
    sendBtn.disabled = false;
    replyInput.focus();
    return;
  }

  const text = replyInput.value.trim();
  if (!text) return;

  sendBtn.disabled = true;
  replyInput.value = '';
  replyInput.style.height = 'auto';

  try {
    await fetch('/api/conversations/' + selectedBsuid + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.error('Error sending reply:', e);
  }
  sendBtn.disabled = false;
  replyInput.focus();
}

async function deleteMsg(messageId) {
  if (!selectedBsuid || !messageId) return;
  try {
    await fetch('/api/conversations/' + selectedBsuid + '/messages/' + messageId, { method: 'DELETE' });
  } catch (e) {
    console.error('Error deleting message:', e);
  }
}

async function deleteConv() {
  if (!selectedBsuid) return;
  if (!confirm('Eliminar esta conversacion y todos sus mensajes?')) return;

  try {
    await fetch('/api/conversations/' + selectedBsuid, { method: 'DELETE' });
  } catch (e) {
    console.error('Error deleting conversation:', e);
  }
}

socket.on('message-deleted', (data) => {
  if (data.bsuid === selectedBsuid) {
    const el = messagesEl.querySelector('[data-id="' + data.messageId + '"]');
    if (el) el.remove();
  }
});

socket.on('conversation-deleted', (data) => {
  conversations = conversations.filter(c => c.bsuid !== data.bsuid);
  renderConversations();

  if (selectedBsuid === data.bsuid) {
    selectedBsuid = null;
    chatHeader.style.display = 'none';
    messagesEl.style.display = 'none';
    composeEl.style.display = 'none';
    chatEmpty.style.display = 'flex';
  }
});

socket.on('new-message', (data) => {
  const idx = conversations.findIndex(c => c.bsuid === data.bsuid);
  if (idx >= 0) {
    conversations[idx].lastMessage = data.message.body;
    conversations[idx].lastMessageAt = data.message.timestamp;
    if (data.bsuid !== selectedBsuid) conversations[idx].unread = (conversations[idx].unread || 0) + 1;
    const conv = conversations.splice(idx, 1)[0];
    conversations.unshift(conv);
  } else {
    conversations.unshift({
      bsuid: data.bsuid,
      contactName: data.contactName || data.bsuid,
      lastMessage: data.message.body,
      lastMessageAt: data.message.timestamp,
      unread: data.bsuid === selectedBsuid ? 0 : 1,
    });
  }
  renderConversations();

  if (data.bsuid === selectedBsuid) {
    appendMessage(data.message);
  }
});

function appendMessage(m) {
  let cls = 'msg ';
  let senderLabel = '';
  if (m.direction === 'in') { cls += 'in'; senderLabel = 'Usuario'; }
  else if (m.sender === 'human') { cls += 'out-human'; senderLabel = 'Operador'; }
  else { cls += 'out-bot'; senderLabel = 'Bot'; }

  const mediaHtml = renderMediaHtml(m);
  const div = document.createElement('div');
  div.className = cls;
  div.innerHTML = '<div class="msg-sender">' + senderLabel + '</div>'
    + mediaHtml
    + '<div class="msg-body">' + esc(m.body) + '</div>'
    + '<div class="msg-time">' + formatTime(m.timestamp) + '</div>';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderMediaHtml(m) {
  if (!m.mediaUrl && !m.mediaType) return '';
  const url = m.mediaUrl || '';
  if (!url) return '';
  const fname = m.fileName || 'archivo';
  if (m.mediaType === 'image') {
    return '<div class="msg-media"><a href="' + url + '" target="_blank"><img src="' + url + '" alt="imagen" loading="lazy"></a></div>';
  }
  if (m.mediaType === 'video') {
    return '<div class="msg-media"><video controls preload="metadata"><source src="' + url + '"></video></div>';
  }
  if (m.mediaType === 'audio') {
    return '<div class="msg-media"><audio controls preload="metadata"><source src="' + url + '"></audio></div>';
  }
  if (m.mediaType === 'sticker') {
    return '<div class="msg-media"><img src="' + url + '" alt="sticker" style="max-width:150px;" loading="lazy"></div>';
  }
  return '<div class="msg-media"><a href="' + url + '" download="' + esc(fname) + '">&#128196; ' + esc(fname) + '</a></div>';
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + time;
  } catch { return ''; }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

loadConversations();
</script>
</body>
</html>`;
}
