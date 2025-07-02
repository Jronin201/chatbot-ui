console.log("🧪 Testing Dune Imperial Calendar Implementation");

// Test basic constants
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

console.log("📊 Calendar Configuration:");
console.log(`Months: ${DUNE_CALENDAR.MONTHS.join(', ')}`);
console.log(`Days per month: ${DUNE_CALENDAR.DAYS_IN_MONTH}`);
console.log(`Days per year: ${DUNE_CALENDAR.DAYS_IN_YEAR}`);
console.log(`Imperial Epoch: ${DUNE_CALENDAR.IMPERIAL_EPOCH} A.G.`);

// Simple parsing test
function parseDuneDate(dateString) {
  const cleanDate = dateString.replace(/\s*A\.G\.?\s*$/i, "").trim();
  
  // Try "15 Ignis 10191" format
  const match = cleanDate.match(/^(\d{1,2})\s+(\w+)\s+(\d+)$/);
  if (match) {
    const day = parseInt(match[1]);
    const monthName = match[2];
    const year = parseInt(match[3]);
    const monthIndex = DUNE_CALENDAR.MONTHS.findIndex(
      m => m.toLowerCase() === monthName.toLowerCase()
    );
    const month = monthIndex + 1;

    if (month > 0 && day >= 1 && day <= 30) {
      return { year, month, day };
    }
  }
  
  throw new Error(`Invalid date: ${dateString}`);
}

console.log("\n📅 Test 1: Basic Date Parsing");
try {
  const result = parseDuneDate("1 Ignis 10191 A.G.");
  console.log("✅ Parsed '1 Ignis 10191 A.G.':", result);
} catch (error) {
  console.log("❌ Failed:", error.message);
}

console.log("\n🎉 Basic test complete!");
