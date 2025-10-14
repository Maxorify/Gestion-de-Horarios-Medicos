// src/utils/search.js
import React from "react";

// Normaliza: minúsculas, sin tildes, sin puntos/guiones (útil p/ RUT)
export function normalize(str = "") {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-]/g, "")
    .toLowerCase()
    .trim();
}

// Divide la query en tokens normalizados
export function tokenize(query = "") {
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

// Verifica que todos los tokens estén presentes en el texto
export function matchAllTokens(haystack, tokens) {
  const norm = normalize(haystack);
  return tokens.every(t => norm.includes(t));
}

// Devuelve un renderer que resalta los tokens en un texto con <mark>
export function highlightRenderer(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return (text) => text ?? "";

  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const rx = new RegExp("(" + escaped.join("|") + ")", "ig");

  return (text = "") => {
    const raw = text.toString();
    // prueba match con y sin formato (p.ej. RUT sin puntos/guion)
    const augmented = [raw, raw.replace(/[.\-]/g, "")].join(" ");
    if (!rx.test(augmented)) {
      rx.lastIndex = 0;
      return raw;
    }

    rx.lastIndex = 0;
    const splitter = new RegExp("(" + escaped.join("|") + ")", "ig");
    const parts = raw.split(splitter);

    if (parts.length === 1) {
      return React.createElement(
        "mark",
        {
          style: {
            backgroundColor: "rgba(67,119,254,0.25)",
            padding: "0 2px",
            borderRadius: 4,
          },
        },
        raw
      );
    }

    return parts.map((p, i) => {
      const sanitized = p.replace(/[.\-]/g, "");
      rx.lastIndex = 0;
      const isMatch = rx.test(p) || rx.test(sanitized);
      rx.lastIndex = 0;
      return isMatch
        ? React.createElement(
            "mark",
            {
              key: i,
              style: {
                backgroundColor: "rgba(67,119,254,0.25)",
                padding: "0 2px",
                borderRadius: 4,
              },
            },
            p
          )
        : React.createElement("span", { key: i }, p);
    });
  };
}
