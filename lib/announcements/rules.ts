export type AnnouncementTargetRole =
  | "all"
  | "admins"
  | "drivers"
  | "technicians";

export type AnnouncementAudienceProfile = {
  is_admin?: boolean | null;
  is_technician?: boolean | null;
};

export type AnnouncementLike = {
  target_role?: string | null;
};

const TARGET_ROLE_ALIASES: Record<string, AnnouncementTargetRole> = {
  admin: "admins",
  admins: "admins",
  all: "all",
  driver: "drivers",
  drivers: "drivers",
  technician: "technicians",
  technicians: "technicians",
};

export function normalizeAnnouncementTargetRole(
  value: unknown,
): AnnouncementTargetRole {
  if (typeof value !== "string") return "all";
  return TARGET_ROLE_ALIASES[value.trim().toLowerCase()] ?? "all";
}

export function announcementRolesForProfile(
  profile: AnnouncementAudienceProfile,
) {
  const roles: AnnouncementTargetRole[] = ["all"];
  if (profile.is_admin) roles.push("admins");
  if (profile.is_technician) roles.push("technicians");
  if (!profile.is_admin && !profile.is_technician) roles.push("drivers");
  return roles;
}

export function announcementIsVisibleToProfile(
  announcement: AnnouncementLike,
  profile: AnnouncementAudienceProfile,
) {
  const roles = announcementRolesForProfile(profile);
  return roles.includes(normalizeAnnouncementTargetRole(announcement.target_role));
}
