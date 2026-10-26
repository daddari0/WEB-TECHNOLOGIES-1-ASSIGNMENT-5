/**
 * Assignment #5 — Task 3: Ticket Builder with Live Validation (Option A)
 * Author: Abay Amirzhanuly (IT-2510)
 * 
 * Strict requirements fulfilled:
 * 1. At least 6 fields (we have 7).
 * 2. 4 rules that HTML attributes cannot express:
 *    - Rule 1: Dynamic seat capacity check against JS array of ticket types.
 *    - Rule 2: Sold-out date blacklisting from JS array.
 *    - Rule 3: Promo code verification against discount dictionary.
 *    - Rule 4: Multi-word name verification (First and Last name).
 * 3. Live preview updates on EVERY input change.
 * 4. Zero errors on initial page load. Field checked on blur, then on input.
 * 5. Clear error message under each field with aria-invalid sync.
 * 6. On submit with errors: shows error count banner at top, sets focus on first error.
 * 7. On submit success: builds final ticket DOM node with random booking code, resets form.
 * 8. form.noValidate = true; native browser messages disabled; Constraint Validation API used.
 * 9. No jQuery, no external libraries.
 */

// ============================================================================
// 1. DATA MODELS & CONSTANTS
// ============================================================================
const TICKET_TYPES = [
  { id: 'standard', name: 'Standard Pass', price: 6000, seatsLeft: 12 },
  { id: 'vip', name: 'VIP Backstage Pass', price: 15000, seatsLeft: 4 },
  { id: 'student', name: 'Student Discount Pass', price: 3500, seatsLeft: 2 }
];

// Specific sold-out dates that HTML attributes cannot blacklist
const SOLD_OUT_DATES = [
  '2026-11-15',
  '2026-11-20',
  '2026-11-28'
];

// Valid promo codes and their percentage discounts
const PROMO_CODES = {
  'AITU2026': 20, // 20% off
  'NEON10': 10,   // 10% off
  'STUDIO50': 50  // 50% off
};

// ============================================================================
// 2. DOM REFERENCES
// ============================================================================
const ticketForm = document.getElementById('ticketBuilderForm');

// Form Inputs
const eventSelect = document.getElementById('eventSelect');
const eventDateInput = document.getElementById('eventDateInput');
const ticketTypeSelect = document.getElementById('ticketTypeSelect');
const quantityInput = document.getElementById('quantityInput');
const fullNameInput = document.getElementById('fullNameInput');
const emailInput = document.getElementById('emailInput');
const promoCodeInput = document.getElementById('promoCodeInput');

// Error Feedback Elements
const eventSelectError = document.getElementById('eventSelectError');
const eventDateError = document.getElementById('eventDateError');
const ticketTypeError = document.getElementById('ticketTypeError');
const quantityError = document.getElementById('quantityError');
const fullNameError = document.getElementById('fullNameError');
const emailError = document.getElementById('emailError');
const promoCodeError = document.getElementById('promoCodeError');

// Top Summary Error Banner
const submitErrorBanner = document.getElementById('submitErrorBanner');
const submitErrorCount = document.getElementById('submitErrorCount');

// Live Preview DOM Elements
const previewEventName = document.getElementById('previewEventName');
const previewAttendeeName = document.getElementById('previewAttendeeName');
const previewDate = document.getElementById('previewDate');
const previewType = document.getElementById('previewType');
const previewQty = document.getElementById('previewQty');
const previewSeatsLeftBadge = document.getElementById('previewSeatsLeftBadge');
const previewBasePrice = document.getElementById('previewBasePrice');
const previewDiscountBadge = document.getElementById('previewDiscountBadge');
const previewTotalPrice = document.getElementById('previewTotalPrice');

// Result Confirmation Container
const bookingSuccessCard = document.getElementById('bookingSuccessCard');
const confirmedTicketContent = document.getElementById('confirmedTicketContent');

// State tracking: whether a field has been blurred (interacted with)
const touchedFields = new Set();

// Turn off browser native validation tooltips; keep Constraint Validation API active
ticketForm.noValidate = true;

// ============================================================================
// 3. FIELD VALIDATION FUNCTIONS (Rules HTML attributes cannot express)
// ============================================================================

/**
 * Validate Event Selection
 */
