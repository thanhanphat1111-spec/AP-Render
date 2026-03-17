import { ImageFile } from '../types';
import { LayoutSpec } from '../types/layout';

// This is a placeholder/mock function. In a real application, this would
// involve a complex CV model to parse the floorplan image. For now, we
// return a hardcoded layout that matches the user's sample image to
// demonstrate the prior generation pipeline.
export async function buildLayoutFromFloorplan(floorplanImage: ImageFile): Promise<LayoutSpec> {
  // The coordinates are in millimeters, on an XZ plane (Y is up).
  // The origin (0,0) is assumed to be the bottom-left corner.
  return {
    units: "mm",
    // These walls define the main L-shape of the room.
    walls: [
      { from: [0, 0], to: [8000, 0], thickness: 200, height: 3600 }, // Back wall
      { from: [8000, 0], to: [8000, 5000], thickness: 200, height: 3600 }, // Right wall (short)
      { from: [8000, 5000], to: [4000, 5000], thickness: 200, height: 3600 }, // Indented wall
      { from: [4000, 5000], to: [4000, 10000], thickness: 200, height: 3600 },// Long right wall
      { from: [4000, 10000], to: [0, 10000], thickness: 200, height: 3600 }, // Front wall
      { from: [0, 10000], to: [0, 0], thickness: 200, height: 3600 }, // Left wall
    ],
    // The large arched door/window on the front wall.
    windows: [
      { at: [2000, 10000], width: 3500, height: 3000, sill: 0, wallIndex: 4 }
    ],
    // Key furniture pieces are defined as simple boxes (proxies).
    // FIX: The `pos` array now represents the object's CENTER [x, y, z].
    // Y-coordinate is calculated as height/2 for objects on the floor.
    furniture: [
      // Living Room Sofa (height 800, so center y is 400)
      { name: "sofa", pos: [2000, 400, 8000], size: [2500, 800, 1500], yawDeg: 0 },
      // Dining Table (height 750, so center y is 375)
      { name: "dining_table", pos: [6000, 375, 7500], size: [2000, 750, 1000], yawDeg: 0 },
      // Kitchen Counter (height 900, so center y is 450)
      { name: "kitchen_counter", pos: [6000, 450, 2000], size: [3000, 900, 800], yawDeg: 90 },
      // Staircase (height 3600, so center y is 1800)
      { name: "staircase", pos: [1500, 1800, 3000], size: [1000, 3600, 5000], yawDeg: 0 },
       // Mezzanine floor (height 200, position y is 3400)
      { name: "mezzanine", pos: [2000, 3400, 6000], size: [4000, 200, 8000], yawDeg: 0 }
    ],
    // Camera position in the center of the main living area.
    camera: { x: 4, y: 1.7, z: 6 },
    northYawDeg: 0,
  };
}
