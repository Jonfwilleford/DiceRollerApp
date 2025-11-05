const rollBtn = document.getElementById("roll-btn");
const resultDisplay = document.getElementById("result-display");
const historyPanel = document.getElementById("history-panel");
const diceContainer = document.getElementById("dice-container");
const addDiceButtons = document.querySelectorAll(".add-die");
const historyToggle = document.getElementById("history-toggle");

historyToggle.addEventListener("click", () => {
  historyPanel.classList.toggle("hidden");
});

rollBtn.addEventListener("click", rollDice);
let selectedDice = [];

function rollDice() {
    if (selectedDice.length === 0) {
      resultDisplay.textContent = "No dice selected";
      return;
    }

    let total = 0;
    let resultText = "";

    selectedDice.forEach(die => {
      const sides = die.type === "custom" ? 0 : parseInt(die.type);
      let rolls = [];

      for (let i = 0; i < die.count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        total += roll;
      }

      resultText += `${die.count}d${die.type} → [ ${rolls.join(", ")} ]\n`;
    });

    resultText += `\nTotal: ${total}`;

    resultDisplay.textContent = resultText;

    const historyEntry = document.createElement("div");
    historyEntry.textContent = resultText;
    historyPanel.prepend(historyEntry);
}

addDiceButtons.forEach(button => {
  button.addEventListener("click", () => {
    const diceType = button.dataset.die;
    addDie(diceType);
  });
});

function addDie(diceType) {
  const dieDiv = document.createElement("div");
  dieDiv.classList.add("die");
  dieDiv.textContent = diceType;

  const select = document.createElement("select");
  for (let i = 1; i <= 8; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    select.appendChild(option);
  }

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "×";
  removeBtn.classList.add("remove-die");
  removeBtn.addEventListener("click", () => {
    dieDiv.remove();
    selectedDice = selectedDice.filter(d => d.id !== dieDiv.dataset.id);
  });

  dieDiv.dataset.id = crypto.randomUUID();
  dieDiv.appendChild(select);
  dieDiv.appendChild(removeBtn);
  diceContainer.appendChild(dieDiv);

  selectedDice.push({
    id: dieDiv.dataset.id,
    type: diceType,
    count: 1
  });

  select.addEventListener("change", e => {
    const die = selectedDice.find(d => d.id === dieDiv.dataset.id);
    if (die) die.count = parseInt(e.target.value);
  });
}
