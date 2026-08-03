import assert from "node:assert/strict";
import test from "node:test";

import {
  formatPhoneDisplay,
  normalizePhoneNumber,
  PHONE_ERROR,
  whatsappUrlForPhone,
} from "../lib/phone";

test("normalizes local Singapore phone numbers to E.164", () => {
  assert.equal(normalizePhoneNumber("9123 4567"), "+6591234567");
  assert.equal(normalizePhoneNumber("+65 9123 4567"), "+6591234567");
});

test("keeps explicit international country codes", () => {
  assert.equal(normalizePhoneNumber("+60 12-345 6789"), "+60123456789");
});

test("formats phone display and WhatsApp URLs consistently", () => {
  assert.equal(formatPhoneDisplay("+6591234567"), "+65 9123 4567");
  assert.equal(whatsappUrlForPhone("+65 9123 4567"), "https://wa.me/6591234567");
  assert.equal(whatsappUrlForPhone("9123 4567"), "https://wa.me/6591234567");
});

test("rejects invalid phone numbers", () => {
  assert.throws(() => normalizePhoneNumber("123"), {
    message: PHONE_ERROR,
  });
});
