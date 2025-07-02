// Test Dune calendar calculations
import { GameTimeManager, DUNE_CALENDAR } from './lib/game-time/calendar-utils.js';

console.log('🧪 Testing Dune Imperial Calendar Calculations\n');

// Test basic date parsing
console.log('📅 Testing Date Parsing:');
try {
  const testDate = "1 Ignis 10191 A.G.";
  const parsed = GameTimeManager.parseDuneDate(testDate);
  console.log(`"${testDate}" → Year: ${parsed.year}, Month: ${parsed.month}, Day: ${parsed.day}`);
} catch (e) {
  console.error('Parsing failed:', e.message);
}

// Test calendar system constants
console.log('\n📊 Calendar System:');
console.log(`Months: ${DUNE_CALENDAR.MONTHS.join(', ')}`);
console.log(`Days per month: ${DUNE_CALENDAR.DAYS_IN_MONTH}`);
console.log(`Days per year: ${DUNE_CALENDAR.DAYS_IN_YEAR}`);
console.log(`Week days: ${DUNE_CALENDAR.WEEK_DAYS.join(', ')}`);
console.log(`Imperial Epoch: ${DUNE_CALENDAR.IMPERIAL_EPOCH} A.G.`);

// Test date arithmetic
console.log('\n➕ Testing Date Arithmetic:');
try {
  const startDate = "1 Ignis 10191 A.G.";
  const result1 = GameTimeManager.addDaysDuneDate(startDate, 44);
  console.log(`${startDate} + 44 days = ${result1}`);
  
  const result2 = GameTimeManager.addDaysDuneDate(startDate, 360);
  console.log(`${startDate} + 360 days (1 year) = ${result2}`);
  
  const result3 = GameTimeManager.addDaysDuneDate(startDate, 29);
  console.log(`${startDate} + 29 days = ${result3}`);
} catch (e) {
  console.error('Date arithmetic failed:', e.message);
}

console.log('\n✅ Test complete!');
