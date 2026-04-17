import { useEffect, useMemo, useRef, useState } from "react";
import { BuildingAvailabilityMap } from "../components/BuildingAvailabilityMap";
import { mockRooms } from "../data/mockRooms";
import type { Room, RoomFeature } from "../types/room";

const FEATURE_LABELS: Record<RoomFeature, string> = {
  whiteboard: "Whiteboard",
  monitors: "Monitors",
  outlets: "Power outlets",
  projector: "Projector",
  window: "Natural light",
  printer: "Printer",
};

const ALL_FEATURES = Object.keys(FEATURE_LABELS) as RoomFeature[];

function sortRooms(rooms: Room[], mode: "building" | "rating"): Room[] {
  const copy = [...rooms];
  if (mode === "rating") {
    copy.sort((a, b) => b.averageRating - a.averageRating);
    return copy;
  }
  copy.sort((a, b) => {
    const bld = a.buildingName.localeCompare(b.buildingName);
    if (bld !== 0) return bld;
    return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
  });
  return copy;
}

function statusLabel(s: Room["currentStatus"]): string {
  if (s === "available") return "Open";
  if (s === "booked") return "Booked";
  return "Partial";
}

function mockReviewsForRoom(room: Room): { author: string; body: string }[] {
  return [
    {
      author: "Alex M.",
      body: `Noise around ${room.ratingNoise.toFixed(1)}/5 — ${room.ratingNoise >= 4 ? "Usually quiet." : "Can get loud during peak hours."}`,
    },
    {
      author: "Jordan K.",
      body: `Cleanliness ${room.ratingCleanliness.toFixed(1)}/5. ${room.ratingCleanliness >= 4 ? "Well maintained." : "Could use more frequent cleaning."}`,
    },
  ];
}

type TimeSlot = { id: string; label: string };

/** Mock openings until the servlet returns real availability. */
function mockTimeSlotsForRoom(room: Room): TimeSlot[] {
  const n = 3 + (room.roomID.charCodeAt(room.roomID.length - 1) % 3);
  const labels = [
    "9:00–10:00 AM",
    "10:30–11:30 AM",
    "12:00–1:00 PM",
    "2:00–3:00 PM",
    "3:30–4:30 PM",
    "5:00–6:00 PM",
    "7:00–8:00 PM",
  ];
  return labels.slice(0, n).map((label, i) => ({ id: `${room.roomID}-slot-${i}`, label }));
}

function ScorePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="score-picker">
      <span className="score-picker__label" id={`${id}-label`}>
        {label}
      </span>
      <div className="score-picker__row" role="group" aria-labelledby={`${id}-label`}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            className={`score-picker__btn${value === n ? " score-picker__btn--active" : ""}`}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RoomBrowsePage() {
  const [sortMode, setSortMode] = useState<"building" | "rating">("building");
  const [featureFilters, setFeatureFilters] = useState<Set<RoomFeature>>(new Set());
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [reviewsOpenId, setReviewsOpenId] = useState<string | null>(null);
  /** When false, booking controls stay visible but are disabled and labeled for guests. */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jumpRoomId, setJumpRoomId] = useState<string>("");
  const [bookingPopoverRoomId, setBookingPopoverRoomId] = useState<string | null>(null);
  const [bookingSlotChoiceId, setBookingSlotChoiceId] = useState<string | null>(null);
  const [bookingDemoNotice, setBookingDemoNotice] = useState<string | null>(null);
  const bookPopoverRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [ratingPopoverRoomId, setRatingPopoverRoomId] = useState<string | null>(null);
  const [rateOverall, setRateOverall] = useState(0);
  const [rateNoise, setRateNoise] = useState(0);
  const [rateCleanliness, setRateCleanliness] = useState(0);
  const [rateReview, setRateReview] = useState("");
  const [rateDemoNotice, setRateDemoNotice] = useState<string | null>(null);
  const ratePopoverRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtered = useMemo(() => {
    let list = mockRooms.filter((r) => {
      for (const f of featureFilters) {
        if (!r.featureList.includes(f)) return false;
      }
      if (availableOnly && r.currentStatus !== "available") return false;
      return true;
    });
    list = sortRooms(list, sortMode);
    return list;
  }, [sortMode, featureFilters, availableOnly]);

  const selectedRoom = useMemo(
    () => filtered.find((r) => r.roomID === selectedRoomId) ?? null,
    [filtered, selectedRoomId],
  );

  const selectedBuildingName = selectedRoom?.buildingName ?? null;

  function resetRateForm() {
    setRateOverall(0);
    setRateNoise(0);
    setRateCleanliness(0);
    setRateReview("");
    setRateDemoNotice(null);
  }

  function closeBookingPopover() {
    setBookingPopoverRoomId(null);
    setBookingSlotChoiceId(null);
    setBookingDemoNotice(null);
  }

  function closeRatingPopover() {
    setRatingPopoverRoomId(null);
    resetRateForm();
  }

  useEffect(() => {
    if (bookingPopoverRoomId === null && ratingPopoverRoomId === null) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (bookingPopoverRoomId && bookPopoverRefs.current[bookingPopoverRoomId]?.contains(t)) {
        return;
      }
      if (ratingPopoverRoomId && ratePopoverRefs.current[ratingPopoverRoomId]?.contains(t)) {
        return;
      }
      setBookingPopoverRoomId(null);
      setBookingSlotChoiceId(null);
      setBookingDemoNotice(null);
      setRatingPopoverRoomId(null);
      setRateOverall(0);
      setRateNoise(0);
      setRateCleanliness(0);
      setRateReview("");
      setRateDemoNotice(null);
    };
    const timerId = window.setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("click", close);
    };
  }, [bookingPopoverRoomId, ratingPopoverRoomId]);

  useEffect(() => {
    if (bookingPopoverRoomId === null && ratingPopoverRoomId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBookingPopoverRoomId(null);
        setBookingSlotChoiceId(null);
        setBookingDemoNotice(null);
        setRatingPopoverRoomId(null);
        setRateOverall(0);
        setRateNoise(0);
        setRateCleanliness(0);
        setRateReview("");
        setRateDemoNotice(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bookingPopoverRoomId, ratingPopoverRoomId]);

  function toggleFeature(f: RoomFeature) {
    setFeatureFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  function onJumpSelect(value: string) {
    setJumpRoomId(value);
    if (!value) return;
    setSelectedRoomId(value);
    const el = document.getElementById(`room-row-${value}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function onSelectBuilding(buildingName: string) {
    const first = filtered.find((r) => r.buildingName === buildingName);
    if (!first) return;
    setSelectedRoomId(first.roomID);
    setJumpRoomId(first.roomID);
    document.getElementById(`room-row-${first.roomID}`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  return (
    <div className="browse-page">
      <div className="session-strip">
        <div className="session-strip__inner">
          <label className="session-strip__preview">
            <input
              type="checkbox"
              checked={isAuthenticated}
              onChange={(e) => setIsAuthenticated(e.target.checked)}
            />
            <span>Preview signed in</span>
          </label>
          <span id="session-a11y" className="sr-only" aria-live="polite">
            {isAuthenticated
              ? "Assistive technology preview: signed-in booking labels."
              : "Assistive technology preview: browsing as a guest."}
          </span>
          <p className="session-strip__hint">
            Layout stays the same; only sign-in state for screen readers and button availability
            changes here.
          </p>
          <a className="btn-link session-strip__login" href="#login">
            Log in
          </a>
        </div>
      </div>

      <header className="browse-header">
        <div className="browse-header__brand">
          <span className="browse-header__mark" aria-hidden="true" />
          <div>
            <h1 className="browse-header__title">Study room availability</h1>
            <p className="browse-header__subtitle">
              Real-time style view (mock data). Connects to your team API later.
            </p>
          </div>
        </div>
      </header>

      <div className="browse-toolbar">
        <div className="toolbar-row">
          <label className="field">
            <span className="field__label">Quick room</span>
            <select
              className="field__control"
              value={jumpRoomId}
              onChange={(e) => onJumpSelect(e.target.value)}
              aria-label="Jump to a study room in the list"
            >
              <option value="">Select a room…</option>
              {sortRooms(mockRooms, "building").map((r) => (
                <option key={r.roomID} value={r.roomID}>
                  {r.buildingName} · {r.roomNumber}
                  {r.currentStatus === "available" ? " — open" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Sort by</span>
            <select
              className="field__control"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as "building" | "rating")}
            >
              <option value="building">Building &amp; room number</option>
              <option value="rating">Room rating</option>
            </select>
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            <span>Only show open rooms</span>
          </label>
        </div>

        <fieldset className="feature-filters">
          <legend>Filter by resources</legend>
          <div className="feature-filters__chips">
            {ALL_FEATURES.map((f) => (
              <label key={f} className="chip">
                <input
                  type="checkbox"
                  checked={featureFilters.has(f)}
                  onChange={() => toggleFeature(f)}
                />
                <span>{FEATURE_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="browse-grid">
        <section className="panel panel--map" aria-labelledby="map-heading">
          <h2 id="map-heading" className="panel__title">
            Buildings
          </h2>
          <BuildingAvailabilityMap
            rooms={filtered}
            selectedBuildingName={selectedBuildingName}
            onSelectBuilding={onSelectBuilding}
          />
        </section>

        <section className="panel panel--list" aria-labelledby="list-heading">
          <div className="panel__head">
            <h2 id="list-heading" className="panel__title">
              Rooms ({filtered.length})
            </h2>
          </div>

          <ul className="room-list">
            {filtered.map((room) => {
              const bookDisabled =
                !isAuthenticated || room.currentStatus !== "available";
              const waitlistDisabled =
                !isAuthenticated || room.currentStatus === "available";

              const bookLabel = !isAuthenticated
                ? "Book room. Sign in required to complete a reservation."
                : room.currentStatus !== "available"
                  ? "Book room. This room is not available to reserve."
                  : "Book this room.";

              const waitlistLabel = !isAuthenticated
                ? "Join waitlist. Sign in required."
                : room.currentStatus === "available"
                  ? "Join waitlist. Only available when the room is fully booked."
                  : "Join the waitlist for this room.";

              const rateDisabled = !isAuthenticated;
              const rateLabel = !isAuthenticated
                ? "Rate room. Sign in required to submit a review."
                : "Rate this study room.";

              return (
                <li key={room.roomID} id={`room-row-${room.roomID}`} className="room-card">
                  <div className="room-card__top">
                    <div>
                      <h3 className="room-card__title">
                        {room.buildingName}{" "}
                        <span className="room-card__number">{room.roomNumber}</span>
                      </h3>
                      <p className="room-card__meta">
                        Capacity {room.capacity} ·{" "}
                        {room.featureList.map((f) => FEATURE_LABELS[f]).join(" · ")}
                      </p>
                    </div>
                    <span
                      className={`badge badge--${room.currentStatus}`}
                      title="Availability"
                    >
                      {statusLabel(room.currentStatus)}
                    </span>
                  </div>

                  <div className="room-card__ratings">
                    <div
                      className="stars"
                      aria-label={`Average rating ${room.averageRating} out of 5`}
                    >
                      <span className="stars__value">{room.averageRating.toFixed(1)}</span>
                      <span className="stars__out">/5</span>
                      <span className="stars__count">({room.reviewCount} reviews)</span>
                    </div>
                    <div className="sub-ratings">
                      <div>
                        <span className="sub-ratings__label">Noise</span>
                        <meter
                          min={0}
                          max={5}
                          low={2.5}
                          high={3.5}
                          optimum={5}
                          value={room.ratingNoise}
                        >
                          {room.ratingNoise}
                        </meter>
                        <span className="sub-ratings__num">{room.ratingNoise.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="sub-ratings__label">Clean</span>
                        <meter
                          min={0}
                          max={5}
                          low={2.5}
                          high={3.5}
                          optimum={5}
                          value={room.ratingCleanliness}
                        >
                          {room.ratingCleanliness}
                        </meter>
                        <span className="sub-ratings__num">
                          {room.ratingCleanliness.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {room.waitlistCount > 0 && (
                    <p className="waitlist-banner">
                      Waitlist: <strong>{room.waitlistCount}</strong> student
                      {room.waitlistCount === 1 ? "" : "s"} ahead
                    </p>
                  )}

                  <div className="room-card__actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        setReviewsOpenId(reviewsOpenId === room.roomID ? null : room.roomID)
                      }
                      aria-expanded={reviewsOpenId === room.roomID}
                    >
                      {reviewsOpenId === room.roomID ? "Hide reviews" : "View reviews"}
                    </button>
                    <div
                      className="book-popover-root"
                      ref={(el) => {
                        bookPopoverRefs.current[room.roomID] = el;
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={bookDisabled}
                        aria-label={bookLabel}
                        aria-haspopup="dialog"
                        aria-expanded={bookingPopoverRoomId === room.roomID}
                        aria-controls={`booking-popover-${room.roomID}`}
                        title={
                          !isAuthenticated
                            ? "Sign in to reserve a room"
                            : room.currentStatus !== "available"
                              ? "Choose an open room"
                              : "Pick a time slot"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (bookDisabled) return;
                          if (bookingPopoverRoomId === room.roomID) {
                            closeBookingPopover();
                            return;
                          }
                          closeRatingPopover();
                          setBookingDemoNotice(null);
                          setBookingSlotChoiceId(null);
                          setBookingPopoverRoomId(room.roomID);
                        }}
                      >
                        Book room
                      </button>
                      {bookingPopoverRoomId === room.roomID && (
                        <div
                          className="booking-popover"
                          id={`booking-popover-${room.roomID}`}
                          role="dialog"
                          aria-labelledby={`booking-popover-title-${room.roomID}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h4
                            className="booking-popover__title"
                            id={`booking-popover-title-${room.roomID}`}
                          >
                            Available times · today
                          </h4>
                          <p className="booking-popover__room">
                            {room.buildingName} {room.roomNumber} · seats {room.capacity}
                          </p>
                          <ul className="booking-popover__features" aria-label="Room resources">
                            {room.featureList.map((f) => (
                              <li key={f}>{FEATURE_LABELS[f]}</li>
                            ))}
                          </ul>
                          <p className="booking-popover__sub">Choose one slot (1 hour blocks).</p>
                          <ul className="booking-popover__slots" role="listbox" aria-label="Open time slots">
                            {mockTimeSlotsForRoom(room).map((slot) => {
                              const picked = bookingSlotChoiceId === slot.id;
                              return (
                                <li key={slot.id}>
                                  <button
                                    type="button"
                                    className={`booking-slot${picked ? " booking-slot--picked" : ""}`}
                                    role="option"
                                    aria-selected={picked}
                                    onClick={() => setBookingSlotChoiceId(slot.id)}
                                  >
                                    {slot.label}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                          <p className="booking-popover__policy">
                            You can hold at most one reservation per slot; same-building bookings are
                            capped at 2 hours total (team rule).
                          </p>
                          {bookingDemoNotice && (
                            <p className="booking-popover__notice" role="status">
                              {bookingDemoNotice}
                            </p>
                          )}
                          <div className="booking-popover__footer">
                            <button
                              type="button"
                              className="btn btn--ghost btn--small"
                              onClick={() => closeBookingPopover()}
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              className="btn btn--primary btn--small"
                              disabled={!bookingSlotChoiceId}
                              onClick={() => {
                                const label = mockTimeSlotsForRoom(room).find(
                                  (s) => s.id === bookingSlotChoiceId,
                                )?.label;
                                setBookingDemoNotice(
                                  label
                                    ? `Demo: would reserve ${label} in ${room.buildingName} ${room.roomNumber}.`
                                    : "Pick a time first.",
                                );
                              }}
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div
                      className="book-popover-root"
                      ref={(el) => {
                        ratePopoverRefs.current[room.roomID] = el;
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={rateDisabled}
                        aria-label={rateLabel}
                        aria-haspopup="dialog"
                        aria-expanded={ratingPopoverRoomId === room.roomID}
                        aria-controls={`rating-popover-${room.roomID}`}
                        title={
                          !isAuthenticated ? "Sign in to leave a rating" : "Rate this study room"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (rateDisabled) return;
                          if (ratingPopoverRoomId === room.roomID) {
                            closeRatingPopover();
                            return;
                          }
                          closeBookingPopover();
                          resetRateForm();
                          setRatingPopoverRoomId(room.roomID);
                        }}
                      >
                        Rate
                      </button>
                      {ratingPopoverRoomId === room.roomID && (
                        <div
                          className="booking-popover"
                          id={`rating-popover-${room.roomID}`}
                          role="dialog"
                          aria-labelledby={`rating-popover-title-${room.roomID}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h4
                            className="booking-popover__title"
                            id={`rating-popover-title-${room.roomID}`}
                          >
                            Rate this room
                          </h4>
                          <p className="booking-popover__room">
                            {room.buildingName} {room.roomNumber}
                          </p>
                          <p className="booking-popover__sub">
                            1 = poor, 5 = excellent. Matches your team’s noise and cleanliness
                            breakdown.
                          </p>
                          <ScorePicker
                            id={`${room.roomID}-overall`}
                            label="Overall"
                            value={rateOverall}
                            onChange={setRateOverall}
                          />
                          <ScorePicker
                            id={`${room.roomID}-noise`}
                            label="Noise level (quietness)"
                            value={rateNoise}
                            onChange={setRateNoise}
                          />
                          <ScorePicker
                            id={`${room.roomID}-clean`}
                            label="Cleanliness"
                            value={rateCleanliness}
                            onChange={setRateCleanliness}
                          />
                          <label className="booking-popover__review-label" htmlFor={`rate-review-${room.roomID}`}>
                            Review (optional)
                          </label>
                          <textarea
                            id={`rate-review-${room.roomID}`}
                            className="booking-popover__textarea"
                            rows={3}
                            maxLength={500}
                            value={rateReview}
                            onChange={(e) => setRateReview(e.target.value)}
                            placeholder="Write your review for other students"
                          />
                          {rateDemoNotice && (
                            <p className="booking-popover__notice" role="status">
                              {rateDemoNotice}
                            </p>
                          )}
                          <div className="booking-popover__footer">
                            <button
                              type="button"
                              className="btn btn--ghost btn--small"
                              onClick={() => closeRatingPopover()}
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              className="btn btn--primary btn--small"
                              disabled={rateOverall < 1 || rateNoise < 1 || rateCleanliness < 1}
                              onClick={() => {
                                const snippet = rateReview.trim().slice(0, 80);
                                setRateDemoNotice(
                                  `Demo: would post ${rateOverall}/5 overall, noise ${rateNoise}/5, cleanliness ${rateCleanliness}/5${snippet ? ` — “${snippet}${rateReview.trim().length > 80 ? "…" : ""}”` : "."}`,
                                );
                              }}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={waitlistDisabled}
                      aria-label={waitlistLabel}
                      title={
                        !isAuthenticated
                          ? "Sign in to join a waitlist"
                          : room.currentStatus === "available"
                            ? "Waitlist opens when the room is booked"
                            : "Join the waitlist"
                      }
                    >
                      Join waitlist
                    </button>
                  </div>

                  {reviewsOpenId === room.roomID && (
                    <div className="reviews-drawer">
                      <h4 className="reviews-drawer__title">Recent feedback</h4>
                      <ul>
                        {mockReviewsForRoom(room).map((rev, i) => (
                          <li key={i} className="review-line">
                            <strong>{rev.author}</strong> — {rev.body}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {filtered.length === 0 && (
            <p className="empty-state">
              No rooms match these filters. Try removing a resource filter.
            </p>
          )}
        </section>
      </div>

      {selectedRoom && (
        <aside className="detail-strip" aria-live="polite">
          <strong>Selected:</strong> {selectedRoom.buildingName} {selectedRoom.roomNumber} ·{" "}
          {statusLabel(selectedRoom.currentStatus)}
        </aside>
      )}
    </div>
  );
}
