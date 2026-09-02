import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';

const numbers = [
  "+27823714664",
  "+254 704 983787",
  "+254792329106",
  "+254 717 639094",
  "0759264123",
  "+1 (513) 628-9845",
  "0141915883",
  "0753539341",
  "0705268604",
  "+447460763577"
];

for (const num of numbers) {
  const parsed = parsePhoneNumberFromString(num, 'KE');
  if (parsed && parsed.isValid()) {
    console.log(`${num} -> ${parsed.formatInternational()}`);
  } else {
    // maybe try formatting with AsYouType
    console.log(`${num} -> ${new AsYouType('KE').input(num)} (fallback)`);
  }
}
