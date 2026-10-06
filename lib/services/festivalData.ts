export interface FestivalHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "NATIONAL" | "REGIONAL" | "OPTIONAL";
  description?: string;
}

// Authoritative Indian, Telangana, and Regional Festivals & Holidays by Year
export const FESTIVALS_BY_YEAR: Record<number, FestivalHoliday[]> = {
  2025: [
    // January
    { date: "2025-01-01", name: "New Year's Day", type: "OPTIONAL" },
    { date: "2025-01-14", name: "Makar Sankranti / Pongal", type: "NATIONAL" },
    { date: "2025-01-15", name: "Kanuma", type: "REGIONAL" },
    { date: "2025-01-26", name: "Republic Day", type: "NATIONAL" },
    // February
    { date: "2025-02-02", name: "Basant Panchami", type: "REGIONAL" },
    { date: "2025-02-19", name: "Chhatrapati Shivaji Maharaj Jayanti", type: "OPTIONAL" },
    { date: "2025-02-26", name: "Maha Shivaratri", type: "NATIONAL" },
    // March
    { date: "2025-03-13", name: "Holika Dahan", type: "OPTIONAL" },
    { date: "2025-03-14", name: "Holi", type: "NATIONAL" },
    { date: "2025-03-30", name: "Ugadi / Gudi Padwa", type: "REGIONAL" },
    { date: "2025-03-31", name: "Eid-ul-Fitr / Ramzan", type: "NATIONAL" },
    // April
    { date: "2025-04-06", name: "Ram Navami", type: "NATIONAL" },
    { date: "2025-04-10", name: "Mahavir Jayanti", type: "NATIONAL" },
    { date: "2025-04-14", name: "Dr. B.R. Ambedkar Jayanti", type: "NATIONAL" },
    { date: "2025-04-18", name: "Good Friday", type: "NATIONAL" },
    { date: "2025-04-20", name: "Easter", type: "OPTIONAL" },
    // May
    { date: "2025-05-01", name: "May Day / Labour Day", type: "NATIONAL" },
    { date: "2025-05-12", name: "Buddha Purnima", type: "NATIONAL" },
    // June
    { date: "2025-06-02", name: "Telangana Formation Day", type: "REGIONAL" },
    { date: "2025-06-07", name: "Bakrid / Eid al-Adha", type: "NATIONAL" },
    // July
    { date: "2025-07-06", name: "Muharram", type: "NATIONAL" },
    { date: "2025-07-10", name: "Guru Purnima", type: "OPTIONAL" },
    { date: "2025-07-20", name: "Bonalu", type: "REGIONAL" },
    // August
    { date: "2025-08-08", name: "Varalakshmi Vratham", type: "REGIONAL" },
    { date: "2025-08-09", name: "Raksha Bandhan", type: "REGIONAL" },
    { date: "2025-08-15", name: "Independence Day", type: "NATIONAL" },
    { date: "2025-08-16", name: "Janmashtami", type: "NATIONAL" },
    { date: "2025-08-27", name: "Ganesh Chaturthi", type: "NATIONAL" },
    // September
    { date: "2025-09-05", name: "Onam", type: "REGIONAL" },
    { date: "2025-09-05", name: "Milad-un-Nabi", type: "NATIONAL" },
    { date: "2025-09-22", name: "Bathukamma Starts", type: "REGIONAL" },
    { date: "2025-09-29", name: "Durga Puja / Maha Saptami", type: "REGIONAL" },
    { date: "2025-09-30", name: "Maha Ashtami", type: "REGIONAL" },
    // October
    { date: "2025-10-01", name: "Maha Navami / Ayudha Puja", type: "REGIONAL" },
    { date: "2025-10-02", name: "Gandhi Jayanti", type: "NATIONAL" },
    { date: "2025-10-02", name: "Dussehra / Vijayadashami", type: "NATIONAL" },
    { date: "2025-10-20", name: "Diwali / Deepavali", type: "NATIONAL" },
    { date: "2025-10-21", name: "Govardhan Puja", type: "OPTIONAL" },
    { date: "2025-10-22", name: "Bhai Dooj", type: "REGIONAL" },
    { date: "2025-10-28", name: "Chhath Puja", type: "REGIONAL" },
    // November
    { date: "2025-11-05", name: "Guru Nanak Jayanti", type: "NATIONAL" },
    // December
    { date: "2025-12-24", name: "Christmas Eve", type: "OPTIONAL" },
    { date: "2025-12-25", name: "Christmas", type: "NATIONAL" },
  ],

  2026: [
    // January
    { date: "2026-01-01", name: "New Year's Day", type: "OPTIONAL" },
    { date: "2026-01-14", name: "Makar Sankranti / Pongal", type: "NATIONAL" },
    { date: "2026-01-15", name: "Kanuma", type: "REGIONAL" },
    { date: "2026-01-23", name: "Basant Panchami", type: "REGIONAL" },
    { date: "2026-01-26", name: "Republic Day", type: "NATIONAL" },
    // February
    { date: "2026-02-15", name: "Maha Shivaratri", type: "NATIONAL" },
    { date: "2026-02-19", name: "Chhatrapati Shivaji Maharaj Jayanti", type: "OPTIONAL" },
    // March
    { date: "2026-03-03", name: "Holika Dahan", type: "OPTIONAL" },
    { date: "2026-03-04", name: "Holi", type: "NATIONAL" },
    { date: "2026-03-19", name: "Ugadi", type: "REGIONAL" },
    { date: "2026-03-21", name: "Eid-ul-Fitr / Ramzan", type: "NATIONAL" },
    { date: "2026-03-27", name: "Ram Navami", type: "NATIONAL" },
    { date: "2026-03-31", name: "Mahavir Jayanti", type: "NATIONAL" },
    // April
    { date: "2026-04-03", name: "Good Friday", type: "NATIONAL" },
    { date: "2026-04-05", name: "Easter", type: "OPTIONAL" },
    { date: "2026-04-14", name: "Dr. B.R. Ambedkar Jayanti", type: "NATIONAL" },
    // May
    { date: "2026-05-01", name: "May Day / Labour Day", type: "NATIONAL" },
    { date: "2026-05-27", name: "Bakrid / Eid al-Adha", type: "NATIONAL" },
    { date: "2026-05-31", name: "Buddha Purnima", type: "NATIONAL" },
    // June
    { date: "2026-06-02", name: "Telangana Formation Day", type: "REGIONAL" },
    { date: "2026-06-26", name: "Muharram", type: "NATIONAL" },
    // July
    { date: "2026-07-19", name: "Bonalu", type: "REGIONAL" },
    { date: "2026-07-29", name: "Guru Purnima", type: "OPTIONAL" },
    // August
    { date: "2026-08-15", name: "Independence Day", type: "NATIONAL" },
    { date: "2026-08-26", name: "Milad-un-Nabi", type: "NATIONAL" },
    { date: "2026-08-28", name: "Raksha Bandhan / Varalakshmi Vratham", type: "REGIONAL" },
    // September
    { date: "2026-09-04", name: "Janmashtami", type: "NATIONAL" },
    { date: "2026-09-14", name: "Ganesh Chaturthi", type: "NATIONAL" },
    { date: "2026-09-16", name: "Onam", type: "REGIONAL" },
    { date: "2026-09-24", name: "Anant Chaturdashi", type: "OPTIONAL" },
    // October
    { date: "2026-10-02", name: "Gandhi Jayanti", type: "NATIONAL" },
    { date: "2026-10-12", name: "Bathukamma Starts", type: "REGIONAL" },
    { date: "2026-10-17", name: "Navratri / Durga Puja", type: "REGIONAL" },
    { date: "2026-10-18", name: "Maha Ashtami", type: "REGIONAL" },
    { date: "2026-10-19", name: "Maha Navami / Ayudha Puja", type: "REGIONAL" },
    { date: "2026-10-20", name: "Dussehra", type: "NATIONAL" },
    // November
    { date: "2026-11-08", name: "Diwali", type: "NATIONAL" },
    { date: "2026-11-09", name: "Govardhan Puja", type: "OPTIONAL" },
    { date: "2026-11-10", name: "Bhai Dooj", type: "REGIONAL" },
    { date: "2026-11-15", name: "Chhath Puja", type: "REGIONAL" },
    { date: "2026-11-24", name: "Guru Nanak Jayanti", type: "NATIONAL" },
    // December
    { date: "2026-12-24", name: "Christmas Eve", type: "OPTIONAL" },
    { date: "2026-12-25", name: "Christmas", type: "NATIONAL" },
    { date: "2026-12-31", name: "New Year's Eve", type: "OPTIONAL" },
  ],

  2027: [
    // January
    { date: "2027-01-01", name: "New Year's Day", type: "OPTIONAL" },
    { date: "2027-01-14", name: "Makar Sankranti / Pongal", type: "NATIONAL" },
    { date: "2027-01-15", name: "Kanuma", type: "REGIONAL" },
    { date: "2027-01-26", name: "Republic Day", type: "NATIONAL" },
    // February
    { date: "2027-02-11", name: "Basant Panchami", type: "REGIONAL" },
    { date: "2027-02-19", name: "Chhatrapati Shivaji Maharaj Jayanti", type: "OPTIONAL" },
    // March
    { date: "2027-03-06", name: "Maha Shivaratri", type: "NATIONAL" },
    { date: "2027-03-10", name: "Eid-ul-Fitr / Ramzan", type: "NATIONAL" },
    { date: "2027-03-22", name: "Holika Dahan", type: "OPTIONAL" },
    { date: "2027-03-23", name: "Holi", type: "NATIONAL" },
    { date: "2027-03-26", name: "Good Friday", type: "NATIONAL" },
    { date: "2027-03-28", name: "Easter", type: "OPTIONAL" },
    // April
    { date: "2027-04-07", name: "Ugadi / Gudi Padwa", type: "REGIONAL" },
    { date: "2027-04-14", name: "Dr. B.R. Ambedkar Jayanti", type: "NATIONAL" },
    { date: "2027-04-15", name: "Ram Navami", type: "NATIONAL" },
    { date: "2027-04-19", name: "Mahavir Jayanti", type: "NATIONAL" },
    // May
    { date: "2027-05-01", name: "May Day / Labour Day", type: "NATIONAL" },
    { date: "2027-05-17", name: "Bakrid / Eid al-Adha", type: "NATIONAL" },
    { date: "2027-05-20", name: "Buddha Purnima", type: "NATIONAL" },
    // June
    { date: "2027-06-02", name: "Telangana Formation Day", type: "REGIONAL" },
    { date: "2027-06-16", name: "Muharram", type: "NATIONAL" },
    // July
    { date: "2027-07-18", name: "Guru Purnima", type: "OPTIONAL" },
    { date: "2027-07-25", name: "Bonalu", type: "REGIONAL" },
    // August
    { date: "2027-08-15", name: "Independence Day", type: "NATIONAL" },
    { date: "2027-08-16", name: "Milad-un-Nabi", type: "NATIONAL" },
    { date: "2027-08-17", name: "Raksha Bandhan", type: "REGIONAL" },
    { date: "2027-08-25", name: "Janmashtami", type: "NATIONAL" },
    // September
    { date: "2027-09-04", name: "Ganesh Chaturthi", type: "NATIONAL" },
    { date: "2027-09-13", name: "Onam", type: "REGIONAL" },
    // October
    { date: "2027-10-02", name: "Gandhi Jayanti", type: "NATIONAL" },
    { date: "2027-10-06", name: "Durga Puja / Maha Saptami", type: "REGIONAL" },
    { date: "2027-10-07", name: "Maha Ashtami", type: "REGIONAL" },
    { date: "2027-10-08", name: "Maha Navami / Ayudha Puja", type: "REGIONAL" },
    { date: "2027-10-09", name: "Dussehra / Vijayadashami", type: "NATIONAL" },
    { date: "2027-10-29", name: "Diwali / Deepavali", type: "NATIONAL" },
    { date: "2027-10-31", name: "Bhai Dooj", type: "REGIONAL" },
    // November
    { date: "2027-11-04", name: "Chhath Puja", type: "REGIONAL" },
    { date: "2027-11-14", name: "Guru Nanak Jayanti", type: "NATIONAL" },
    // December
    { date: "2027-12-24", name: "Christmas Eve", type: "OPTIONAL" },
    { date: "2027-12-25", name: "Christmas", type: "NATIONAL" },
  ],

  2028: [
    // January
    { date: "2028-01-01", name: "New Year's Day", type: "OPTIONAL" },
    { date: "2028-01-14", name: "Makar Sankranti / Pongal", type: "NATIONAL" },
    { date: "2028-01-15", name: "Kanuma", type: "REGIONAL" },
    { date: "2028-01-26", name: "Republic Day", type: "NATIONAL" },
    // February
    { date: "2028-02-01", name: "Basant Panchami", type: "REGIONAL" },
    { date: "2028-02-19", name: "Chhatrapati Shivaji Maharaj Jayanti", type: "OPTIONAL" },
    { date: "2028-02-24", name: "Maha Shivaratri", type: "NATIONAL" },
    { date: "2028-02-28", name: "Eid-ul-Fitr / Ramzan", type: "NATIONAL" },
    // March
    { date: "2028-03-11", name: "Holika Dahan", type: "OPTIONAL" },
    { date: "2028-03-12", name: "Holi", type: "NATIONAL" },
    { date: "2028-03-27", name: "Ugadi / Gudi Padwa", type: "REGIONAL" },
    // April
    { date: "2028-04-03", name: "Ram Navami", type: "NATIONAL" },
    { date: "2028-04-08", name: "Mahavir Jayanti", type: "NATIONAL" },
    { date: "2028-04-14", name: "Good Friday", type: "NATIONAL" },
    { date: "2028-04-14", name: "Dr. B.R. Ambedkar Jayanti", type: "NATIONAL" },
    { date: "2028-04-16", name: "Easter", type: "OPTIONAL" },
    // May
    { date: "2028-05-01", name: "May Day / Labour Day", type: "NATIONAL" },
    { date: "2028-05-09", name: "Buddha Purnima", type: "NATIONAL" },
    // June
    { date: "2028-06-02", name: "Telangana Formation Day", type: "REGIONAL" },
    { date: "2028-06-05", name: "Bakrid / Eid al-Adha", type: "NATIONAL" },
    // July
    { date: "2028-07-04", name: "Muharram", type: "NATIONAL" },
    { date: "2028-07-07", name: "Guru Purnima", type: "OPTIONAL" },
    { date: "2028-07-16", name: "Bonalu", type: "REGIONAL" },
    // August
    { date: "2028-08-04", name: "Varalakshmi Vratham", type: "REGIONAL" },
    { date: "2028-08-05", name: "Raksha Bandhan", type: "REGIONAL" },
    { date: "2028-08-13", name: "Janmashtami", type: "NATIONAL" },
    { date: "2028-08-15", name: "Independence Day", type: "NATIONAL" },
    { date: "2028-08-24", name: "Ganesh Chaturthi", type: "NATIONAL" },
    // September
    { date: "2028-09-02", name: "Onam", type: "REGIONAL" },
    { date: "2028-09-04", name: "Milad-un-Nabi", type: "NATIONAL" },
    // October
    { date: "2028-10-02", name: "Gandhi Jayanti", type: "NATIONAL" },
    { date: "2028-10-17", name: "Diwali / Deepavali", type: "NATIONAL" },
    { date: "2028-10-19", name: "Bhai Dooj", type: "REGIONAL" },
    { date: "2028-10-24", name: "Chhath Puja", type: "REGIONAL" },
    // November
    { date: "2028-11-02", name: "Guru Nanak Jayanti", type: "NATIONAL" },
    // December
    { date: "2028-12-24", name: "Christmas Eve", type: "OPTIONAL" },
    { date: "2028-12-25", name: "Christmas", type: "NATIONAL" },
  ],
};

