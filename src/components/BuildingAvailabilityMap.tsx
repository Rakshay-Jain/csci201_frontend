import { useMemo } from "react";
import type { Room } from "../types/room";

export type BuildingSummary = {
  buildingName: string;
  /** 0 = no capacity open, 1 = all rooms fully open */
  openScore: number;
  totalRooms: number;
  availableCount: number;
  partialCount: number;
  bookedCount: number;
};

function summarizeByBuilding(rooms: Room[]): BuildingSummary[] {
  const byName = new Map<string, Room[]>();
  for (const r of rooms) {
    const list = byName.get(r.buildingName) ?? [];
    list.push(r);
    byName.set(r.buildingName, list);
  }
  const rows: BuildingSummary[] = [];
  for (const [buildingName, list] of byName.entries()) {
    let availableCount = 0;
    let partialCount = 0;
    let bookedCount = 0;
    for (const r of list) {
      if (r.currentStatus === "available") availableCount += 1;
      else if (r.currentStatus === "partial") partialCount += 1;
      else bookedCount += 1;
    }
    const total = list.length;
    const openScore =
      total === 0 ? 0 : (availableCount + 0.5 * partialCount) / total;
    rows.push({
      buildingName,
      openScore,
      totalRooms: total,
      availableCount,
      partialCount,
      bookedCount,
    });
  }
  rows.sort((a, b) => a.buildingName.localeCompare(b.buildingName));
  return rows;
}

/** Greener when more rooms are open; redder when fewer are open. */
function availabilityColor(openScore: number): string {
  const s = Math.min(1, Math.max(0, openScore));
  const hue = 125 * s;
  const sat = 52;
  const light = 46 - 10 * (1 - s);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

type BuildingAvailabilityMapProps = {
  rooms: Room[];
  selectedBuildingName: string | null;
  onSelectBuilding: (buildingName: string) => void;
};

export function BuildingAvailabilityMap({
  rooms,
  selectedBuildingName,
  onSelectBuilding,
}: BuildingAvailabilityMapProps) {
  const buildings = useMemo(() => summarizeByBuilding(rooms), [rooms]);

  if (buildings.length === 0) {
    return (
      <p className="building-map__empty">No buildings match the current filters.</p>
    );
  }

  return (
    <div className="building-map">
      <p className="building-map__legend" id="building-map-legend">
        Each tile is a building. Greener means more study rooms are open right now; redder
        means fewer are open.
      </p>
      <ul className="building-grid" role="list" aria-describedby="building-map-legend">
        {buildings.map((b) => {
          const selected = b.buildingName === selectedBuildingName;
          const bg = availabilityColor(b.openScore);
          const label = `${b.buildingName}. ${b.availableCount} of ${b.totalRooms} rooms open.`;
          return (
            <li key={b.buildingName} className="building-grid__cell">
              <button
                type="button"
                className={`building-tile${selected ? " building-tile--selected" : ""}`}
                style={{ backgroundColor: bg }}
                onClick={() => onSelectBuilding(b.buildingName)}
                aria-pressed={selected}
                aria-label={label}
              >
                <span className="building-tile__name">{b.buildingName}</span>
                <span className="building-tile__stats" aria-hidden="true">
                  {b.availableCount}/{b.totalRooms} open
                  {b.partialCount > 0 ? ` · ${b.partialCount} partial` : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
