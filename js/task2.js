/**
 * Assignment #5 — Task 2: Kanban Board Built from Data (Option A)
 * Author: Abay Amirzhanuly (IT-2510)
 * 
 * Strict requirements fulfilled:
 * 1. At least 10 objects with unique ID and 4+ properties of different types (number, string, boolean).
 * 2. HTML contains only empty containers.
 * 3. One single render() function called on every state change.
 * 4. Filter and search with empty-state message when nothing matches.
 * 5. Rule-blocked action: In Progress column holds at most 3 cards (WIP limit).
 * 6. Progress and total points calculated using custom for...of loop.
 * 7. Single event listener on container via Event Delegation (e.target.closest).
 * 8. STRICT: No innerHTML for data. All elements built via createElement, textContent, classList, dataset.
 */

// ============================================================================
// 1. DATA SOURCE (12 Task Objects with multiple property types)
// ============================================================================
const initialTasks = [
  { id: 1, title: 'Design Studio Signal Flow Diagram', priority: 'high', tag: 'Design', storyPoints: 5, status: 'todo', isFlagged: false },
  { id: 2, title: 'Calibrate Outboard Tube Preamp', priority: 'medium', tag: 'Audio', storyPoints: 3, status: 'todo', isFlagged: false },
  { id: 3, title: 'Implement CSS Mixer Fader Grid', priority: 'high', tag: 'Frontend', storyPoints: 8, status: 'in-progress', isFlagged: true },
  { id: 4, title: 'Configure Microphone Patchbay', priority: 'low', tag: 'Audio', storyPoints: 2, status: 'in-progress', isFlagged: false },
  { id: 5, title: 'Audit Color Contrast on Dark Theme', priority: 'medium', tag: 'UI/UX', storyPoints: 3, status: 'done', isFlagged: false },
  { id: 6, title: 'Setup GitHub Actions Deployment', priority: 'high', tag: 'DevOps', storyPoints: 5, status: 'done', isFlagged: false },
  { id: 7, title: 'Optimize Hero Responsive Layout at 375px', priority: 'high', tag: 'Frontend', storyPoints: 5, status: 'todo', isFlagged: false },
  { id: 8, title: 'Record Acoustic Guitar Test Session', priority: 'medium', tag: 'Audio', storyPoints: 4, status: 'todo', isFlagged: false },
  { id: 9, title: 'Build Modal Dialog for Studio Tour', priority: 'medium', tag: 'Frontend', storyPoints: 3, status: 'in-progress', isFlagged: false },
  { id: 10, title: 'Write W3C Validation Defense Summary', priority: 'low', tag: 'Docs', storyPoints: 2, status: 'done', isFlagged: false },
  { id: 11, title: 'Synthesize Sub-Bass Frequency Curve', priority: 'low', tag: 'Audio', storyPoints: 3, status: 'todo', isFlagged: false },
  { id: 12, title: 'Refactor Constraint Validation API', priority: 'high', tag: 'Frontend', storyPoints: 8, status: 'todo', isFlagged: true }
];

// Mutable state array
let tasks = [...initialTasks];

// Filter and search states
let currentSearchQuery = '';
let currentTagFilter = 'All';
let currentPrioritySort = 'default';

// Rule Limit Constant
const MAX_IN_PROGRESS_TASKS = 3;

// ============================================================================
// 2. DOM REFERENCES
// ============================================================================
const kanbanBoard = document.getElementById('kanbanBoard');
const todoList = document.getElementById('todoList');
const inProgressList = document.getElementById('inProgressList');
const doneList = document.getElementById('doneList');

const todoCountBadge = document.getElementById('todoCountBadge');
const inProgressCountBadge = document.getElementById('inProgressCountBadge');
const doneCountBadge = document.getElementById('doneCountBadge');

const searchInput = document.getElementById('taskSearchInput');
const tagFilterSelect = document.getElementById('tagFilterSelect');
const prioritySortSelect = document.getElementById('prioritySortSelect');
const btnResetData = document.getElementById('btnResetData');

const ruleAlertBox = document.getElementById('ruleAlertBox');
const progressPercentText = document.getElementById('progressPercentText');
const progressBarFill = document.getElementById('progressBarFill');
const completedPointsText = document.getElementById('completedPointsText');

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================

/**
 * Display a temporary rule restriction warning
 */
function showRuleAlert(message) {
  ruleAlertBox.textContent = message;
  ruleAlertBox.classList.remove('d-none');
  
  // Auto dismiss after 4 seconds
  clearTimeout(showRuleAlert.timer);
  showRuleAlert.timer = setTimeout(() => {
    ruleAlertBox.classList.add('d-none');
    ruleAlertBox.textContent = '';
  }, 4000);
}

