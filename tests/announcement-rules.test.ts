import assert from "node:assert/strict";
import test from "node:test";

import {
  announcementIsVisibleToProfile,
  announcementRolesForProfile,
  normalizeAnnouncementTargetRole,
} from "../lib/announcements/rules";

test("announcement target roles normalize aliases safely", () => {
  assert.equal(normalizeAnnouncementTargetRole("admin"), "admins");
  assert.equal(normalizeAnnouncementTargetRole(" Admins "), "admins");
  assert.equal(normalizeAnnouncementTargetRole("driver"), "drivers");
  assert.equal(normalizeAnnouncementTargetRole("technician"), "technicians");
  assert.equal(normalizeAnnouncementTargetRole("unknown"), "all");
  assert.equal(normalizeAnnouncementTargetRole(null), "all");
});

test("admins see all-user and admin-only announcements", () => {
  const admin = { is_admin: true, is_technician: false };
  assert.deepEqual(announcementRolesForProfile(admin), ["all", "admins"]);
  assert.equal(
    announcementIsVisibleToProfile({ target_role: "admins" }, admin),
    true,
  );
  assert.equal(
    announcementIsVisibleToProfile({ target_role: "drivers" }, admin),
    false,
  );
});

test("drivers see all-user and driver-only announcements", () => {
  const driver = { is_admin: false, is_technician: false };
  assert.deepEqual(announcementRolesForProfile(driver), ["all", "drivers"]);
  assert.equal(
    announcementIsVisibleToProfile({ target_role: "drivers" }, driver),
    true,
  );
  assert.equal(
    announcementIsVisibleToProfile({ target_role: "admins" }, driver),
    false,
  );
});

test("technicians see all-user and technician-only announcements", () => {
  const technician = { is_admin: false, is_technician: true };
  assert.deepEqual(announcementRolesForProfile(technician), [
    "all",
    "technicians",
  ]);
  assert.equal(
    announcementIsVisibleToProfile({ target_role: "technicians" }, technician),
    true,
  );
  assert.equal(
    announcementIsVisibleToProfile({ target_role: "drivers" }, technician),
    false,
  );
});
