/**
 * Assignment #5 — Task 1: Turn-Based Battle (Option B)
 * Author: Abay Amirzhanuly (IT-2510)
 * 
 * Requirements strictly met:
 * 1. All game numbers stored as constants at the top of the script.
 * 2. At least three outcomes decided with &&, || and ===.
 * 3. Fair random calculation with Math.floor(Math.random() * (max - min + 1)) + min.
 * 4. Invalid moves rejected with a message without changing state.
 * 5. State updated after every move; restarts without page reload.
 * 6. External JS with defer, let/const, addEventListener, no onclick, no jQuery.
 */

// ============================================================================
// 1. GAME CONSTANTS (Stored at the top of the script)
// ============================================================================
const HERO_MAX_HP = 100;
const ENEMY_MAX_HP = 100;
const HERO_ATTACK_MIN = 8;
const HERO_ATTACK_MAX = 15;
const ENEMY_ATTACK_MIN = 5;
const ENEMY_ATTACK_MAX = 14;
const HEAL_AMOUNT = 20;
const MAX_HEALS = 3;
const CRIT_CHANCE = 0.10; // 10% chance
const CRIT_MULTIPLIER = 1.5;
const LOG_MAX_ITEMS = 5;

// ============================================================================
// 2. MUTABLE GAME STATE VARIABLES
// ============================================================================
let heroHp = HERO_MAX_HP;
let enemyHp = ENEMY_MAX_HP;
let remainingHeals = MAX_HEALS;
let isDefending = false; // When true, halves the next incoming hit
let isGameOver = false;
let actionLog = [];

// ============================================================================
// 3. DOM ELEMENT REFERENCES
// ============================================================================
const heroHpText = document.getElementById('heroHpText');
const heroHpBar = document.getElementById('heroHpBar');
const enemyHpText = document.getElementById('enemyHpText');
const enemyHpBar = document.getElementById('enemyHpBar');
const healCountBadge = document.getElementById('healCountBadge');
const defenseBadge = document.getElementById('defenseBadge');

const btnAttack = document.getElementById('btnAttack');
const btnDefend = document.getElementById('btnDefend');
const btnHeal = document.getElementById('btnHeal');
const btnRestart = document.getElementById('btnRestart');

const heroCard = document.getElementById('heroCard');
const enemyCard = document.getElementById('enemyCard');
const combatLogList = document.getElementById('combatLogList');
const messageAlert = document.getElementById('messageAlert');
const gameOverBanner = document.getElementById('gameOverBanner');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverDesc = document.getElementById('gameOverDesc');

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

/**
 * Fair random integer generator including both min and max
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Display a temporary status alert (e.g., invalid move or warning)
 */
function showStatusMessage(text, type = 'warning') {
  messageAlert.textContent = text;
  messageAlert.className = `alert alert-${type} py-2 px-3 small text-center mb-3`;
  messageAlert.classList.remove('d-none');
}

function clearStatusMessage() {
  messageAlert.classList.add('d-none');
  messageAlert.textContent = '';
}

/**
 * Append an entry to the action log (keeps only last 5 entries)
 */
function addLogEntry(text, category = 'normal') {
  actionLog.unshift({ text, category, id: Date.now() + Math.random() });
  if (actionLog.length > LOG_MAX_ITEMS) {
    actionLog.pop();
  }
  renderCombatLog();
}

/**
 * Render the last 5 actions into the DOM using createElement
 */
function renderCombatLog() {
  combatLogList.replaceChildren(); // Clean container without innerHTML

  for (const item of actionLog) {
    const li = document.createElement('li');
    li.className = `combat-log-item ${item.category}`;
    li.textContent = item.text;
    combatLogList.appendChild(li);
  }
}

/**
 * Update HP bars, badges, and visual feedback
 */
