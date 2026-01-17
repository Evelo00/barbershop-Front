// components/bookingDateRange.ts
export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfNextWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  return endOfDay(end);
}

export function getBookingRange(baseDate = new Date()) {
  const today = startOfDay(baseDate);

  return {
    startAllowed: today,
    endAllowed: endOfNextWeek(today),
  };
}

export function isDateAllowed(date: Date, baseDate = new Date()) {
  const { startAllowed, endAllowed } = getBookingRange(baseDate);
  return date >= startAllowed && date <= endAllowed;
}