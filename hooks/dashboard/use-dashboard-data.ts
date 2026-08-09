"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_PARKING_LEVELS,
  SAFETY_MESSAGES,
  type AnnouncementRecord,
  type DashboardVehicle,
  type DriveoutRecord,
  type ParkingLevelConfig,
  type SafetyMessageRecord,
  type VehicleUnitOption,
} from "@/lib/dashboard/dashboard-data";

type FacilityOption = { code: string; name: string };

type UseDashboardDataOptions = {
  activeFacility: string;
  selectedLevel: string;
  checkInLevel: string;
  setSelectedLevel: (level: string) => void;
  setCheckInLevel: (level: string) => void;
  triggerToast: (message: string) => void;
};

export function useDashboardData({
  activeFacility,
  selectedLevel,
  checkInLevel,
  setSelectedLevel,
  setCheckInLevel,
  triggerToast,
}: UseDashboardDataOptions) {
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [parkingLevels, setParkingLevels] = useState<ParkingLevelConfig[]>(
    DEFAULT_PARKING_LEVELS,
  );
  const [isLoadingParkingConfig, setIsLoadingParkingConfig] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [safetyMessages, setSafetyMessages] = useState<SafetyMessageRecord[]>(
    [],
  );
  const [safetyIndex, setSafetyIndex] = useState(0);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<DashboardVehicle[]>([]);
  const [driveoutRecords, setDriveoutRecords] = useState<DriveoutRecord[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<VehicleUnitOption[]>([]);

  const resetDashboardData = useCallback(() => {
    setVehicles([]);
    setRecentVehicles([]);
    setDriveoutRecords([]);
    setParkingLevels([]);
    setSafetyMessages([]);
    setAnnouncements([]);
    setVehicleUnits([]);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/vehicles?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (response.ok) {
        const data = (await response.json()) as {
          vehicles?: DashboardVehicle[];
        };
        setVehicles(data.vehicles || []);
        setRecentVehicles((data.vehicles || []).slice(0, 4));
      }
    } catch (err) {
      console.error("Failed to load dashboard vehicles:", err);
      triggerToast("Could not load vehicle data");
    }
  }, [activeFacility, triggerToast]);

  const fetchDriveoutHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/history?check_out=notnull&facility=${encodeURIComponent(activeFacility)}`,
      );
      if (response.ok) {
        const data = (await response.json()) as {
          history?: DriveoutRecord[];
        };
        setDriveoutRecords(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load drive-out history:", err);
      triggerToast("Could not load drive-out history");
    }
  }, [activeFacility, triggerToast]);

  const fetchParkingConfig = useCallback(async () => {
    setIsLoadingParkingConfig(true);

    try {
      const response = await fetch(
        `/api/config/parking?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (!response.ok) throw new Error("Config request failed");

      const data = (await response.json()) as {
        config?: { levels?: ParkingLevelConfig[] } | null;
      };
      const levels = data.config?.levels?.length
        ? data.config.levels
        : activeFacility === "11FMD"
          ? DEFAULT_PARKING_LEVELS
          : [];

      setParkingLevels(levels);
      if (
        levels.length > 0 &&
        !levels.some((level) => level.id === selectedLevel)
      ) {
        setSelectedLevel(levels[0].id);
      }
      if (
        levels.length > 0 &&
        !levels.some((level) => level.id === checkInLevel)
      ) {
        setCheckInLevel(levels[0].id);
      }
    } catch (err) {
      console.error("Failed to load parking config:", err);
      triggerToast("Could not load parking layout config");
    } finally {
      setIsLoadingParkingConfig(false);
    }
  }, [
    activeFacility,
    checkInLevel,
    selectedLevel,
    setCheckInLevel,
    setSelectedLevel,
    triggerToast,
  ]);

  const fetchSafetyMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/safety-messages?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (!response.ok) throw new Error("Safety message request failed");

      const data = (await response.json()) as {
        messages?: SafetyMessageRecord[];
      };
      setSafetyMessages(data.messages || []);
      setSafetyIndex(0);
    } catch (err) {
      console.error("Failed to load safety messages:", err);
    }
  }, [activeFacility]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/announcements?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (!response.ok) throw new Error("Announcement request failed");

      const data = (await response.json()) as {
        announcements?: AnnouncementRecord[];
      };
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  }, [activeFacility]);

  const fetchFacilities = useCallback(async () => {
    try {
      const response = await fetch("/api/facilities");
      const data = response.ok
        ? ((await response.json()) as {
            facilities?: FacilityOption[];
            error?: string;
          })
        : null;

      if (data?.facilities) setFacilities(data.facilities);
      if (data?.error) {
        console.error("Failed to load facilities:", data.error);
        triggerToast(`Could not load depot list: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to load facilities:", err);
    }
  }, [triggerToast]);

  const fetchVehicleUnits = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/vehicle-units?facility=${encodeURIComponent(activeFacility)}`,
      );
      const data = response.ok
        ? ((await response.json()) as {
            vehicleUnits?: VehicleUnitOption[];
            error?: string;
          })
        : null;

      setVehicleUnits(data?.vehicleUnits || []);
      if (data?.error) {
        console.error("Failed to load vehicle units:", data.error);
      }
    } catch (err) {
      console.error("Failed to load vehicle units:", err);
      setVehicleUnits([]);
    }
  }, [activeFacility]);

  useEffect(() => {
    const activeCount =
      safetyMessages.length > 0
        ? safetyMessages.length
        : SAFETY_MESSAGES.length;

    if (activeCount <= 1) return;

    const interval = window.setInterval(() => {
      setSafetyIndex((index) => (index + 1) % activeCount);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [safetyMessages.length]);

  return {
    announcements,
    driveoutRecords,
    facilities,
    fetchAnnouncements,
    fetchDashboardData,
    fetchDriveoutHistory,
    fetchFacilities,
    fetchParkingConfig,
    fetchSafetyMessages,
    fetchVehicleUnits,
    isLoadingDashboard,
    isLoadingParkingConfig,
    parkingLevels,
    recentVehicles,
    resetDashboardData,
    safetyIndex,
    safetyMessages,
    setDriveoutRecords,
    setIsLoadingDashboard,
    setVehicleUnits,
    vehicleUnits,
    vehicles,
  };
}