// Generic fixed-date national holidays for any arbitrary year
export function getFestivalsForYear(year: number): FestivalHoliday[] {
  if (FESTIVALS_BY_YEAR[year]) {
    return FESTIVALS_BY_YEAR[year];
  }

  // Fallback for years without full lunar astronomical tables
  return [
    { date: `${year}-01-01`, name: "New Year's Day", type: "OPTIONAL" },
    { date: `${year}-01-14`, name: "Makar Sankranti / Pongal", type: "NATIONAL" },
    { date: `${year}-01-15`, name: "Kanuma", type: "REGIONAL" },
    { date: `${year}-01-26`, name: "Republic Day", type: "NATIONAL" },
    { date: `${year}-04-14`, name: "Dr. B.R. Ambedkar Jayanti", type: "NATIONAL" },
    { date: `${year}-05-01`, name: "May Day / Labour Day", type: "NATIONAL" },
    { date: `${year}-06-02`, name: "Telangana Formation Day", type: "REGIONAL" },
    { date: `${year}-08-15`, name: "Independence Day", type: "NATIONAL" },
    { date: `${year}-10-02`, name: "Gandhi Jayanti", type: "NATIONAL" },
    { date: `${year}-12-25`, name: "Christmas", type: "NATIONAL" },
  ];
}

export interface CalendarItemLike {
  id: string;
  title: string;
  kind: "MEETING" | "DEADLINE" | "GOLIVE" | "RENEWAL" | "LEAVE" | "HOLIDAY" | "TODO";
  date: string;
  time?: string;
}

export function getFestivalCalendarItems(year: number): CalendarItemLike[] {
  const festivals = getFestivalsForYear(year);
  return festivals.map((f) => ({
    id: `hol-${f.date}-${f.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    title: f.name,
    kind: "HOLIDAY",
    date: f.date,
    time: "All Day",
  }));
}