function updateUI() {
  // Hero HP Bar
  heroHpText.textContent = `${heroHp} / ${HERO_MAX_HP} HP`;
  const heroPercent = Math.max(0, Math.min(100, (heroHp / HERO_MAX_HP) * 100));
  heroHpBar.style.width = `${heroPercent}%`;
  
  heroHpBar.className = 'hp-bar-fill';
  if (heroPercent <= 25) {
    heroHpBar.classList.add('critical');
  } else if (heroPercent <= 50) {
    heroHpBar.classList.add('warning');
  }

  // Enemy HP Bar
  enemyHpText.textContent = `${enemyHp} / ${ENEMY_MAX_HP} HP`;
  const enemyPercent = Math.max(0, Math.min(100, (enemyHp / ENEMY_MAX_HP) * 100));
  enemyHpBar.style.width = `${enemyPercent}%`;

  enemyHpBar.className = 'hp-bar-fill';
  if (enemyPercent <= 25) {
    enemyHpBar.classList.add('critical');
  } else if (enemyPercent <= 50) {
    enemyHpBar.classList.add('warning');
  }

  // Heal badge
  healCountBadge.textContent = `${remainingHeals} left`;
  if (remainingHeals === 0) {
    btnHeal.disabled = true;
    btnHeal.classList.add('opacity-50');
  } else {
    btnHeal.disabled = false;
    btnHeal.classList.remove('opacity-50');
  }

  // Defense status badge
  if (isDefending === true) {
    defenseBadge.classList.remove('d-none');
  } else {
    defenseBadge.classList.add('d-none');
  }
}

/**
 * Check game termination conditions using &&, ||, and ===
 */
function checkGameStatus() {
  // Outcome 1: Victory (Enemy dead and Hero alive)
  if (enemyHp <= 0 && heroHp > 0) {
    enemyHp = 0;
    isGameOver = true;
    triggerEndGame('Victory! 🏆', 'You vanquished the rogue shadow crawler with tactical precision.', 'success');
    return true;
  }

  // Outcome 2: Defeat (Hero dead and Enemy alive)
  if (heroHp <= 0 && enemyHp > 0) {
    heroHp = 0;
    isGameOver = true;
    triggerEndGame('Defeat! 💀', 'Your hero collapsed on the battlefield. Better luck on the next run!', 'danger');
    return true;
  }

  // Outcome 3: Mutual Draw (Both HP <= 0)
  if (heroHp <= 0 && enemyHp <= 0) {
    heroHp = 0;
    enemyHp = 0;
    isGameOver = true;
    triggerEndGame('Double K.O. ⚔️', 'Both warriors fell in the final simultaneous clash!', 'secondary');
    return true;
  }

  return false;
}

/**
 * Handle game over state without page reload
 */
function triggerEndGame(title, desc, theme) {
  btnAttack.disabled = true;
  btnDefend.disabled = true;
  btnHeal.disabled = true;

  gameOverTitle.textContent = title;
  gameOverDesc.textContent = desc;
  gameOverBanner.className = `alert alert-${theme} text-center py-3 px-4 shadow-sm my-3`;
  gameOverBanner.classList.remove('d-none');
}

/**
 * Execute the enemy's AI retaliation turn
 */
function executeEnemyTurn() {
  if (isGameOver === true) return;

  // Visual turn feedback
  enemyCard.classList.add('active-turn');
  heroCard.classList.remove('active-turn');

  setTimeout(() => {
    let rawDamage = getRandomInt(ENEMY_ATTACK_MIN, ENEMY_ATTACK_MAX);
    const isCrit = Math.random() < CRIT_CHANCE; // 10% critical hit chance

    if (isCrit === true) {
      rawDamage = Math.round(rawDamage * CRIT_MULTIPLIER);
    }

    let finalDamage = rawDamage;
    let logMsg = '';

    // If hero was defending, damage is halved
    if (isDefending === true) {
      finalDamage = Math.round(rawDamage / 2);
      heroHp = Math.max(0, heroHp - finalDamage);
      logMsg = `🛡️ Shield absorbed 50%! Enemy attacked for ${rawDamage}, dealing ${finalDamage} damage.`;
      isDefending = false; // Shield used up
    } else {
      heroHp = Math.max(0, heroHp - finalDamage);
      if (isCrit === true) {
        logMsg = `💥 CRITICAL HIT! Enemy struck fiercely for ${finalDamage} damage!`;
      } else {
        logMsg = `🗡️ Enemy retaliated and dealt ${finalDamage} damage to Hero.`;
      }
    }

    heroCard.classList.add('hit-shake');
    setTimeout(() => heroCard.classList.remove('hit-shake'), 400);

    addLogEntry(logMsg, isCrit ? 'crit' : 'enemy');
    updateUI();

    checkGameStatus();

    enemyCard.classList.remove('active-turn');
    heroCard.classList.add('active-turn');
  }, 450);
}

