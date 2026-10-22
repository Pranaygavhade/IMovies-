const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const TIMEZONE = process.env.TZ || 'Asia/Kolkata';

// Set default timezone for dayjs
dayjs.tz.setDefault(TIMEZONE);

/**
 * Returns current dayjs instance in Asia/Kolkata
 */
const getKolkataNow = () => {
  return dayjs().tz(TIMEZONE);
};

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata
 */
const getTodayKolkata = () => {
  return getKolkataNow().format('YYYY-MM-DD');
};

/**
 * Returns array of dates for the next N days (starting today) in YYYY-MM-DD
 */
const getNextNDaysKolkata = (days = 7) => {
  const dates = [];
  const start = getKolkataNow();
  for (let i = 0; i < days; i++) {
    dates.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

/**
 * Check if a show's start time has already passed today
 * @param {string} showDate YYYY-MM-DD
 * @param {string} showTime e.g. "10:30", "10:30 AM", "14:00"
 */
const isShowPast = (showDate, showTime) => {
  const now = getKolkataNow();
  const todayStr = now.format('YYYY-MM-DD');

  if (showDate < todayStr) return true;
  if (showDate > todayStr) return false;

  // showDate === today: parse showTime
  const cleanTime = showTime.trim();
  let showDateTime;

  if (/am|pm/i.test(cleanTime)) {
    showDateTime = dayjs.tz(`${showDate} ${cleanTime}`, 'YYYY-MM-DD h:mm A', TIMEZONE);
  } else {
    showDateTime = dayjs.tz(`${showDate} ${cleanTime}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
  }

  return showDateTime.isValid() && showDateTime.isBefore(now);
};

/**
 * Compute endTime in HH:mm or h:mm A from startTime and runtime + cleanup
 */
const computeEndTime = (startTime, runtimeMinutes, bufferMinutes = 15) => {
  const totalMinutes = (runtimeMinutes || 120) + bufferMinutes;
  const cleanTime = startTime.trim();
  let startObj;

  if (/am|pm/i.test(cleanTime)) {
    startObj = dayjs(`2026-10-22 ${cleanTime}`, 'YYYY-MM-DD h:mm A');
    return startObj.add(totalMinutes, 'minute').format('hh:mm A');
  } else {
    startObj = dayjs(`2026-10-22 ${cleanTime}`, 'YYYY-MM-DD HH:mm');
    return startObj.add(totalMinutes, 'minute').format('HH:mm');
  }
};

module.exports = {
  dayjs,
  TIMEZONE,
  getKolkataNow,
  getTodayKolkata,
  getNextNDaysKolkata,
  isShowPast,
  computeEndTime,
};
