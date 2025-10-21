const cleanRut = (raw = "") => raw.replace(/[^0-9kK]/g, "").toUpperCase();

// formatea 20952457 -> "20.952.457"
export function formatRutForDisplay(digits) {
  if (!digits) return "";
  const d = String(digits).replace(/[^0-9kK]/g, "");
  if (!d) return "";

  const parts = [];
  let body = d;
  while (body.length > 3) {
    parts.unshift(body.slice(-3));
    body = body.slice(0, -3);
  }
  if (body) {
    parts.unshift(body);
  }
  const formattedBody = parts.join(".");
  return formattedBody;
}

export function cleanRutValue(value) {
  if (!value) return "";
  return cleanRut(value);
}

export const formatRut = (raw = "") => {
  const cleaned = cleanRut(raw);
  if (!cleaned) return "";
  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1);
  if (!body) return verifier;
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${verifier}`;
};

export const isValidRut = (raw = "") => {
  const cleaned = cleanRut(raw);
  if (cleaned.length < 2) return false;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  let multiplier = 2;
  let sum = 0;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expected = 11 - (sum % 11);
  const normalized = expected === 11 ? "0" : expected === 10 ? "K" : `${expected}`;
  return normalized === dv.toUpperCase();
};
