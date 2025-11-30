const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

app.use(cors());
app.use(express.json());

// --- helpers ---

function readTodos() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading todos:', err);
    return [];
  }
}

function writeTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// --- routes ---

// GET all todos
app.get('/todos', (req, res) => {
  const todos = readTodos();
  res.json(todos);
});

// POST create todo
app.post('/todos', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const todos = readTodos();
  const newTodo = {
    id: Date.now().toString(),
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };
  todos.push(newTodo);
  writeTodos(todos);
  res.status(201).json(newTodo);
});

// PATCH toggle done
app.patch('/todos/:id/toggle', (req, res) => {
  const { id } = req.params;
  const todos = readTodos();
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  todos[idx].done = !todos[idx].done;
  writeTodos(todos);
  res.json(todos[idx]);
});

// DELETE todo
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  const todos = readTodos();
  const filtered = todos.filter(t => t.id !== id);
  if (filtered.length === todos.length) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  writeTodos(filtered);
  res.status(204).end();
});

// health check
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Todo API running', endpoints: ['/todos'] });
});

app.listen(PORT, () => {
  console.log(`Todo API server running on http://localhost:${PORT}`);
});
