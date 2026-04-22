// ================================================
// Bucket List App — script.js
// Option A: Uses localStorage to persist data
// ================================================

// --- State ---
// Array of bucket list items; loaded from localStorage on startup
let items = [];

// Tracks the current filter: 'all', 'pending', or 'done'
let currentFilter = 'all';

// --- DOM References ---
const input        = document.querySelector('#item-input');
const addBtn       = document.querySelector('#add-btn');
const list         = document.querySelector('#bucket-list');
const emptyState   = document.querySelector('#empty-state');
const inputHint    = document.querySelector('#input-hint');
const totalCount   = document.querySelector('#total-count');
const doneCount    = document.querySelector('#done-count');
const percentEl    = document.querySelector('#percent');
const progressFill = document.querySelector('#progress-fill');
const clearDoneBtn = document.querySelector('#clear-done-btn');
const clearAllBtn  = document.querySelector('#clear-all-btn');
const filterBtns   = document.querySelectorAll('.filter-btn');

// ================================================
// localStorage helpers
// ================================================

// Save the current items array to localStorage
const saveToStorage = () => {
  localStorage.setItem('bucketList', JSON.stringify(items));
};

// Load items from localStorage when the page first opens
const loadFromStorage = () => {
  const stored = localStorage.getItem('bucketList');
  // If there's saved data, parse it; otherwise start with an empty array
  items = stored ? JSON.parse(stored) : [];
};

// ================================================
// Render
// ================================================

// Re-renders the visible list based on the current filter
const render = () => {
  // Decide which items to show based on the active filter
  const visible = items.filter(item => {
    if (currentFilter === 'pending') return !item.done;
    if (currentFilter === 'done')    return item.done;
    return true; // 'all' — show everything
  });

  // Clear the existing list before rebuilding it
  list.innerHTML = '';

  if (visible.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');

    // Build a list item element for each visible bucket item
    visible.forEach(item => {
      const li = document.createElement('li');
      li.classList.add('bucket-item');
      if (item.done) li.classList.add('done');

      // Each row: a checkbox, the dream text, and a delete button
      li.innerHTML = `
        <input
          type="checkbox"
          class="item-check"
          aria-label="Mark as done"
          ${item.done ? 'checked' : ''}
          data-id="${item.id}"
        />
        <span class="item-text">${escapeHTML(item.text)}</span>
        <button class="item-delete" aria-label="Delete item" data-id="${item.id}">✕</button>
      `;

      list.appendChild(li);
    });
  }

  updateStats();
};

// ================================================
// Stats & progress bar
// ================================================

// Updates the three stat numbers and the progress bar fill width
const updateStats = () => {
  const total   = items.length;
  const done    = items.filter(i => i.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  totalCount.textContent = total;
  doneCount.textContent  = done;
  percentEl.textContent  = `${percent}%`;

  // Animate the progress bar to the new percentage
  progressFill.style.width = `${percent}%`;
};

// ================================================
// Add item
// ================================================

// Creates a new bucket list item and saves it
const addItem = () => {
  const text = input.value.trim();

  // Validation: don't allow empty entries
  if (!text) {
    inputHint.textContent = '⚠ Please type something first!';
    input.focus();
    return;
  }

  // Validation: avoid exact duplicates (case-insensitive)
  const isDuplicate = items.some(i => i.text.toLowerCase() === text.toLowerCase());
  if (isDuplicate) {
    inputHint.textContent = '⚠ That\'s already on your list!';
    input.focus();
    return;
  }

  // Clear any previous hint message
  inputHint.textContent = '';

  // Build the new item object
  const newItem = {
    id:   Date.now(),   // unique numeric ID based on timestamp
    text: text,
    done: false
  };

  items.push(newItem);
  saveToStorage();

  // Reset filter to 'all' so the new item is always visible
  setFilter('all');
  render();

  input.value = '';
  input.focus();
};

// ================================================
// Toggle done / delete
// ================================================

// Handles clicks anywhere inside the list (event delegation)
// instead of attaching a listener to every single item
list.addEventListener('click', (e) => {

  // --- Checkbox toggled ---
  if (e.target.classList.contains('item-check')) {
    const id = Number(e.target.dataset.id);
    const item = items.find(i => i.id === id);

    if (item) {
      item.done = e.target.checked; // toggle the done state
      saveToStorage();
      render();
    }
  }

  // --- Delete button clicked ---
  if (e.target.classList.contains('item-delete')) {
    const id = Number(e.target.dataset.id);
    // Remove the item with this id from the array
    items = items.filter(i => i.id !== id);
    saveToStorage();
    render();
  }
});

// ================================================
// Filter buttons
// ================================================

// Sets the active filter and re-renders
const setFilter = (filter) => {
  currentFilter = filter;

  // Update which button looks "active"
  filterBtns.forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
};

// Listen for clicks on each filter button
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setFilter(btn.dataset.filter);
    render();
  });
});

// ================================================
// Clear buttons
// ================================================

// Removes only items that are marked as done
clearDoneBtn.addEventListener('click', () => {
  const remaining = items.filter(i => !i.done);
  if (remaining.length === items.length) return; // nothing to clear

  if (confirm('Remove all completed items?')) {
    items = remaining;
    saveToStorage();
    render();
  }
});

// Removes every single item
clearAllBtn.addEventListener('click', () => {
  if (items.length === 0) return;

  if (confirm('Clear your entire bucket list? This cannot be undone.')) {
    items = [];
    saveToStorage();
    render();
  }
});

// ================================================
// Add button & Enter key
// ================================================

// Click the Add button to add an item
addBtn.addEventListener('click', addItem);

// Also allow pressing Enter in the input field
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addItem();
});

// Clear the hint message as soon as the user starts typing
input.addEventListener('input', () => {
  if (input.value.trim()) inputHint.textContent = '';
});

// ================================================
// Utility: prevent XSS by escaping user text
// ================================================

const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

// ================================================
// On page load — restore saved data and render
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage(); // retrieve items from localStorage
  render();          // draw the list
});