/**
 * Calculate progress metrics using a dedicated for...of loop
 */
function calculateMetrics(taskList) {
  let doneCount = 0;
  let donePoints = 0;
  let totalPoints = 0;

  for (const item of taskList) {
    totalPoints += item.storyPoints;
    if (item.status === 'done') {
      doneCount += 1;
      donePoints += item.storyPoints;
    }
  }

  const percent = taskList.length > 0 ? Math.round((doneCount / taskList.length) * 100) : 0;
  return { percent, donePoints, totalPoints, doneCount };
}

/**
 * Create a single card DOM element without using innerHTML
 */
function createCardElement(task) {
  const card = document.createElement('article');
  card.className = 'kanban-card';
  card.dataset.id = String(task.id);

  // Top Row: Priority Badge & Story Points
  const headerDiv = document.createElement('div');
  headerDiv.className = 'd-flex justify-content-between align-items-center mb-2';

  const prioritySpan = document.createElement('span');
  prioritySpan.className = `card-priority priority-${task.priority}`;
  prioritySpan.textContent = task.priority.toUpperCase();

  const pointsSpan = document.createElement('span');
  pointsSpan.className = 'badge bg-light text-dark border small';
  pointsSpan.textContent = `${task.storyPoints} pts`;

  headerDiv.appendChild(prioritySpan);
  headerDiv.appendChild(pointsSpan);

  // Card Title
  const titleHeading = document.createElement('h6');
  titleHeading.className = 'fw-bold mb-2 text-dark';
  titleHeading.textContent = task.title;

  // Middle Row: Tag badge
  const metaDiv = document.createElement('div');
  metaDiv.className = 'd-flex align-items-center gap-2 mb-2';

  const tagSpan = document.createElement('span');
  tagSpan.className = 'card-tag';
  tagSpan.textContent = `#${task.tag}`;

  if (task.isFlagged === true) {
    const flagSpan = document.createElement('span');
    flagSpan.className = 'badge bg-danger-subtle text-danger small';
    flagSpan.textContent = '★ Urgent';
    metaDiv.appendChild(flagSpan);
  }

  metaDiv.appendChild(tagSpan);

  // Bottom Actions Row (Event Delegation target buttons)
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'card-actions';

  // Left move button (if not in 'todo')
  if (task.status === 'in-progress' || task.status === 'done') {
    const btnLeft = document.createElement('button');
    btnLeft.type = 'button';
    btnLeft.className = 'card-btn';
    btnLeft.dataset.action = 'move-left';
    btnLeft.dataset.id = String(task.id);
    btnLeft.title = 'Move Left';
    btnLeft.textContent = '← Prev';
    actionsDiv.appendChild(btnLeft);
  }

  // Right move button (if not in 'done')
  if (task.status === 'todo' || task.status === 'in-progress') {
    const btnRight = document.createElement('button');
    btnRight.type = 'button';
    btnRight.className = 'card-btn';
    btnRight.dataset.action = 'move-right';
    btnRight.dataset.id = String(task.id);
    btnRight.title = 'Move Right';
    btnRight.textContent = 'Next →';
    actionsDiv.appendChild(btnRight);
  }

  // Delete button
  const btnDelete = document.createElement('button');
  btnDelete.type = 'button';
  btnDelete.className = 'card-btn text-danger';
  btnDelete.dataset.action = 'delete';
  btnDelete.dataset.id = String(task.id);
  btnDelete.title = 'Remove Card';
  btnDelete.textContent = '×';
  actionsDiv.appendChild(btnDelete);

  // Assemble Card
  card.appendChild(headerDiv);
  card.appendChild(titleHeading);
  card.appendChild(metaDiv);
  card.appendChild(actionsDiv);

  return card;
}

