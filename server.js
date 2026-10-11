
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Accept JSON requests with a small payload limit.
app.use(express.json({ limit: "10kb" }));

// Serve the frontend from the public folder.
app.use(express.static(path.join(__dirname, "public")));

// Zodiac data: month/day boundaries use conventional
// Western tropical zodiac date ranges.
const zodiacSigns = [
  {
    name: "Aries",
    symbol: "♈",
    start: [3, 21],
    end: [4, 19],
    element: "Fire",
    traits: ["Bold", "Energetic", "Determined"],
    description:
      "Associated with courage, initiative, and embracing new challenges."
  },
  {
    name: "Taurus",
    symbol: "♉",
    start: [4, 20],
    end: [5, 20],
    element: "Earth",
    traits: ["Reliable", "Patient", "Grounded"],
    description:
      "Associated with stability, loyalty, and an appreciation of life's comforts."
  },
  {
    name: "Gemini",
    symbol: "♊",
    start: [5, 21],
    end: [6, 20],
    element: "Air",
    traits: ["Curious", "Adaptable", "Expressive"],
    description:
      "Associated with communication, curiosity, and discovering new ideas."
  },
  {
    name: "Cancer",
    symbol: "♋",
    start: [6, 21],
    end: [7, 22],
    element: "Water",
    traits: ["Caring", "Protective", "Intuitive"],
    description:
      "Associated with empathy, emotional connection, and caring for loved ones."
  },
  {
    name: "Leo",
    symbol: "♌",
    start: [7, 23],
    end: [8, 22],
    element: "Fire",
    traits: ["Confident", "Generous", "Creative"],
    description:
      "Associated with warmth, creativity, and expressive leadership."
  },
  {
    name: "Virgo",
    symbol: "♍",
    start: [8, 23],
    end: [9, 22],
    element: "Earth",
    traits: ["Analytical", "Thoughtful", "Organized"],
    description:
      "Associated with attention to detail, planning, and practical problem-solving."
  },
  {
    name: "Libra",
    symbol: "♎",
    start: [9, 23],
    end: [10, 22],
    element: "Air",
    traits: ["Diplomatic", "Charming", "Balanced"],
    description:
      "Associated with fairness, harmony, and meaningful relationships."
  },
  {
    name: "Scorpio",
    symbol: "♏",
    start: [10, 23],
    end: [11, 21],
    element: "Water",
    traits: ["Passionate", "Determined", "Perceptive"],
    description:
      "Associated with determination, loyalty, and exploring things deeply."
  },
  {
    name: "Sagittarius",
    symbol: "♐",
    start: [11, 22],
    end: [12, 21],
    element: "Fire",
    traits: ["Adventurous", "Optimistic", "Independent"],
    description:
      "Associated with exploration, open-mindedness, and a desire to learn."
  },
  {
    name: "Capricorn",
    symbol: "♑",
    start: [12, 22],
    end: [1, 19],
    element: "Earth",
    traits: ["Disciplined", "Practical", "Ambitious"],
    description:
      "Associated with responsibility, persistence, and pursuing meaningful goals."
  },
  {
    name: "Aquarius",
    symbol: "♒",
    start: [1, 20],
    end: [2, 18],
    element: "Air",
    traits: ["Independent", "Original", "Thoughtful"],
    description:
      "Associated with originality, independence, and new perspectives."
  },
  {
    name: "Pisces",
    symbol: "♓",
    start: [2, 19],
    end: [3, 20],
    element: "Water",
    traits: ["Imaginative", "Compassionate", "Intuitive"],
    description:
      "Associated with imagination, empathy, and creativity."
  }
];

// Validate YYYY-MM-DD without accepting impossible dates.
function parseBirthDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    year < 1900 ||
    year > new Date().getFullYear() ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  // UTC avoids local timezone and daylight-saving issues.
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (date.getTime() > todayUTC) {
    return null;
  }

  return { year, month, day };
}

// Convert month/day to the matching zodiac sign.
function findZodiacSign(month, day) {
  const birthday = month * 100 + day;

  return zodiacSigns.find((sign) => {
    const start = sign.start[0] * 100 + sign.start[1];
    const end = sign.end[0] * 100 + sign.end[1];

    // Capricorn spans December through January.
    if (start > end) {
      return birthday >= start || birthday <= end;
    }

    return birthday >= start && birthday <= end;
  });
}

// API health check.
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "zodiac-sign-finder"
  });
});

// Zodiac calculation endpoint.
app.post("/api/zodiac", (req, res) => {
  const { birthDate } = req.body || {};
  const parsed = parseBirthDate(birthDate);

  if (!parsed) {
    return res.status(400).json({
      success: false,
      error:
        "Enter a valid date of birth in YYYY-MM-DD format. " +
        "The date must be between 1900 and today."
    });
  }

  const sign = findZodiacSign(parsed.month, parsed.day);

  if (!sign) {
    return res.status(500).json({
      success: false,
      error: "Unable to determine the zodiac sign."
    });
  }

  return res.json({
    success: true,
    birthDate,
    zodiac: {
      name: sign.name,
      symbol: sign.symbol,
      element: sign.element,
      startDate: sign.start,
      endDate: sign.end,
      traits: sign.traits,
      description: sign.description
    }
  });
});

// Handle malformed JSON with a clear response.
app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON request body."
    });
  }

  return next(err);
});

// Start the server.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Zodiac app running at http://localhost:${PORT}`);
});
