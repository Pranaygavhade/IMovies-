import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const TIMEZONE = 'Asia/Kolkata';
dayjs.tz.setDefault(TIMEZONE);

export const getKolkataNow = () => {
  return dayjs().tz(TIMEZONE);
};

export const getTodayKolkata = () => {
  return getKolkataNow().format('YYYY-MM-DD');
};

/**
 * Returns formatted 7 days starting from today in Asia/Kolkata
 */
export const getNext7DaysKolkata = () => {
  const list = [];
  const start = getKolkataNow();
  for (let i = 0; i < 7; i++) {
    const d = start.add(i, 'day');
    list.push({
      dateStr: d.format('YYYY-MM-DD'),
      dayName: d.format('ddd'),
      dayNum: d.format('D'),
      monthName: d.format('MMM'),
      isToday: i === 0,
    });
  }
  return list;
};

/**
 * Check if a showtime on a given date has already passed current time in Asia/Kolkata
 */
export const isShowTimePassed = (showDate, showTime) => {
  const now = getKolkataNow();
  const todayStr = now.format('YYYY-MM-DD');

  if (showDate < todayStr) return true;
  if (showDate > todayStr) return false;

  // showDate is today: parse showTime
  const cleanTime = (showTime || '').trim();
  let showDateTime;

  if (/am|pm/i.test(cleanTime)) {
    showDateTime = dayjs.tz(`${showDate} ${cleanTime}`, 'YYYY-MM-DD h:mm A', TIMEZONE);
  } else {
    showDateTime = dayjs.tz(`${showDate} ${cleanTime}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
  }

  return showDateTime.isValid() && showDateTime.isBefore(now);
};

/**
 * Format currency in INR (₹)
 */
export const formatINR = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Calculate distance in km between two GPS coordinates using Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10;
};

export default dayjs;
