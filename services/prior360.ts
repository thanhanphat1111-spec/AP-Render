import * as THREE from "three";
import { LayoutSpec } from "../types/layout";

const cubeMapToEquirectDataUrl = (
  renderer: THREE.WebGLRenderer,
  cubeTexture: THREE.CubeTexture,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve) => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    const vs = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fs = `
        #define M_PI 3.1415926535897932384626433832795
        uniform samplerCube cubeTexture;
        varying vec2 vUv;
        void main() {
            float lon = vUv.x * 2.0 * M_PI - M_PI;
            float lat = vUv.y * M_PI - M_PI / 2.0;
            vec3 dir = vec3(
                cos(lat) * cos(lon),
                sin(lat),
                cos(lat) * sin(lon)
            );
            // Coordinate system transformation for Three.js CubeTexture lookup
            gl_FragColor = textureCube(cubeTexture, vec3(-dir.z, dir.y, -dir.x));
        }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        cubeTexture: { value: cubeTexture },
      },
      vertexShader: vs,
      fragmentShader: fs,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context) {
        const buffer = new Uint8Array(width * height * 4);
        renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);
        const imageData = new ImageData(new Uint8ClampedArray(buffer.buffer), width, height);
        context.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
    } else {
        resolve(''); // Should not happen
    }
    
    renderTarget.dispose();
    geometry.dispose();
    material.dispose();
  });
};


// layoutJson: bạn sinh từ floorplan (xem mục 2)
export async function renderPrior360(layoutJson: LayoutSpec, opts?: {w?:number;h?:number}) {
  const W = opts?.w ?? 3072, H = opts?.h ?? 1536; // đủ sắc nét để làm prior
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); // White background
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1024, 1024); // Tạm thời cho cube faces

  // 1) Dựng tường từ các đoạn (mm -> m)
  const wallMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
  layoutJson.walls.forEach(w => {
    const dx = (w.to[0]-w.from[0])/1000, dz = (w.to[1]-w.from[1])/1000;
    const len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
    const geom = new THREE.BoxGeometry(len, w.height/1000, w.thickness/1000);
    const mesh = new THREE.Mesh(geom, wallMat);
    mesh.position.set(
      (w.from[0]/1000 + dx/2),
      (w.height/1000)/2,
      (w.from[1]/1000 + dz/2)
    );
    mesh.rotation.y = -ang;
    scene.add(mesh);
  });

  // 2) Proxy furniture (box/cylinder) – đúng vị trí & kích thước
  const furnMat = new THREE.MeshBasicMaterial({ color: 0x999999 });
  layoutJson.furniture?.forEach(f => {
    const geom = new THREE.BoxGeometry(f.size[0]/1000, f.size[1]/1000, f.size[2]/1000);
    const mesh = new THREE.Mesh(geom, furnMat);
    // FIX: The `pos` array from the layout defines the object's CENTER [x, y, z].
    // The previous logic incorrectly assumed `pos[1]` was the floor level.
    // The geometry is centered by default, so we just need to set its position.
    mesh.position.set(f.pos[0]/1000, f.pos[1]/1000, f.pos[2]/1000);
    mesh.rotation.y = -THREE.MathUtils.degToRad(f.yawDeg ?? 0);
    scene.add(mesh);
  });
  
  // Add a simple floor plane
  const floorGeom = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);


  // 3) Lấy ảnh cube map ở tâm phòng
  const cubeRT = new THREE.WebGLCubeRenderTarget(1024, { format: THREE.RGBAFormat });
  const cubeCam = new THREE.CubeCamera(0.01, 100, cubeRT);
  const camPos = layoutJson.camera;
  cubeCam.position.set(camPos?.x ?? 4, camPos?.y ?? 1.6, camPos?.z ?? 6);
  cubeCam.update(renderer, scene);

  // 4) Convert cubemap -> equirectangular
  const dataUrl = await cubeMapToEquirectDataUrl(renderer, cubeRT.texture, W, H);

  renderer.dispose();
  cubeRT.dispose();

  return dataUrl; // base64 PNG – đưa thẳng vào AI làm ảnh prior
}
