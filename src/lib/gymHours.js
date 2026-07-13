export const OPENING_HOURS = {
  0: null,
  1: [6.5, 22],
  2: [6.5, 22],
  3: [6.5, 22],
  4: [6.5, 22],
  5: [6.5, 22],
  6: [9, 13],
};

export function isOpenAt(date) {
  const day = date.getDay();
  const hours = OPENING_HOURS[day];
  if (!hours) return false;
  const current = date.getHours() + date.getMinutes() / 60;
  return current >= hours[0] && current < hours[1];
}

export const GYM_HOURS_TEXT = `Segunda a Sexta: 06:30 às 22:00\nSábado: 09:00 às 13:00\nDomingo: FECHADO`;