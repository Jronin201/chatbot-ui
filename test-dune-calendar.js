// Test the Dune calendar implementation
// This file tests all the core functionality without needing a browser

// Mock the types since we can't import them in Node.js
const DUNE_CALENDAR = {
  MONTHS: [
    "Ignis",
    "Leonis",
    "Nivis",
    "Ventus",
    "Stiria",
    "Vicus",
    "Salus",
    "Hetera",
    "Mollis",
    "Umbra",
    "Frigidus",
    "Kamar"
  ],
  DAYS_IN_MONTH: 30,
  DAYS_IN_YEAR: 360,
  MONTHS_IN_YEAR: 12,
  DAYS_IN_WEEK: 6,
  WEEK_DAYS: ["Solis", "Lunis", "Terris", "Aquae", "Ventis", "Ignis"],
  IMPERIAL_EPOCH: 10191
};

// Core parsing function (extracted from your code)
function parseDuneDate(dateString) {
  console.log(`Parsing Dune date: "${dateString}"`);
  
  // Remove "A.G." suffix if present
  const cleanDate = dateString.replace(/\s*A\.G\.?\s*$/i, "").trim();
  console.log(`Cleaned date: "${cleanDate}"`);

  // Try different formats
  const patterns = [
    /^(\d{1,2})\s+(\w+)\s+(\d+)$/, // "15 Ignis 10191"
    /^(\w+)\s+(\d{1,2}),?\s+(\d+)$/, // "Ignis 15, 10191"
    /^(\d{1,2})\/(\d{1,2})\/(\d+)$/ // "15/1/10191" (day/month/year)
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = cleanDate.match(pattern);
    console.log(`Pattern ${i} (${pattern}): ${match ? 'matched' : 'no match'}`);
    
    if (match) {
      console.log('Match groups:', match);
      
      if (pattern === patterns[0]) {
        // "15 Ignis 10191"
        const day = parseInt(match[1]);
        const monthName = match[2];
        const year = parseInt(match[3]);
        const monthIndex = DUNE_CALENDAR.MONTHS.findIndex(
          m => m.toLowerCase() === monthName.toLowerCase()
        );
        const month = monthIndex + 1;

        console.log('Pattern 0 parsing:', { day, monthName, year, monthIndex, month });

        if (month > 0 && day >= 1 && day <= 30) {
          const result = { year, month, day };
          console.log('Successfully parsed:', result);
          return result;
        } else {
          console.log('Validation failed:', { monthValid: month > 0, dayValid: day >= 1 && day <= 30 });
        }
      } else if (pattern === patterns[1]) {
        // "Ignis 15, 10191"
        const monthName = match[1];
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        const monthIndex = DUNE_CALENDAR.MONTHS.findIndex(
          m => m.toLowerCase() === monthName.toLowerCase()
        );
        const month = monthIndex + 1;

        console.log('Pattern 1 parsing:', { monthName, day, year, monthIndex, month });

        if (month > 0 && day >= 1 && day <= 30) {
          const result = { year, month, day };
          console.log('Successfully parsed:', result);
          return result;
        } else {
          console.log('Validation failed:', { monthValid: month > 0, dayValid: day >= 1 && day <= 30 });
        }
      } else if (pattern === patterns[2]) {
        // "15/1/10191"
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);

        if (month >= 1 && month <= 12 && day >= 1 && day <= 30) {
          return { year, month, day };
        }
      }
    }
  }

  throw new Error(`Invalid Dune calendar date format: "${dateString}"`);
}

// Test date arithmetic
function duneDateToDays(duneDate) {
  const { year, month, day } = duneDate;
  
  // Calculate total days from years (360 days per year)
  const yearDays = (year - DUNE_CALENDAR.IMPERIAL_EPOCH) * DUNE_CALENDAR.DAYS_IN_YEAR;
  
  // Calculate days from completed months in current year (30 days per month)
  const monthDays = (month - 1) * DUNE_CALENDAR.DAYS_IN_MONTH;
  
  // Add the current day
  return yearDays + monthDays + day - 1; // -1 because we count from day 0
}

