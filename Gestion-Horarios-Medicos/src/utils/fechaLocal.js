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

/**
 * Convierte una fecha local (Date) a ISO UTC sin perder hora local.
 * Ej: 2025-10-20 08:00 CLT -> '2025-10-20T11:00:00.000Z'
 */
export function toUtcISO(dateLocal) {
  // Un Date ya conoce su offset; toISOString() produce el UTC correcto para ese instante
  return new Date(dateLocal).toISOString();
}

/**
 * Construye una Date local a partir de componentes locales.
 * y=2025, m=1-12, d=1-31, H=0-23
 */
export function buildLocalDate(y, m, d, H = 0, M = 0, S = 0) {
  return new Date(y, m - 1, d, H, M, S);
}

/**
 * Dado el lunes local (Date) retorna inicio y fin de semana en ISO UTC.
 * start: lunes 00:00 CLT -> ISO UTC, end: lunes siguiente 00:00 CLT -> ISO UTC.
 */
export function weekRangeUtcISO(weekStartLocalDate) {
  const startLocal = new Date(
    weekStartLocalDate.getFullYear(),
    weekStartLocalDate.getMonth(),
    weekStartLocalDate.getDate(),
    0,
    0,
    0,
  );
  const endLocal = new Date(startLocal);
  endLocal.setDate(endLocal.getDate() + 7);
  // Sin restas manuales. Simplemente emitimos los UTC de esos midnight locales.
  return { startUtcISO: toUtcISO(startLocal), endUtcISO: toUtcISO(endLocal) };
}

/**
 * Normaliza una fecha (Date) al lunes de esa semana, a las 00:00 local.
 */
export function normalizeToMondayLocal(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + delta);
  return d;
}
