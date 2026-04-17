export type RoomStatus = "available" | "booked" | "partial";

export type RoomFeature =
  | "whiteboard"
  | "monitors"
  | "outlets"
  | "projector"
  | "window"
  | "printer";

export type MapPoint = {
  /** 0–100, percentage within campus map SVG */
  x: number;
  y: number;
};

export type Room = {
  roomID: string;
  buildingName: string;
  roomNumber: string;
  capacity: number;
  featureList: RoomFeature[];
  mapLocation: MapPoint;
  currentStatus: RoomStatus;
  /** Average 1–5 from reviews */
  averageRating: number;
  ratingNoise: number;
  ratingCleanliness: number;
  reviewCount: number;
  waitlistCount: number;
  /**
   * 0 = very open (green heat), 1 = at capacity / heavily booked (red heat).
   * Mock proxy for “commonly booked” until backend provides real stats.
   */
  bookingIntensity: number;
};