function daysToDuneDate(totalDays) {
  // Calculate the year
  const yearsSinceEpoch = Math.floor(totalDays / DUNE_CALENDAR.DAYS_IN_YEAR);
  const year = DUNE_CALENDAR.IMPERIAL_EPOCH + yearsSinceEpoch;
  
  // Calculate remaining days in the current year
  const daysInCurrentYear = totalDays % DUNE_CALENDAR.DAYS_IN_YEAR;
  
  // Calculate the month (1-based)
  const month = Math.floor(daysInCurrentYear / DUNE_CALENDAR.DAYS_IN_MONTH) + 1;
  
  // Calculate the day within the month (1-based)
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

// Run tests
console.log('🧪 Testing Dune Imperial Calendar Implementation\n');

console.log('📊 Calendar Configuration:');
console.log(`Months: ${DUNE_CALENDAR.MONTHS.join(', ')}`);
console.log(`Days per month: ${DUNE_CALENDAR.DAYS_IN_MONTH}`);
console.log(`Days per year: ${DUNE_CALENDAR.DAYS_IN_YEAR}`);
console.log(`Imperial Epoch: ${DUNE_CALENDAR.IMPERIAL_EPOCH} A.G.\n`);

// Test 1: Basic date parsing
console.log('📅 Test 1: Date Parsing');
const testDates = [
  "1 Ignis 10191 A.G.",
  "15 Leonis 10191 A.G.",
  "30 Kamar 10195 A.G.",
  "1 ignis 10191 A.G.", // Test case sensitivity
  "Ignis 1, 10191"
];

testDates.forEach((dateStr, i) => {
  console.log(`\nTest 1.${i + 1}: "${dateStr}"`);
  try {
    const parsed = parseDuneDate(dateStr);
    console.log(`✅ Success:`, parsed);
  } catch (error) {
    console.log(`❌ Failed:`, error.message);
  }
});

// Test 2: Date arithmetic
console.log('\n\n➕ Test 2: Date Arithmetic');
try {
  const startDate = parseDuneDate("1 Ignis 10191 A.G.");
  console.log(`\nStarting date:`, startDate);
  
  // Test adding days
  const tests = [
    { days: 29, expected: "30 Ignis 10191 A.G." },
    { days: 30, expected: "1 Leonis 10191 A.G." },
    { days: 44, expected: "15 Leonis 10191 A.G." },
    { days: 360, expected: "1 Ignis 10192 A.G." }
  ];
  
  tests.forEach((test, i) => {
    console.log(`\nTest 2.${i + 1}: Adding ${test.days} days`);
    const result = addDaysToDuneDate(startDate, test.days);
    const formatted = formatDuneDate(result);
    console.log(`Result: ${formatted}`);
    console.log(`Expected: ${test.expected}`);
    console.log(`Match: ${formatted === test.expected ? '✅' : '❌'}`);
  });
  
} catch (error) {
  console.log('❌ Date arithmetic test failed:', error.message);
}

// Test 3: Edge cases
console.log('\n\n🔍 Test 3: Edge Cases');
const edgeCases = [
  "invalid date",
  "32 Ignis 10191 A.G.", // Invalid day
  "1 InvalidMonth 10191 A.G.", // Invalid month
  "0 Ignis 10191 A.G.", // Day 0
];

edgeCases.forEach((dateStr, i) => {
  console.log(`\nTest 3.${i + 1}: "${dateStr}"`);
  try {
    const parsed = parseDuneDate(dateStr);
    console.log(`❌ Should have failed but got:`, parsed);
  } catch (error) {
    console.log(`✅ Correctly rejected:`, error.message.split('\n')[0]);
  }
});

console.log('\n\n🎉 Testing complete!');
