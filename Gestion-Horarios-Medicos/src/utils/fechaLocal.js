import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

const TIMEZONE = "America/Santiago";
export const ZONA_HORARIA_CHILE = TIMEZONE;

dayjs.extend(utc);
dayjs.extend(timezone);

function toDayjs(value) {
  if (value && typeof value === "object" && typeof value.isValid === "function" && typeof value.add === "function") {
    return value;
  }
  if (value instanceof Date) {
    return dayjs(value);
  }
  if (typeof value === "number" || typeof value === "string") {
    return dayjs(value);
  }
  return dayjs();
}

export function fechaLocalISO(value) {
  const base = toDayjs(value);
  return base.tz(TIMEZONE).format("YYYY-MM-DDTHH:mm:ss.SSS");
}

export function fechaLocalYYYYMMDD(value) {
  const base = toDayjs(value);
  return base.tz(TIMEZONE).format("YYYY-MM-DD");
}
