"use client";

import { useCallback, useState } from "react";

import {
  localInputToUtcIso,
  type LotReservationRecord,
} from "@/lib/dashboard/dashboard-data";

type ReserveLotPayload = {
  reserveDate: string;
  reserveTime: string;
  purpose: string;
};

type UseLotReservationsOptions = {
  activeFacility: string;
  selectedLevel: string;
  selectedLot: string | null;
  setIsSubmitting: (isSubmitting: boolean) => void;
  triggerToast: (message: string) => void;
  getErrorMessage: (error: unknown) => string;
};

export function useLotReservations({
  activeFacility,
  selectedLevel,
  selectedLot,
  setIsSubmitting,
  triggerToast,
  getErrorMessage,
}: UseLotReservationsOptions) {
  const [lotReservations, setLotReservations] = useState<LotReservationRecord[]>(
    [],
  );
  const [isReservingLot, setIsReservingLot] = useState(false);
  const [reservationFormError, setReservationFormError] = useState<string | null>(
    null,
  );
  const [freeingReservationId, setFreeingReservationId] = useState<string | null>(
    null,
  );

  const resetLotReservations = useCallback(() => {
    setLotReservations([]);
  }, []);

  const fetchLotReservations = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/lot-reservations?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (response.ok) {
        const data = (await response.json()) as {
          reservations?: LotReservationRecord[];
        };
        setLotReservations(data.reservations || []);
      }
    } catch (err) {
      console.error("Failed to load lot reservations:", err);
      setLotReservations([]);
    }
  }, [activeFacility]);

  const handleReserveLotSubmit = useCallback(
    async ({ reserveDate, reserveTime, purpose }: ReserveLotPayload) => {
      if (!selectedLevel || !selectedLot) return;

      setIsSubmitting(true);
      setReservationFormError(null);

      try {
        const reservedUntil = localInputToUtcIso(
          `${reserveDate}T${reserveTime}`,
        );
        if (!reservedUntil) {
          throw new Error("Reserve until date and time are required.");
        }

        const response = await fetch("/api/lot-reservations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            facility: activeFacility,
            level: selectedLevel,
            lot: selectedLot,
            reservedUntil,
            purpose,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Reserve lot failed");
        }

        setIsReservingLot(false);
        triggerToast(`Lot ${selectedLot} reserved`);
        await fetchLotReservations();
      } catch (err: unknown) {
        setReservationFormError(getErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      activeFacility,
      fetchLotReservations,
      getErrorMessage,
      selectedLevel,
      selectedLot,
      setIsSubmitting,
      triggerToast,
    ],
  );

  const handleFreeReservedLot = useCallback(
    async (reservation: LotReservationRecord) => {
      setFreeingReservationId(reservation.id);

      try {
        const response = await fetch(`/api/lot-reservations/${reservation.id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Free lot failed");
        }

        triggerToast(`Lot ${reservation.lot} freed`);
        await fetchLotReservations();
      } catch (err: unknown) {
        triggerToast(`Free lot failed: ${getErrorMessage(err)}`);
      } finally {
        setFreeingReservationId(null);
      }
    },
    [fetchLotReservations, getErrorMessage, triggerToast],
  );

  return {
    fetchLotReservations,
    freeingReservationId,
    handleFreeReservedLot,
    handleReserveLotSubmit,
    isReservingLot,
    lotReservations,
    reservationFormError,
    resetLotReservations,
    setIsReservingLot,
    setReservationFormError,
  };
}