function validateEvent() {
  if (!eventSelect.value) {
    setFieldError(eventSelect, eventSelectError, 'Please select an event from the list.');
    return false;
  }
  setFieldSuccess(eventSelect, eventSelectError);
  return true;
}

/**
 * Validate Date (Rule 2: Sold-out date blacklist)
 */
function validateDate() {
  const dateVal = eventDateInput.value;
  if (!dateVal) {
    setFieldError(eventDateInput, eventDateError, 'Please choose an event date.');
    return false;
  }

  // Rule 2: Cannot select blacklisted sold-out dates
  if (SOLD_OUT_DATES.includes(dateVal)) {
    setFieldError(eventDateInput, eventDateError, `This date (${dateVal}) is completely SOLD OUT! Choose another day.`);
    return false;
  }

  setFieldSuccess(eventDateInput, eventDateError);
  return true;
}

/**
 * Validate Ticket Type & Sync Capacity
 */
function validateTicketType() {
  const typeId = ticketTypeSelect.value;
  if (!typeId) {
    setFieldError(ticketTypeSelect, ticketTypeError, 'Please select a ticket tier.');
    return false;
  }

  const selectedTier = TICKET_TYPES.find((t) => t.id === typeId);
  if (!selectedTier || selectedTier.seatsLeft <= 0) {
    setFieldError(ticketTypeSelect, ticketTypeError, 'This tier is sold out.');
    return false;
  }

  setFieldSuccess(ticketTypeSelect, ticketTypeError);

  // If quantity was already touched, re-validate quantity against new tier limits
  if (touchedFields.has(quantityInput)) {
    validateQuantity();
  }

  return true;
}

/**
 * Validate Quantity (Rule 1: Dynamic seat capacity check)
 */
function validateQuantity() {
  const qty = Number(quantityInput.value);
  const typeId = ticketTypeSelect.value;
  const selectedTier = TICKET_TYPES.find((t) => t.id === typeId);

  if (!qty || qty < 1) {
    setFieldError(quantityInput, quantityError, 'Quantity must be at least 1 ticket.');
    return false;
  }

  // Rule 1: Dynamic check against in-memory inventory
  if (selectedTier && qty > selectedTier.seatsLeft) {
    setFieldError(
      quantityInput,
      quantityError,
      `Requested ${qty} tickets, but only ${selectedTier.seatsLeft} seat(s) remain for ${selectedTier.name}!`
    );
    return false;
  }

  setFieldSuccess(quantityInput, quantityError);
  return true;
}

/**
 * Validate Full Name (Rule 4: Multi-word check)
 */
function validateFullName() {
  const nameVal = fullNameInput.value.trim();

  if (!nameVal) {
    setFieldError(fullNameInput, fullNameError, 'Full name is required.');
    return false;
  }

  if (nameVal.length < 2) {
    setFieldError(fullNameInput, fullNameError, 'Name must be at least 2 characters long.');
    return false;
  }

  // Rule 4: Must contain at least two words (First and Last name)
  const words = nameVal.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    setFieldError(fullNameInput, fullNameError, 'Please enter BOTH your first and last name (e.g. Abay Amirzhan).');
    return false;
  }

  setFieldSuccess(fullNameInput, fullNameError);
  return true;
}

/**
 * Validate University Email
 */
function validateEmail() {
  const emailVal = emailInput.value.trim();

  if (!emailVal) {
    setFieldError(emailInput, emailError, 'Email address is required.');
    return false;
  }

  // Native Constraint Validation API check
  if (!emailInput.checkValidity()) {
    setFieldError(emailInput, emailError, 'Please enter a valid email address with an @ and domain.');
    return false;
  }

  setFieldSuccess(emailInput, emailError);
  return true;
}

/**
 * Validate Promo Code (Rule 3: Promo dictionary verification)
 */
function validatePromoCode() {
  const codeVal = promoCodeInput.value.trim().toUpperCase();

  // Promo is optional: if empty, it is valid without error
  if (!codeVal) {
    setFieldSuccess(promoCodeInput, promoCodeError);
    return true;
  }

  // Rule 3: If entered, must exist in PROMO_CODES dictionary
  if (!Object.prototype.hasOwnProperty.call(PROMO_CODES, codeVal)) {
    setFieldError(
      promoCodeInput,
      promoCodeError,
      `Invalid promo code "${codeVal}". Available codes: AITU2026 (20%), NEON10 (10%).`
    );
    return false;
  }

  setFieldSuccess(promoCodeInput, promoCodeError);
  return true;
}

