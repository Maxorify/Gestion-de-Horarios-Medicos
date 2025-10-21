const cleanRut = (raw = "") => raw.replace(/[^0-9kK]/g, "").toUpperCase();

// formatea 20952457 -> "20.952.457" y al agregar un dígito verificador -> "20.952.457-3"
export function formatRutForDisplay(value) {
  if (!value) return "";
  const cleaned = cleanRut(value);
  if (!cleaned) return "";

  const shouldShowDv = cleaned.length > 8 || /[kK]$/.test(cleaned);
  const body = shouldShowDv ? cleaned.slice(0, -1) : cleaned;
  const dv = shouldShowDv ? cleaned.slice(-1) : "";

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (!dv) {
    return formattedBody;
  }

  return `${formattedBody}-${dv}`;
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
