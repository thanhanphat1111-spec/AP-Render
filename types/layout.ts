export interface LayoutSpec {
  units: "mm";
  walls: { from:[number,number]; to:[number,number]; thickness:number; height:number }[];
  doors?: { at:[number,number]; width:number; height:number; wallIndex:number }[];
  windows?: { at:[number,number]; width:number; sill:number; height:number; wallIndex:number }[];
  furniture?: { name:string; pos:[number,number,number]; size:[number,number,number]; yawDeg?:number }[];
  camera?: { x:number; y:number; z:number };
  northYawDeg?: number; // 0° = trục +X; dùng để quy ước Đông/Tây/Nam/Bắc
}
