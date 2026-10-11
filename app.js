
const form = document.getElementById("zodiacForm");
const dayInput = document.getElementById("day");
const monthInput = document.getElementById("month");
const yearInput = document.getElementById("year");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");
const submitButton = form.querySelector('button[type="submit"]');
const resetButton = document.getElementById("resetButton");

yearInput.max = new Date().getFullYear();

// Update available days for the selected month and year.
function updateDays() {
  const month = Number(monthInput.value);
  const yearText = yearInput.value.trim();
  const year = Number(yearText);
  const previousDay = Number(dayInput.value);

  let maxDays = 31;

  if (
    month &&
    yearText &&
    Number.isInteger(year) &&
    year >= 1 &&
    year <= 9999
  ) {
    maxDays = new Date(year, month, 0).getDate();
  } else if (month === 2) {
    maxDays = 29;
  } else if ([4, 6, 9, 11].includes(month)) {
    maxDays = 30;
  }

  dayInput.replaceChildren(new Option("Day", ""));

  for (let day = 1; day <= maxDays; day++) {
    dayInput.add(new Option(String(day), String(day)));
  }

  if (previousDay > 0 && previousDay <= maxDays) {
    dayInput.value = String(previousDay);
  } else if (previousDay > maxDays) {
    dayInput.value = "";
  }
}

function hideResult() {
  resultBox.hidden = true;
  errorBox.textContent = "";
}

monthInput.addEventListener("change", () => {
  updateDays();
  hideResult();
});

yearInput.addEventListener("input", () => {
  updateDays();
  hideResult();
});

dayInput.addEventListener("change", hideResult);

// Format the date ranges returned by the API.
function formatDate(parts) {
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  return `${months[parts[0] - 1]} ${parts[1]}`;
}

// Submit the birthday to the Express backend.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideResult();

  const day = dayInput.value;
  const month = monthInput.value;
  const yearText = yearInput.value.trim();
  const year = Number(yearText);

  if (!day || !month || !yearText) {
    errorBox.textContent =
      "Please select your day and month and enter your birth year.";
    return;
  }

  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > new Date().getFullYear()
  ) {
    errorBox.textContent = "Please enter a valid birth year.";
    return;
  }

  // YYYY-MM-DD is the format expected by the API.
  const birthDate = [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");

  submitButton.disabled = true;
  submitButton.textContent = "Calculating your sign...";

  try {
    const response = await fetch("/api/zodiac", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ birthDate })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to calculate your sign.");
    }

    const sign = data.zodiac;

    document.getElementById("resultSymbol").textContent = sign.symbol;
    document.getElementById("resultName").textContent = sign.name;

    document.getElementById("resultDates").textContent =
      `${formatDate(sign.startDate)} – ${formatDate(sign.endDate)}`;

    document.getElementById("resultElement").textContent =
      `${getElementEmoji(sign.element)} ${sign.element} Sign`;

    document.getElementById("resultTraits").textContent =
      sign.traits.join(" · ");

    document.getElementById("resultDescription").textContent =
      sign.description;

    resultBox.hidden = false;

    resultBox.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  } catch (error) {
    errorBox.textContent =
      error.message || "Unable to contact the server. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "✨ Reveal My Zodiac Sign";
  }
});

function getElementEmoji(element) {
  const emojis = {
    Fire: "🔥",
    Earth: "🌱",
    Air: "🌬️",
    Water: "💧"
  };

  return emojis[element] || "✦";
}

// Reset the form so another birthday can be checked.
resetButton.addEventListener("click", () => {
  form.reset();
  updateDays();
  hideResult();
  monthInput.focus();
});

updateDays();