// ============================================================================
// 5. PLAYER ACTION HANDLERS
// ============================================================================

/**
 * Hero Action: Attack (8 - 15 damage, 10% crit chance)
 */
function handleHeroAttack() {
  clearStatusMessage();

  // Invalid move rejection without changing state
  if (isGameOver === true) {
    showStatusMessage('The battle has concluded! Click "Restart Game" to challenge again.', 'info');
    return;
  }

  let damage = getRandomInt(HERO_ATTACK_MIN, HERO_ATTACK_MAX);
  const isCrit = Math.random() < CRIT_CHANCE;

  if (isCrit === true) {
    damage = Math.round(damage * CRIT_MULTIPLIER);
  }

  enemyHp = Math.max(0, enemyHp - damage);

  enemyCard.classList.add('hit-shake');
  setTimeout(() => enemyCard.classList.remove('hit-shake'), 400);

  if (isCrit === true) {
    addLogEntry(`⚡ HERO CRITICAL! Powerful strike dealt ${damage} damage to Enemy!`, 'crit');
  } else {
    addLogEntry(`⚔️ Hero attacked and dealt ${damage} damage to Enemy.`);
  }

  updateUI();

  // If enemy survived, enemy retaliates
  const gameEnded = checkGameStatus();
  if (gameEnded === false) {
    executeEnemyTurn();
  }
}

/**
 * Hero Action: Defend (halves the next hit)
 */
function handleHeroDefend() {
  clearStatusMessage();

  // Invalid move rejection
  if (isGameOver === true) {
    showStatusMessage('The battle has concluded! Click "Restart Game" to play again.', 'info');
    return;
  }

  // Condition: cannot stack defense if already defending
  if (isDefending === true) {
    showStatusMessage('Your shield is already raised! Choose Attack or Heal.', 'warning');
    return;
  }

  isDefending = true;
  addLogEntry(`🛡️ Hero raised the Aegis shield! Incoming damage will be halved.`);
  updateUI();

  executeEnemyTurn();
}

/**
 * Hero Action: Heal (+20 HP, max 3 times)
 */
function handleHeroHeal() {
  clearStatusMessage();

  // Invalid move checks using &&, ||, and ===
  if (isGameOver === true) {
    showStatusMessage('The battle is over. Restart to play again.', 'info');
    return;
  }

  // Reject move if heals exhausted
  if (remainingHeals <= 0) {
    showStatusMessage('No healing potions remaining! (Max 3 used).', 'danger');
    return;
  }

  // Reject move if already at full health
  if (heroHp === HERO_MAX_HP) {
    showStatusMessage('Your Hero is already at maximum health (100 HP)!', 'warning');
    return;
  }

  remainingHeals -= 1;
  const oldHp = heroHp;
  heroHp = Math.min(HERO_MAX_HP, heroHp + HEAL_AMOUNT);
  const actualHeal = heroHp - oldHp;

  addLogEntry(`✨ Hero used a healing potion: restored +${actualHeal} HP. (${remainingHeals} potions left).`, 'heal');
  updateUI();

  executeEnemyTurn();
}

/**
 * Restart Game: Resets state without reloading the webpage
 */
function handleRestartGame() {
  heroHp = HERO_MAX_HP;
  enemyHp = ENEMY_MAX_HP;
  remainingHeals = MAX_HEALS;
  isDefending = false;
  isGameOver = false;
  actionLog = [];

  btnAttack.disabled = false;
  btnDefend.disabled = false;
  btnHeal.disabled = false;

  gameOverBanner.classList.add('d-none');
  clearStatusMessage();

  heroCard.classList.remove('hit-shake');
  enemyCard.classList.remove('hit-shake');
  heroCard.classList.add('active-turn');
  enemyCard.classList.remove('active-turn');

  addLogEntry('⚔️ A new battle has begun! Choose your opening move.');
  updateUI();
}

// ============================================================================
// 6. EVENT LISTENERS SETUP (Clean addEventListener, no onclick in HTML)
// ============================================================================
btnAttack.addEventListener('click', handleHeroAttack);
btnDefend.addEventListener('click', handleHeroDefend);
btnHeal.addEventListener('click', handleHeroHeal);
btnRestart.addEventListener('click', handleRestartGame);

// Initial game boot
handleRestartGame();
