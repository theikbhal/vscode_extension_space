const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function activate(context) {
  const disposable = vscode.commands.registerCommand("keyValue.open", () => {
    const panel = vscode.window.createWebviewPanel(
      "keyValueMap",
      "Key Value Map",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const storagePath = path.join(context.extensionPath, "storage.json");

    // Load initial data
    function loadData() {
      if (!fs.existsSync(storagePath)) {
        fs.writeFileSync(storagePath, "{}");
      }
      return JSON.parse(fs.readFileSync(storagePath, "utf8"));
    }

    // Save data to file
    function saveData(data) {
      fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
    }

    panel.webview.html = getHTML();

    panel.webview.onDidReceiveMessage((message) => {
      const data = loadData();

      if (message.type === "add") {
        data[message.key] = message.value;
        saveData(data);
      }

      if (message.type === "delete") {
        delete data[message.key];
        saveData(data);
      }

      if (message.type === "load") {
        panel.webview.postMessage({ type: "data", data });
      }

      if (message.type === "update") {
        data[message.key] = message.value;
        saveData(data);
      }

      panel.webview.postMessage({ type: "data", data: loadData() });
    });
  });

  context.subscriptions.push(disposable);
}

function getHTML() {
  return `
<html>
<head>
<style>
body { font-family: sans-serif; padding: 15px; }
input { padding: 5px; margin-right: 5px; }
button { padding: 5px 10px; }
.list-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3333; }
.key { font-weight: bold; }
</style>
</head>
<body>
<h2>Key → Value Map</h2>
<div>
  <input id="key" placeholder="key" />
  <input id="value" placeholder="value" />
  <button onclick="add()">Add / Update</button>
</div>

<h3>Stored Pairs</h3>
<div id="list"></div>

<script>
const vscode = acquireVsCodeApi();

function load() {
  vscode.postMessage({ type: 'load' });
}

function add() {
  const key = document.getElementById('key').value.trim();
  const value = document.getElementById('value').value.trim();
  if (!key) return alert("Enter key");
  vscode.postMessage({ type: 'add', key, value });
}

function remove(key) {
  vscode.postMessage({ type: 'delete', key });
}

window.addEventListener('message', event => {
  const msg = event.data;
  if (msg.type === 'data') {
    const list = document.getElementById('list');
    list.innerHTML = '';
    for (let k in msg.data) {
      list.innerHTML += \`
        <div class="list-item">
          <div><span class="key">\${k}</span> : \${msg.data[k]}</div>
          <button onclick="remove('\${k}')">Delete</button>
        </div>
      \`;
    }
  }
});

load();
</script>
</body>
</html>
  `;
}

function deactivate() {}

module.exports = { activate, deactivate };
