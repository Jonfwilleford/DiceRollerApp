// ============================================================
//  Dice Forge — index.js
// ============================================================

const rollBtn       = document.getElementById("roll-btn");
const clearBtn      = document.getElementById("clear-btn");
const resultDisplay = document.getElementById("result-display");
const historyPanel  = document.getElementById("history-panel");
const diceTray      = document.getElementById("dice-tray");
const trayEmpty     = document.getElementById("tray-empty");
const historyToggle = document.getElementById("history-toggle");

// Custom die modal
const customModal   = document.getElementById("custom-modal");
const customSides   = document.getElementById("custom-sides");
const customCount   = document.getElementById("custom-count");
const modalCancel   = document.getElementById("modal-cancel");
const modalConfirm  = document.getElementById("modal-confirm");

let selectedDice = [];

// ---- History toggle ----
historyToggle.addEventListener("click", () => {
  historyPanel.classList.toggle("hidden");
  historyToggle.classList.toggle("open");
});

// ---- Keyboard shortcut: Enter to roll ----
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !customModal.classList.contains("hidden")) return;
  if (e.key === "Enter") rollDice();
});

// ---- Roll button ----
rollBtn.addEventListener("click", rollDice);

// ---- Clear button ----
clearBtn.addEventListener("click", () => {
  selectedDice = [];
  // Remove all chips but keep trayEmpty in the DOM
  diceTray.querySelectorAll(".die-chip").forEach(c => c.remove());
  trayEmpty.classList.remove("hidden");
  trayEmpty.style.color = "";
  trayEmpty.textContent = "Click a die above to add it";
  resultDisplay.classList.add("hidden");
});

// ---- Die picker buttons ----
document.querySelectorAll(".add-die").forEach(button => {
  button.addEventListener("click", () => {
    const dieType = button.dataset.die;
    if (dieType === "custom") {
      openCustomModal();
    } else {
      addDie(dieType, 1);
    }
  });
});

// ---- Custom modal ----
function openCustomModal() {
  customSides.value = 100;
  customCount.value = 1;
  customModal.classList.remove("hidden");
  customSides.focus();
}

modalCancel.addEventListener("click", () => {
  customModal.classList.add("hidden");
});

modalConfirm.addEventListener("click", () => {
  const sides = parseInt(customSides.value);
  const count = parseInt(customCount.value);
  if (isNaN(sides) || sides < 2) { customSides.focus(); return; }
  addDie(`custom(${sides})`, Math.max(1, Math.min(20, count || 1)));
  customModal.classList.add("hidden");
});

// Close modal on backdrop click
customModal.addEventListener("click", e => {
  if (e.target === customModal) customModal.classList.add("hidden");
});

// ---- Add die to tray ----
function addDie(dieType, initialCount = 1) {
  // Hide empty placeholder
  trayEmpty.classList.add("hidden");

  const chip = document.createElement("div");
  chip.classList.add("die-chip");
  const chipId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  chip.dataset.id = chipId;

  const label = document.createElement("span");
  label.classList.add("chip-label");
  label.textContent = dieType.startsWith("custom") ? `d${dieType.match(/\d+/)?.[0]}` : `d${dieType}`;

  const select = document.createElement("select");
  select.setAttribute("aria-label", "Count");
  for (let i = 1; i <= 20; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `×${i}`;
    if (i === initialCount) opt.selected = true;
    select.appendChild(opt);
  }

  const removeBtn = document.createElement("button");
  removeBtn.classList.add("remove-die");
  removeBtn.innerHTML = "×";
  removeBtn.setAttribute("aria-label", "Remove die");
  removeBtn.addEventListener("click", () => {
    chip.remove();
    selectedDice = selectedDice.filter(d => d.id !== chipId);
    if (selectedDice.length === 0) {
      trayEmpty.classList.remove("hidden");
    }
  });

  chip.appendChild(label);
  chip.appendChild(select);
  chip.appendChild(removeBtn);
  diceTray.appendChild(chip);

  // Resolve sides
  let sides;
  if (dieType.startsWith("custom")) {
    sides = parseInt(dieType.match(/\d+/)?.[0]);
  } else {
    sides = parseInt(dieType);
  }

  selectedDice.push({ id: chipId, sides, count: initialCount, label: label.textContent });

  select.addEventListener("change", e => {
    const die = selectedDice.find(d => d.id === chipId);
    if (die) die.count = parseInt(e.target.value);
  });
}

