console.log("🧪 Comprehensive Dune Imperial Calendar Test");

const DUNE_CALENDAR = {
  MONTHS: ["Ignis", "Leonis", "Nivis", "Ventus", "Stiria", "Vicus", "Salus", "Hetera", "Mollis", "Umbra", "Frigidus", "Kamar"],
  DAYS_IN_MONTH: 30,
  DAYS_IN_YEAR: 360,
  MONTHS_IN_YEAR: 12,
  IMPERIAL_EPOCH: 10191
};

function parseDuneDate(dateString) {
  const cleanDate = dateString.replace(/\s*A\.G\.?\s*$/i, "").trim();
  
  // Try different patterns
  const patterns = [
    /^(\d{1,2})\s+(\w+)\s+(\d+)$/, // "15 Ignis 10191"
    /^(\w+)\s+(\d{1,2}),?\s+(\d+)$/, // "Ignis 15, 10191"
  ];

  for (const pattern of patterns) {
    const match = cleanDate.match(pattern);
    if (match) {
      let day, monthName, year;
      
      if (pattern === patterns[0]) {
        day = parseInt(match[1]);
        monthName = match[2];
        year = parseInt(match[3]);
      } else {
        monthName = match[1];
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }

      const monthIndex = DUNE_CALENDAR.MONTHS.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
      const month = monthIndex + 1;

      if (month > 0 && day >= 1 && day <= 30) {
        return { year, month, day };
      }
    }
  }
  
  throw new Error(`Invalid Dune calendar date format: "${dateString}". Valid formats: "1 Ignis 10191 A.G." or "Ignis 1, 10191". Valid months: ${DUNE_CALENDAR.MONTHS.join(', ')}`);
}

function duneDateToDays(duneDate) {
  const { year, month, day } = duneDate;
  const yearDays = (year - DUNE_CALENDAR.IMPERIAL_EPOCH) * DUNE_CALENDAR.DAYS_IN_YEAR;
  const monthDays = (month - 1) * DUNE_CALENDAR.DAYS_IN_MONTH;
  return yearDays + monthDays + day - 1;
}

function daysToDuneDate(totalDays) {
  const yearsSinceEpoch = Math.floor(totalDays / DUNE_CALENDAR.DAYS_IN_YEAR);
  const year = DUNE_CALENDAR.IMPERIAL_EPOCH + yearsSinceEpoch;
  const daysInCurrentYear = totalDays % DUNE_CALENDAR.DAYS_IN_YEAR;
  const month = Math.floor(daysInCurrentYear / DUNE_CALENDAR.DAYS_IN_MONTH) + 1;
  const day = (daysInCurrentYear % DUNE_CALENDAR.DAYS_IN_MONTH) + 1;
  return { year, month, day };
}

function addDaysToDuneDate(duneDate, daysToAdd) {
  const totalDays = duneDateToDays(duneDate);
  const newTotalDays = totalDays + daysToAdd;
  return daysToDuneDate(newTotalDays);
}

function formatDuneDate(duneDate) {
  const monthName = DUNE_CALENDAR.MONTHS[duneDate.month - 1];
  return `${duneDate.day} ${monthName} ${duneDate.year} A.G.`;
}

// Test Suite
console.log("📊 Calendar Configuration:");
console.log(`Months: ${DUNE_CALENDAR.MONTHS.join(', ')}`);
console.log(`Days per month: ${DUNE_CALENDAR.DAYS_IN_MONTH}`);
console.log(`Days per year: ${DUNE_CALENDAR.DAYS_IN_YEAR}`);

console.log("\n📅 Test 1: Date Parsing");
const testDates = [
  "1 Ignis 10191 A.G.",
  "15 Leonis 10191 A.G.", 
  "30 Kamar 10195 A.G.",
  "1 ignis 10191 A.G.", // Case insensitive
  "Ignis 1, 10191"       // Alternative format
];

testDates.forEach((dateStr, i) => {
  try {
    const parsed = parseDuneDate(dateStr);
    console.log(`✅ Test 1.${i + 1}: "${dateStr}" → ${JSON.stringify(parsed)}`);
  } catch (error) {
    console.log(`❌ Test 1.${i + 1}: "${dateStr}" → ${error.message}`);
  }
});

console.log("\n➕ Test 2: Date Arithmetic");
try {
  const startDate = parseDuneDate("1 Ignis 10191 A.G.");
  console.log(`Starting date: ${formatDuneDate(startDate)}`);
  
  const tests = [
    { days: 29, expected: "30 Ignis 10191 A.G." },
    { days: 30, expected: "1 Leonis 10191 A.G." },
    { days: 59, expected: "30 Leonis 10191 A.G." },
    { days: 360, expected: "1 Ignis 10192 A.G." }
  ];
  
  tests.forEach((test, i) => {
    const result = addDaysToDuneDate(startDate, test.days);
    const formatted = formatDuneDate(result);
    const match = formatted === test.expected;
    console.log(`${match ? '✅' : '❌'} Test 2.${i + 1}: +${test.days} days → ${formatted} (expected: ${test.expected})`);
  });
  
} catch (error) {
  console.log('❌ Date arithmetic test failed:', error.message);
}

console.log("\n🔍 Test 3: Edge Cases");
const edgeCases = [
  "invalid date",
  "32 Ignis 10191 A.G.",        // Invalid day
  "1 InvalidMonth 10191 A.G.",   // Invalid month  
  "0 Ignis 10191 A.G."          // Day 0
];

edgeCases.forEach((dateStr, i) => {
  try {
    const parsed = parseDuneDate(dateStr);
    console.log(`❌ Test 3.${i + 1}: "${dateStr}" should have failed but got: ${JSON.stringify(parsed)}`);
  } catch (error) {
    console.log(`✅ Test 3.${i + 1}: "${dateStr}" correctly rejected`);
  }
});

console.log("\n🎉 All tests complete!");
