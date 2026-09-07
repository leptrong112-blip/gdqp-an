const STRAIGHT_LENGTH = 14;
const TURN_RADIUS = 0.8;
const ARC_LENGTH = Math.PI * TURN_RADIUS;

export const MOVEMENT_ROUTE_LENGTH = 2 * STRAIGHT_LENGTH + 2 * ARC_LENGTH;
export const SQUAD_SPACING_METERS = 1.6;

export interface MovementPose {
  position: [number, number, number];
  yaw: number;
}

/** A closed, tangent-continuous capsule entirely inside the baked dirt lane. */
export function sampleMovementRoute(distance: number): MovementPose {
  const d = ((distance % MOVEMENT_ROUTE_LENGTH) + MOVEMENT_ROUTE_LENGTH) % MOVEMENT_ROUTE_LENGTH;
  if (d < STRAIGHT_LENGTH) {
    return { position: [-6 + d, 0, 9.2], yaw: Math.PI / 2 };
  }
  if (d < STRAIGHT_LENGTH + ARC_LENGTH) {
    const theta = (d - STRAIGHT_LENGTH) / TURN_RADIUS;
    return {
      position: [8 + TURN_RADIUS * Math.sin(theta), 0, 10 - TURN_RADIUS * Math.cos(theta)],
      yaw: Math.PI / 2 - theta,
    };
  }
  if (d < 2 * STRAIGHT_LENGTH + ARC_LENGTH) {
    return {
      position: [8 - (d - STRAIGHT_LENGTH - ARC_LENGTH), 0, 10.8],
      yaw: -Math.PI / 2,
    };
  }
  const theta = (d - 2 * STRAIGHT_LENGTH - ARC_LENGTH) / TURN_RADIUS;
  return {
    position: [-6 - TURN_RADIUS * Math.sin(theta), 0, 10 + TURN_RADIUS * Math.cos(theta)],
    yaw: -Math.PI / 2 - theta,
  };
}
