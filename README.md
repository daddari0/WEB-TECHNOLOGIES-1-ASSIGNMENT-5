# Assignment #5: JavaScript Basics (DOM Manipulation & Events)

> **Course:** Web Technologies 1 (Front End) &bull; Fall 2026  
> **Instructor:** Alexey Fedenko  
> **Student:** Abay Amirzhanuly  
> **Group:** IT-2510  
> **Institution:** Astana IT University  

---

## 📌 Project Overview

This repository contains the complete implementation for **Assignment #5: JavaScript Basics (DOM Manipulation & Events)**. The assignment demonstrates foundational and modern client-side JavaScript competencies:
* State-driven probability algorithms, fair RNG, and conditional game loops (**Task 1: Turn-Based Battle**).
* Data-driven dynamic rendering from arrays of objects with strict **zero `innerHTML`** policy, custom loops, and event delegation (**Task 2: Project Kanban Board**).
* Real-time form validation via the Constraint Validation API, live holographic ticket previews, and business rules that HTML attributes cannot express (**Task 3: Ticket Builder**).

---

## 🗂️ Project Structure

```text
assignment5webt/
├── index.html          # Overview landing portal with criteria breakdown
├── task1.html          # Task 1: Turn-based battle arena (Option B)
├── task2.html          # Task 2: Project Kanban board from data (Option A)
├── task3.html          # Task 3: Interactive ticket builder & validator (Option A)
├── css/
│   └── style.css       # Unified design system, battle arena, board, and ticket styles
├── js/
│   ├── task1.js        # Battle game state machine, RNG, combat log, in-place restart
│   ├── task2.js        # Data array, createElement rendering, WIP limit rule, delegation
│   └── task3.js        # Live validation, Constraint Validation API, live ticket preview
├── .gitignore          # Ignores screenshots, local docx reports, and caches
└── README.md           # Documentation and defense cheatsheet
```

---

## 🚀 How to Run Locally

You can launch a local static HTTP server from the project directory:

```bash
cd ~/assignmentswebt/assignment5webt
python3 -m http.server 8000
```

Open your browser and navigate to:
* **Overview:** `http://localhost:8000/index.html`
* **Task 1 (Battle Game):** `http://localhost:8000/task1.html`
* **Task 2 (Kanban Board):** `http://localhost:8000/task2.html`
* **Task 3 (Ticket Builder):** `http://localhost:8000/task3.html`

---

## 🎯 Task Highlights & Defense Cheat Sheet

### Task 1: Turn-Based Battle (Option B)
* **Constants at Top:** `HERO_MAX_HP = 100`, `ENEMY_MAX_HP = 100`, `HERO_ATTACK_MIN = 8`, `HERO_ATTACK_MAX = 15`, `ENEMY_ATTACK_MIN = 5`, `ENEMY_ATTACK_MAX = 14`, `HEAL_AMOUNT = 20`, `MAX_HEALS = 3`, `CRIT_CHANCE = 0.10`.
* **Fair RNG Formula:** `Math.floor(Math.random() * (max - min + 1)) + min` guarantees equal probability for both the smallest and largest bounds.
* **Three Outcomes:** Evaluated with `&&`, `||`, `===`:
  * Victory: `enemyHp <= 0 && heroHp > 0`
  * Defeat: `heroHp <= 0 && enemyHp > 0`
  * Mutual Draw: `heroHp <= 0 && enemyHp <= 0`
* **Invalid Move Handling:** Attempting to heal above 100 HP or when potions are exhausted is rejected with a message without mutating game state.
* **Non-Reloading Restart:** The restart button restores all variables, HP bars, and combat log without reloading the page.

### Task 2: Kanban Board from Data (Option A)
* **Data Model:** 12 task objects each having `id` (number), `title` (string), `priority` (string), `tag` (string), `storyPoints` (number), `status` (string), and `isFlagged` (boolean).
* **Empty HTML Containers:** The markup defines only empty list wrappers (`#todoList`, `#inProgressList`, `#doneList`).
* **Zero `innerHTML` for Data:** Every task card and placeholder is built exclusively with `document.createElement()`, `textContent`, `classList.add()`, and `dataset`.
* **Single `render()` Function:** Called after every filter, sort, drag/move, and delete action.
* **Rule-Blocked Action (WIP Limit):** The middle column ("In Progress") enforces a strict capacity of **at most 3 cards**. Attempting to move a 4th card triggers an informative warning banner and halts execution.
* **Custom `for...of` Loop:** Computes delivery progress percentage and total delivered story points.
* **Event Delegation:** A single `click` event listener on `#kanbanBoard` manages all card actions via `event.target.closest('button[data-action]')`.

### Task 3: Ticket Builder with Live Validation (Option A)
* **7 Fields & 4 Rules HTML Attributes Cannot Express:**
  1. *Dynamic Seat Inventory:* Quantity cannot exceed remaining seats left for the selected ticket tier (checked against an in-memory JS array of objects).
  2. *Blacklisted Sold-Out Dates:* Certain calendar dates are completely sold out (checked against a JS array: `2026-11-15`, `2026-11-20`, `2026-11-28`).
  3. *Promo Code Dictionary:* Promo codes must match an active discount dictionary (`AITU2026` = 20%, `NEON10` = 10%) or display an error.
  4. *Multi-Word Full Name:* Attendee name must contain at least 2 words (First and Last name) via `name.trim().split(/\s+/).length >= 2`.
* **Real-Time Live Preview:** Ticket card updates attendee name, event title, date, tier, and calculated discount dynamically on every keystroke.
* **Validation Timing:** Zero errors on page load. A field is validated on `blur`, then continuously on `input`, updating `aria-invalid` and error messages.
* **Submit Handling:**
  * If invalid: Displays error count banner at top and automatically sets `.focus()` on the first invalid field.
  * If valid: Decrements in-memory seat count, builds confirmation ticket with random booking code via the DOM, and resets form.
* **Constraint Validation API:** `form.noValidate = true;` disables native popups while leveraging native validation checks.
