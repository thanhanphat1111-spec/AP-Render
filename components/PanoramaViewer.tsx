import React, { useRef, useEffect } from 'react';

interface PanoramaViewerProps {
  imageUrl: string;
}

// --- Self-Contained WebGL and Matrix Helpers ---
// Note: These helpers are included here to avoid external dependencies.
// They are simplified versions of common WebGL utility functions.

/** Creates a new, identity 4x4 matrix. */
const mat4_create = (): Float32Array => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

/** Generates a perspective projection matrix. */
const mat4_perspective = (out: Float32Array, fovy: number, aspect: number, near: number, far: number): Float32Array => {
    const f = 1.0 / Math.tan(fovy / 2);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[11] = -1; out[12] = 0; out[13] = 0; out[15] = 0;
    if (far != null && far !== Infinity) {
        const nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = 2 * far * near * nf;
    } else {
        out[10] = -1;
        out[14] = -2 * near;
    }
    return out;
};

/** Rotates a mat4 by the given angle around the X axis. */
const mat4_rotateX = (out: Float32Array, a: Float32Array, rad: number): Float32Array => {
    const s = Math.sin(rad), c = Math.cos(rad), a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) { out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3]; out[12]= a[12]; out[13]=a[13]; out[14]=a[14]; out[15]=a[15]; }
    out[4] = a10 * c + a20 * s; out[5] = a11 * c + a21 * s; out[6] = a12 * c + a22 * s; out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s; out[9] = a21 * c - a11 * s; out[10]= a22 * c - a12 * s; out[11]= a23 * c - a13 * s;
    return out;
};

/** Rotates a mat4 by the given angle around the Y axis. */
const mat4_rotateY = (out: Float32Array, a: Float32Array, rad: number): Float32Array => {
    const s = Math.sin(rad), c = Math.cos(rad), a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) { out[4]=a[4]; out[5]=a[5]; out[6]=a[6]; out[7]=a[7]; out[12]=a[12]; out[13]=a[13]; out[14]=a[14]; out[15]=a[15];}
    out[0] = a00 * c - a20 * s; out[1] = a01 * c - a21 * s; out[2] = a02 * c - a22 * s; out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c; out[9] = a01 * s + a21 * c; out[10]= a02 * s + a22 * c; out[11]= a03 * s + a23 * c;
    return out;
};

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ imageUrl }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glObjectsRef = useRef<any>({});
    const cameraRef = useRef({ lon: 90, lat: 0, fov: 75 });
    const interactionRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
    const animationFrameId = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', { antialias: true });
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying highp vec2 vTextureCoord;
            void main(void) {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vTextureCoord = aTextureCoord;
            }
        `;

        const fsSource = `
            varying highp vec2 vTextureCoord;
            uniform sampler2D uSampler;
            void main(void) {
                gl_FragColor = texture2D(uSampler, vTextureCoord);
            }
        `;

        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
        if (!shaderProgram) return;

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            },
        };

        const buffers = createSphere(gl, 50, 50);
        const texture = loadTexture(gl, imageUrl);

        glObjectsRef.current = { gl, programInfo, buffers, texture };

        function render() {
            drawScene();
            animationFrameId.current = requestAnimationFrame(render);
        }
        animationFrameId.current = requestAnimationFrame(render);
        
        const handleResize = () => {
            if (canvas) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                gl?.viewport(0, 0, canvas.width, canvas.height);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [imageUrl]);

    const drawScene = () => {
        const { gl, programInfo, buffers, texture } = glObjectsRef.current;
        if (!gl || !programInfo || !buffers) return;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = cameraRef.current.fov * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4_create();
        mat4_perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        const modelViewMatrix = mat4_create();
        mat4_rotateX(modelViewMatrix, modelViewMatrix, cameraRef.current.lat * Math.PI / 180);
        mat4_rotateY(modelViewMatrix, modelViewMatrix, cameraRef.current.lon * Math.PI / 180);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        gl.drawElements(gl.TRIANGLES, buffers.indicesCount, gl.UNSIGNED_SHORT, 0);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        interactionRef.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
    };
    const handleMouseUp = () => {
        interactionRef.current.isDragging = false;
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!interactionRef.current.isDragging) return;
        const { lastX, lastY } = interactionRef.current;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        
        cameraRef.current.lon -= dx * 0.1;
        cameraRef.current.lat -= dy * 0.1;
        cameraRef.current.lat = Math.max(-89, Math.min(89, cameraRef.current.lat)); // Clamp latitude
        
        interactionRef.current.lastX = e.clientX;
        interactionRef.current.lastY = e.clientY;
    };
    const handleWheel = (e: React.WheelEvent) => {
        cameraRef.current.fov += e.deltaY * 0.05;
        cameraRef.current.fov = Math.max(30, Math.min(120, cameraRef.current.fov)); // Clamp FOV for zoom
    };

    // --- WebGL Helper Functions ---
    const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string) => {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        if (!vertexShader || !fragmentShader) return null;

        const shaderProgram = gl.createProgram();
        if (!shaderProgram) return null;
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    };

    const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };
    
    const loadTexture = (gl: WebGLRenderingContext, url: string) => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])); // blue pixel
        
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            // Use CLAMP_TO_EDGE for non-power-of-two textures, which is safer for WebGL 1.
            // This prevents the texture from being "incomplete" and rendering as black.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
        image.src = url;
        return texture;
    };
    
    const createSphere = (gl: WebGLRenderingContext, latBands: number, lonBands: number) => {
        const vertices = [], textureCoords = [], indices = [];
        for (let lat = 0; lat <= latBands; lat++) {
            const theta = lat * Math.PI / latBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            for (let lon = 0; lon <= lonBands; lon++) {
                const phi = lon * 2 * Math.PI / lonBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                const u = 1 - (lon / lonBands);
                const v = lat / latBands; // FIX: Inverted V coordinate to correct upside-down texture.
                vertices.push(-z, y, x); // Adjusted for camera at origin looking down -Z
                textureCoords.push(u, v);
            }
        }

        for (let lat = 0; lat < latBands; lat++) {
            for (let lon = 0; lon < lonBands; lon++) {
                const first = (lat * (lonBands + 1)) + lon;
                const second = first + lonBands + 1;
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        return {
            position: positionBuffer,
            textureCoord: textureCoordBuffer,
            indices: indexBuffer,
            indicesCount: indices.length,
        };
    };

    return (
        <div className="w-full h-full relative group" style={{ cursor: 'grab' }}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Kéo để xoay | Cuộn để zoom
            </div>
        </div>
    );
};