import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const ZONA = "America/Santiago";

// ISO local sin “Z”
export function fechaLocalISO(d = undefined) {
  const x = d ? dayjs(d) : dayjs();
  return x.tz(ZONA).format("YYYY-MM-DDTHH:mm:ss.SSS");
}

// Solo fecha local
export function fechaLocalYYYYMMDD(d = undefined) {
  const x = d ? dayjs(d) : dayjs();
  return x.tz(ZONA).format("YYYY-MM-DD");
}

export const ZONA_HORARIA_CHILE = ZONA;
