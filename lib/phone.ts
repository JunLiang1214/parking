import parsePhoneNumber, { type CountryCode } from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "SG";
export const PHONE_HELP_TEXT =
  "Enter a phone number with country code, or a local Singapore number.";
export const PHONE_PLACEHOLDER = "e.g. +65 9123 4567";
export const PHONE_ERROR =
  "Enter a valid phone number, e.g. +65 9123 4567 or +60 12 345 6789.";

function parseStrictPhoneNumber(
  value: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
) {
  return parsePhoneNumber(value.trim(), {
    defaultCountry,
    extract: false,
  });
}

export function normalizePhoneNumber(
  value: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
) {
  const phoneNumber = parseStrictPhoneNumber(value, defaultCountry);
  if (!phoneNumber?.isValid()) {
    throw new Error(PHONE_ERROR);
  }

  return phoneNumber.number;
}

export function formatPhoneDisplay(value?: string | null) {
  if (!value) return "";
  try {
    const phoneNumber = parseStrictPhoneNumber(value);
    return phoneNumber?.formatInternational() || value;
  } catch {
    return value;
  }
}

export function whatsappUrlForPhone(value?: string | null) {
  if (!value) return null;
  try {
    const phoneNumber = parseStrictPhoneNumber(value);
    const digits = phoneNumber?.number.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  } catch {
    const digits = value.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }
}
