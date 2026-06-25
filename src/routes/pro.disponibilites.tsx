import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app/AppLayout";
import { AvailabilityHeader } from "@/components/pro/availability/AvailabilityHeader";
import { LocationsSection } from "@/components/pro/availability/LocationsSection";
import { LocationEditor } from "@/components/pro/availability/LocationEditor";
import { WeeklyPlanner } from "@/components/pro/availability/WeeklyPlanner";
import { RightSidebar } from "@/components/pro/availability/RightSidebar";
import { AddActivityBlockModal } from "@/components/pro/availability/AddActivityBlockModal";

import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import {
  useProLocations,
  type ProLocation,
} from "@/hooks/use-pro-locations";
import {
  useProActivityBlocks,
  type ActivityBlock,
  type ActivityBlockDraft,
} from "@/hooks/use-pro-activity-blocks";

export const Route = createFileRoute("/pro/disponibilites")({
  component: DisponibilitesPage,
});

function DisponibilitesPage() {
  const { pro, loading, error } = useCurrentUserProfile();
  const proId = pro?.id ?? null;

  const { locations, createLocation, updateLocation } =
    useProLocations(proId);

  const {
    blocks,
    saving: savingBlock,
    createBlock,
    updateBlock,
    disableBlock,
  } = useProActivityBlocks(proId);

  const [selectedLocation, setSelectedLocation] = useState<string>();
  const [draftLocation, setDraftLocation] = useState<ProLocation | undefined>();
  const [savingLocation, setSavingLocation] = useState(false);

  const [selectedDayForBlock, setSelectedDayForBlock] =
    useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<ActivityBlock | null>(null);

  useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      setSelectedLocation(locations[0].id);
    }
  }, [locations, selectedLocation]);

  useEffect(() => {
    const currentLocation = locations.find(
      (location) => location.id === selectedLocation,
    );

    setDraftLocation(currentLocation);
  }, [locations, selectedLocation]);

  async function handleAddLocation() {
    if (!proId) return;

    try {
      await createLocation({
        name: "Nouveau lieu",
        type: "home",
        address: "",
        city: "",
        postal_code: "",
        is_private: true,
        is_primary: false,
        active: true,
        travel_radius_km: 20,
        travel_time_max_min: 30,
        travel_fee_type: "per_km",
        travel_fee_free_until_km: 10,
        travel_fee_per_km: 0.8,
        travel_fee_fixed: 0,
      });

      toast.success("Lieu ajouté.");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible d’ajouter le lieu.",
      );
    }
  }

  function handleChangeLocation(values: Partial<ProLocation>) {
    setDraftLocation((current) => {
      if (!current) return current;

      return {
        ...current,
        ...values,
      };
    });
  }

  async function handleSaveLocation() {
    if (!draftLocation) return;

    try {
      setSavingLocation(true);

      await updateLocation(draftLocation.id, {
        name: draftLocation.name,
        type: draftLocation.type,
        address: draftLocation.address,
        city: draftLocation.city,
        postal_code: draftLocation.postal_code,
        is_private: draftLocation.is_private,
        is_primary: draftLocation.is_primary,
        active: draftLocation.active,
        travel_radius_km: draftLocation.travel_radius_km,
        travel_time_max_min: draftLocation.travel_time_max_min,
        travel_fee_type: draftLocation.travel_fee_type,
        travel_fee_free_until_km: draftLocation.travel_fee_free_until_km,
        travel_fee_per_km: draftLocation.travel_fee_per_km,
        travel_fee_fixed: draftLocation.travel_fee_fixed,
      });

      toast.success("Lieu enregistré.");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer le lieu.",
      );
    } finally {
      setSavingLocation(false);
    }
  }

  function handleOpenCreateBlock(dayOfWeek: number) {
    setEditingBlock(null);
    setSelectedDayForBlock(dayOfWeek);
  }

  function handleOpenEditBlock(block: ActivityBlock) {
    setEditingBlock(block);
    setSelectedDayForBlock(block.dayOfWeek);
  }

  function handleCloseBlockModal() {
    setEditingBlock(null);
    setSelectedDayForBlock(null);
  }

  async function handleSubmitBlock(draft: ActivityBlockDraft) {
    try {
      if (editingBlock) {
        await updateBlock(editingBlock.id, draft);
        toast.success("Bloc modifié.");
      } else {
        await createBlock(draft);
        toast.success("Bloc d’activité ajouté.");
      }

      handleCloseBlockModal();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer le bloc.",
      );
    }
  }

  async function handleDeleteBlock(id: string) {
    try {
      await disableBlock(id);
      toast.success("Bloc supprimé.");

      if (editingBlock?.id === id) {
        handleCloseBlockModal();
      }
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible de supprimer le bloc.",
      );
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-10">Chargement...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-10 text-red-600">{error}</div>
      </AppLayout>
    );
  }

  if (!pro) {
    return (
      <AppLayout>
        <div className="p-10">Aucun profil professionnel trouvé.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl p-8 space-y-8">
        <AvailabilityHeader />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-8">
            <LocationsSection
              locations={locations}
              selectedId={selectedLocation}
              onSelect={setSelectedLocation}
              onAdd={handleAddLocation}
            />

            <LocationEditor
              location={draftLocation}
              saving={savingLocation}
              onChange={handleChangeLocation}
              onSave={handleSaveLocation}
            />

            <WeeklyPlanner
              locations={locations}
              blocks={blocks}
              onAddBlock={handleOpenCreateBlock}
              onEditBlock={handleOpenEditBlock}
              onDeleteBlock={handleDeleteBlock}
            />
          </div>

          <RightSidebar locations={locations} blocks={blocks} />
        </div>
      </div>

      <AddActivityBlockModal
        open={selectedDayForBlock !== null}
        dayOfWeek={selectedDayForBlock}
        locations={locations}
        block={editingBlock}
        saving={savingBlock}
        onClose={handleCloseBlockModal}
        onSubmit={handleSubmitBlock}
      />
    </AppLayout>
  );
}