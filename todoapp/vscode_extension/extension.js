const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const disposable = vscode.commands.registerCommand('todoApi.open', () => {
    const panel = vscode.window.createWebviewPanel(
      'todoApi',
      'Todo (API)',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message) => {
      const base = 'http://localhost:4000';
      try {
        if (message.type === 'load') {
          const res = await fetch(`${base}/todos`);
          const todos = await res.json();
          panel.webview.postMessage({ type: 'todos', todos });
        }

        if (message.type === 'add') {
          await fetch(`${base}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: message.title })
          });
          const res = await fetch(`${base}/todos`);
          const todos = await res.json();
          panel.webview.postMessage({ type: 'todos', todos });
        }

        if (message.type === 'toggle') {
          await fetch(`${base}/todos/${message.id}/toggle`, {
            method: 'PATCH'
          });
          const res = await fetch(`${base}/todos`);
          const todos = await res.json();
          panel.webview.postMessage({ type: 'todos', todos });
        }

        if (message.type === 'delete') {
          await fetch(`${base}/todos/${message.id}`, {
            method: 'DELETE'
          });
          const res = await fetch(`${base}/todos`);
          const todos = await res.json();
          panel.webview.postMessage({ type: 'todos', todos });
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Todo API error: ${err.message}`);
      }
    });
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

/** @returns {string} */
function getWebviewContent() {
  // simple HTML + JS UI
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Todo (API)</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 12px;
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1 {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
    }
    form {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
    }
    input[type="text"] {
      flex: 1;
      padding: 4px 6px;
    }
    button {
      padding: 4px 10px;
      cursor: pointer;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid rgba(128,128,128,0.2);
      font-size: 0.9rem;
    }
    .left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .todo-title.done {
      text-decoration: line-through;
      opacity: 0.6;
    }
    .small-btn {
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <h1>Todo (API)</h1>
  <form id="add-form">
    <input id="title-input" type="text" placeholder="Add a todo..." />
    <button type="submit">Add</button>
  </form>
  <ul id="list"></ul>

  <script>
    const vscode = acquireVsCodeApi();
    const listEl = document.getElementById('list');
    const formEl = document.getElementById('add-form');
    const inputEl = document.getElementById('title-input');

    function render(todos) {
      listEl.innerHTML = '';
      if (!todos || todos.length === 0) {
        listEl.innerHTML = '<li>No todos yet.</li>';
        return;
      }
      for (const todo of todos) {
        const li = document.createElement('li');

        const left = document.createElement('div');
        left.className = 'left';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!todo.done;
        checkbox.addEventListener('change', () => {
          vscode.postMessage({ type: 'toggle', id: todo.id });
        });

        const titleSpan = document.createElement('span');
        titleSpan.textContent = todo.title;
        titleSpan.className = 'todo-title' + (todo.done ? ' done' : '');

        left.appendChild(checkbox);
        left.appendChild(titleSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'small-btn';
        deleteBtn.addEventListener('click', () => {
          vscode.postMessage({ type: 'delete', id: todo.id });
        });

        li.appendChild(left);
        li.appendChild(deleteBtn);
        listEl.appendChild(li);
      }
    }

    // receive data from extension
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'todos') {
        render(msg.todos);
      }
    });

    // form submit
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = inputEl.value.trim();
      if (!title) return;
      vscode.postMessage({ type: 'add', title });
      inputEl.value = '';
    });

    // initial load
    vscode.postMessage({ type: 'load' });
  </script>
</body>
</html>`;
}

module.exports = {
  activate,
  deactivate
};