// ============================================================================
// 4. ERROR & SUCCESS UI HELPERS (with aria-invalid synchronization)
// ============================================================================

function setFieldError(inputEl, errorEl, message) {
  inputEl.classList.add('is-invalid');
  inputEl.classList.remove('is-valid');
  inputEl.setAttribute('aria-invalid', 'true');

  errorEl.textContent = message;
  errorEl.classList.add('visible');
}

function setFieldSuccess(inputEl, errorEl) {
  inputEl.classList.remove('is-invalid');
  inputEl.classList.add('is-valid');
  inputEl.setAttribute('aria-invalid', 'false');

  errorEl.textContent = '';
  errorEl.classList.remove('visible');
}

// ============================================================================
// 5. LIVE PREVIEW UPDATE FUNCTION (Updates on EVERY input)
// ============================================================================
function updateLivePreview() {
  // 1. Event Name
  const selectedEventOption = eventSelect.options[eventSelect.selectedIndex];
  previewEventName.textContent = selectedEventOption && eventSelect.value
    ? selectedEventOption.textContent
    : 'Choose Event to Preview';

  // 2. Attendee Name
  previewAttendeeName.textContent = fullNameInput.value.trim() || 'Attendee Name';

  // 3. Date
  if (eventDateInput.value) {
    const d = new Date(eventDateInput.value + 'T00:00:00');
    previewDate.textContent = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } else {
    previewDate.textContent = 'Select Date';
  }

  // 4. Ticket Type & Seats Left Badge
  const selectedTier = TICKET_TYPES.find((t) => t.id === ticketTypeSelect.value);
  if (selectedTier) {
    previewType.textContent = selectedTier.name;
    previewSeatsLeftBadge.textContent = `${selectedTier.seatsLeft} seats left`;
    previewSeatsLeftBadge.className = selectedTier.seatsLeft <= 3
      ? 'badge bg-danger small'
      : 'badge bg-success small';
  } else {
    previewType.textContent = 'Ticket Tier';
    previewSeatsLeftBadge.textContent = '-- seats';
    previewSeatsLeftBadge.className = 'badge bg-secondary small';
  }

  // 5. Quantity
  const qty = Math.max(1, Number(quantityInput.value) || 1);
  previewQty.textContent = `${qty}x`;

  // 6. Pricing Calculation with Promo Code Discount
  const unitPrice = selectedTier ? selectedTier.price : 0;
  const subtotal = unitPrice * qty;
  previewBasePrice.textContent = `${subtotal.toLocaleString()} ₸`;

  const promoCode = promoCodeInput.value.trim().toUpperCase();
  let discountPercent = 0;

  if (promoCode && PROMO_CODES[promoCode]) {
    discountPercent = PROMO_CODES[promoCode];
    previewDiscountBadge.textContent = `-${discountPercent}% PROMO`;
    previewDiscountBadge.classList.remove('d-none');
  } else {
    previewDiscountBadge.classList.add('d-none');
  }

  const finalTotal = Math.round(subtotal * (1 - discountPercent / 100));
  previewTotalPrice.textContent = `${finalTotal.toLocaleString()} ₸`;
}

// ============================================================================
// 6. EVENT BINDING: BLUR, INPUT, CHANGE
// ============================================================================
const fieldValidators = [
  { el: eventSelect, validator: validateEvent },
  { el: eventDateInput, validator: validateDate },
  { el: ticketTypeSelect, validator: validateTicketType },
  { el: quantityInput, validator: validateQuantity },
  { el: fullNameInput, validator: validateFullName },
  { el: emailInput, validator: validateEmail },
  { el: promoCodeInput, validator: validatePromoCode }
];

// Attach listeners to every field
fieldValidators.forEach(({ el, validator }) => {
  // On BLUR: mark field as touched and validate
  el.addEventListener('blur', () => {
    touchedFields.add(el);
    validator();
  });

  // On INPUT or CHANGE: re-validate only IF already blurred (touched), and update live preview
  const eventName = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
  el.addEventListener(eventName, () => {
    if (touchedFields.has(el)) {
      validator();
    }
    updateLivePreview();
  });
});