// ============================================================================
// 4. MAIN RENDER FUNCTION (One single function called after every change)
// ============================================================================
function render() {
  // 1. Clear container nodes safely without innerHTML
  todoList.replaceChildren();
  inProgressList.replaceChildren();
  doneList.replaceChildren();

  // 2. Filter data
  let filteredTasks = tasks.filter((item) => {
    // Search query match
    const matchesSearch = item.title.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
                          item.tag.toLowerCase().includes(currentSearchQuery.toLowerCase());

    // Tag filter match
    const matchesTag = currentTagFilter === 'All' || item.tag === currentTagFilter;

    return matchesSearch && matchesTag;
  });

  // 3. Sort data if requested
  if (currentPrioritySort === 'high-to-low') {
    const weight = { high: 3, medium: 2, low: 1 };
    filteredTasks.sort((a, b) => weight[b.priority] - weight[a.priority]);
  } else if (currentPrioritySort === 'low-to-high') {
    const weight = { high: 3, medium: 2, low: 1 };
    filteredTasks.sort((a, b) => weight[a.priority] - weight[b.priority]);
  } else if (currentPrioritySort === 'points-desc') {
    filteredTasks.sort((a, b) => b.storyPoints - a.storyPoints);
  }

  // Track counts per column
  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;

  // 4. Build and append card DOM nodes
  for (const task of filteredTasks) {
    const cardEl = createCardElement(task);

    if (task.status === 'todo') {
      todoList.appendChild(cardEl);
      todoCount += 1;
    } else if (task.status === 'in-progress') {
      inProgressList.appendChild(cardEl);
      inProgressCount += 1;
    } else if (task.status === 'done') {
      doneList.appendChild(cardEl);
      doneCount += 1;
    }
  }

  // 5. Empty-State feedback when nothing is found
  if (todoCount === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks in To Do';
    todoList.appendChild(empty);
  }
  if (inProgressCount === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks in progress';
    inProgressList.appendChild(empty);
  }
  if (doneCount === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No completed tasks';
    doneList.appendChild(empty);
  }

  // 6. Update Column Badges
  todoCountBadge.textContent = `${todoCount}`;
  inProgressCountBadge.textContent = `${inProgressCount} / ${MAX_IN_PROGRESS_TASKS}`;
  doneCountBadge.textContent = `${doneCount}`;

  // Highlight WIP Limit on middle column badge
  if (inProgressCount >= MAX_IN_PROGRESS_TASKS) {
    inProgressCountBadge.className = 'column-badge bg-warning text-dark fw-bold';
  } else {
    inProgressCountBadge.className = 'column-badge';
  }

  // 7. Calculate and update overall progress bar via loop helper
  const metrics = calculateMetrics(tasks);
  progressBarFill.style.width = `${metrics.percent}%`;
  progressPercentText.textContent = `${metrics.percent}% Complete (${metrics.doneCount}/${tasks.length})`;
  completedPointsText.textContent = `${metrics.donePoints} / ${metrics.totalPoints} points delivered`;
}

// ============================================================================
// 5. EVENT DELEGATION LISTENER ON KANBAN CONTAINER
// ============================================================================
kanbanBoard.addEventListener('click', (event) => {
  // Find closest button with a data-action attribute
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const taskId = Number(button.dataset.id);
  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return;

  const task = tasks[taskIndex];

  // ACTION: Move Card to Right Column
  if (action === 'move-right') {
    if (task.status === 'todo') {
      // RULE: In Progress column holds at most 3 cards!
      const currentInProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
      if (currentInProgressCount >= MAX_IN_PROGRESS_TASKS) {
        showRuleAlert(`⚠️ WIP Limit Exceeded: "In progress" column can hold at most ${MAX_IN_PROGRESS_TASKS} cards! Finish an existing task first.`);
        return; // Action blocked!
      }
      task.status = 'in-progress';
    } else if (task.status === 'in-progress') {
      task.status = 'done';
    }
    render();
  }

  // ACTION: Move Card to Left Column
  if (action === 'move-left') {
    if (task.status === 'done') {
      // Moving back to In Progress also respects the WIP limit!
      const currentInProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
      if (currentInProgressCount >= MAX_IN_PROGRESS_TASKS) {
        showRuleAlert(`⚠️ WIP Limit Exceeded: Cannot move back into "In progress". Limit of ${MAX_IN_PROGRESS_TASKS} cards reached.`);
        return; // Action blocked!
      }
      task.status = 'in-progress';
    } else if (task.status === 'in-progress') {
      task.status = 'todo';
    }
    render();
  }

  // ACTION: Delete Card
  if (action === 'delete') {
    tasks.splice(taskIndex, 1);
    render();
  }
});

// ============================================================================
// 6. CONTROLS EVENT HANDLERS
// ============================================================================
searchInput.addEventListener('input', (e) => {
  currentSearchQuery = e.target.value.trim();
  render();
});

tagFilterSelect.addEventListener('change', (e) => {
  currentTagFilter = e.target.value;
  render();
});

prioritySortSelect.addEventListener('change', (e) => {
  currentPrioritySort = e.target.value;
  render();
});

btnResetData.addEventListener('click', () => {
  tasks = JSON.parse(JSON.stringify(initialTasks));
  currentSearchQuery = '';
  currentTagFilter = 'All';
  currentPrioritySort = 'default';
  searchInput.value = '';
  tagFilterSelect.value = 'All';
  prioritySortSelect.value = 'default';
  ruleAlertBox.classList.add('d-none');
  render();
});

// Initial Render
render();