// ---- Roll ----
function rollDice() {
  if (selectedDice.length === 0) {
    flashEmpty();
    return;
  }

  rollBtn.classList.remove("rolling");
  void rollBtn.offsetWidth;
  rollBtn.classList.add("rolling");
  rollBtn.disabled = true;

  // Compute all results up front
  const results = [];
  let total = 0;
  let rollLines = [];

  selectedDice.forEach(die => {
    const rolls = [];
    for (let i = 0; i < die.count; i++) {
      const roll = Math.floor(Math.random() * die.sides) + 1;
      rolls.push(roll);
      total += roll;
    }
    results.push({ label: die.label, sides: die.sides, rolls });
    rollLines.push(die.count + die.label + " -> [" + rolls.join(", ") + "]");
  });

  // Build animated card display
  resultDisplay.classList.remove("hidden");
  resultDisplay.innerHTML = "";

  const cardsRow = document.createElement("div");
  cardsRow.classList.add("dice-cards-row");

  const cardEls = [];
  results.forEach(group => {
    group.rolls.forEach(finalValue => {
      const card = document.createElement("div");
      card.classList.add("dice-card");
      card.dataset.sides = group.sides;

      const dieLabel = document.createElement("div");
      dieLabel.classList.add("dice-card-label");
      dieLabel.textContent = group.label;

      const dieValue = document.createElement("div");
      dieValue.classList.add("dice-card-value");
      dieValue.textContent = "?";

      card.appendChild(dieLabel);
      card.appendChild(dieValue);
      cardsRow.appendChild(card);
      cardEls.push({ valueEl: dieValue, card, finalValue, sides: group.sides });
    });
  });

  resultDisplay.appendChild(cardsRow);

  const totalWrap = document.createElement("div");
  totalWrap.classList.add("result-total-wrap", "hidden");
  totalWrap.innerHTML = "<div class='result-total-label'>Total</div><div class='result-total'>" + total + "</div>";
  resultDisplay.appendChild(totalWrap);

  // Animate: flicker then land, staggered per card
  const DURATION = 700;
  const INTERVAL = 55;
  const STAGGER  = 90;
  let settled = 0;

  cardEls.forEach(function(item, i) {
    setTimeout(function() {
      item.card.classList.add("rolling-card");

      const flicker = setInterval(function() {
        item.valueEl.textContent = Math.floor(Math.random() * item.sides) + 1;
      }, INTERVAL);

      setTimeout(function() {
        clearInterval(flicker);
        item.valueEl.textContent = item.finalValue;
        item.card.classList.remove("rolling-card");
        item.card.classList.add("landed");

        if (item.finalValue === 1)           item.card.classList.add("nat-one");
        if (item.finalValue === item.sides)  item.card.classList.add("nat-max");

        settled++;
        if (settled === cardEls.length) {
          setTimeout(function() {
            totalWrap.classList.remove("hidden");
            totalWrap.classList.add("total-reveal");
            rollBtn.disabled = false;
          }, 120);

          const entry = document.createElement("div");
          entry.classList.add("history-entry");
          entry.innerHTML = "<div class='h-rolls'>" + rollLines.join("\n") + "</div><div class='h-total'>Total: " + total + "</div>";
          historyPanel.prepend(entry);
        }
      }, DURATION);

    }, i * STAGGER);
  });
}

// Flash tray when rolling with no dice selected
function flashEmpty() {
  trayEmpty.classList.remove("hidden");
  trayEmpty.style.color = "#d94f2b";
  trayEmpty.textContent = "Add at least one die first";
  setTimeout(() => {
    trayEmpty.style.color = "";
    trayEmpty.textContent = "Click a die above to add it";
  }, 1800);
}