// ============================================================================
// 7. FORM SUBMIT HANDLER
// ============================================================================
ticketForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Stop native navigation

  // Mark all fields as touched for full evaluation
  fieldValidators.forEach(({ el }) => touchedFields.add(el));

  // Run all validators
  const validationResults = fieldValidators.map(({ validator }) => validator());
  const invalidIndices = [];

  validationResults.forEach((isValid, index) => {
    if (!isValid) {
      invalidIndices.push(index);
    }
  });

  // SUBMIT WITH ERRORS: Show count at top, set focus on first invalid field
  if (invalidIndices.length > 0) {
    const errorCount = invalidIndices.length;
    submitErrorCount.textContent = `${errorCount}`;
    submitErrorBanner.classList.remove('d-none');

    // Focus on first invalid field
    const firstInvalidField = fieldValidators[invalidIndices[0]].el;
    firstInvalidField.focus();
    return;
  }

  // SUBMIT ON SUCCESS: Hide errors, build DOM result ticket, and reset form
  submitErrorBanner.classList.add('d-none');

  const selectedTier = TICKET_TYPES.find((t) => t.id === ticketTypeSelect.value);
  const qty = Number(quantityInput.value);
  const promoCode = promoCodeInput.value.trim().toUpperCase();
  const discountPercent = promoCode && PROMO_CODES[promoCode] ? PROMO_CODES[promoCode] : 0;
  const unitPrice = selectedTier ? selectedTier.price : 0;
  const totalPrice = Math.round(unitPrice * qty * (1 - discountPercent / 100));
  const bookingCode = `TK-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  // Decrement remaining seats in in-memory array
  if (selectedTier) {
    selectedTier.seatsLeft = Math.max(0, selectedTier.seatsLeft - qty);
  }

  // Build result confirmation using pure DOM methods
  confirmedTicketContent.replaceChildren();

  const header = document.createElement('div');
  header.className = 'text-center mb-3';

  const badgeCode = document.createElement('span');
  badgeCode.className = 'badge bg-success-subtle text-success fs-6 px-3 py-2 rounded-pill fw-bold';
  badgeCode.textContent = `Booking Code: ${bookingCode}`;
  header.appendChild(badgeCode);

  const eventTitle = document.createElement('h4');
  eventTitle.className = 'fw-bold mt-2 text-dark';
  eventTitle.textContent = eventSelect.options[eventSelect.selectedIndex].textContent;
  header.appendChild(eventTitle);

  const detailsList = document.createElement('ul');
  detailsList.className = 'list-unstyled small text-secondary my-3';
  detailsList.style.lineHeight = '1.8';

  const liAttendee = document.createElement('li');
  liAttendee.textContent = `👤 Attendee: ${fullNameInput.value.trim()} (${emailInput.value.trim()})`;
  detailsList.appendChild(liAttendee);

  const liDate = document.createElement('li');
  liDate.textContent = `📅 Event Date: ${eventDateInput.value}`;
  detailsList.appendChild(liDate);

  const liTier = document.createElement('li');
  liTier.textContent = `🎟️ Ticket: ${qty}x ${selectedTier.name} (${totalPrice.toLocaleString()} ₸ total)`;
  detailsList.appendChild(liTier);

  if (discountPercent > 0) {
    const liPromo = document.createElement('li');
    liPromo.textContent = `🏷️ Promo Applied: ${promoCode} (-${discountPercent}%)`;
    detailsList.appendChild(liPromo);
  }

  confirmedTicketContent.appendChild(header);
  confirmedTicketContent.appendChild(detailsList);

  // Show Success Card
  bookingSuccessCard.classList.remove('d-none');
  bookingSuccessCard.scrollIntoView({ behavior: 'smooth' });

  // Reset Form & Clear Touched states
  ticketForm.reset();
  touchedFields.clear();

  // Reset visual validation states
  fieldValidators.forEach(({ el, errorEl }) => {
    el.classList.remove('is-valid', 'is-invalid');
    el.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  });

  // Re-sync preview to default
  updateLivePreview();
});

// Initial live preview sync
updateLivePreview();
