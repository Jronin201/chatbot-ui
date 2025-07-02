// Debug Dune calendar validation
const { GameTimeManager } = require('./lib/game-time/calendar-utils');

console.log('Testing Dune calendar validation...');

const testDates = [
  "1 Ignis 10191 A.G.",
  "1 Ignis 10191",
  "15 Ignis 10191 A.G.",
  "30 Kamar 10195 A.G."
];

testDates.forEach(date => {
  try {
    console.log(`\nTesting: "${date}"`);
    const isValid = GameTimeManager.isValidDate(date, 'dune');
    console.log(`Valid: ${isValid}`);
    
    if (isValid) {
      const parsed = GameTimeManager.parseDuneDate(date);
      console.log(`Parsed:`, parsed);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
});

console.log('\nTesting default date:');
const defaultDate = GameTimeManager.getDefaultStartDate('dune');
console.log(`Default: "${defaultDate}"`);
const isDefaultValid = GameTimeManager.isValidDate(defaultDate, 'dune');
console.log(`Default valid: ${isDefaultValid}`);
