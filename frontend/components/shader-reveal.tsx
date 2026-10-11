"use client";

import { useRef, useEffect, useCallback } from "react";

interface ShaderRevealProps {
  frontImage: string;
  backImage: string;
  mouseForce?: number;
  cursorSize?: number;
  resolution?: number;
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  revealStrength?: number;
  revealSoftness?: number;
  className?: string;
}

const VERTEX_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_front;
uniform sampler2D u_back;
uniform vec2 u_cursor;
uniform float u_radius;
uniform float u_strength;
uniform float u_softness;
uniform vec2 u_imageRatio;

void main() {
  vec2 uv = v_uv;

  // Correct for aspect ratio so the brush is circular, not elliptical
  vec2 aspect = vec2(u_imageRatio.x / u_imageRatio.y, 1.0);
  float dist = length((uv - u_cursor) * aspect);
  float reveal = smoothstep(u_radius, u_radius * (1.0 - u_softness), dist) * u_strength;

  vec4 front = texture2D(u_front, uv);
  vec4 back = texture2D(u_back, uv);
  gl_FragColor = mix(front, back, reveal);
}
`;

function loadTexture(gl: WebGLRenderingContext, url: string, onLoad: () => void): WebGLTexture {
  const tex = gl.createTexture()!;
  // 1x1 placeholder until image loads
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    onLoad();
  };
  img.src = url;
  return tex;
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

export default function ShaderReveal({
  frontImage,
  backImage,
  cursorSize = 250,
  autoDemo = false,
  autoSpeed = 0.55,
  autoIntensity = 2.2,
  revealStrength = 0.75,
  revealSoftness = 0.5,
  className,
}: ShaderRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cursorRef = useRef({ x: 0.5, y: 0.5 });
  const isHoveringRef = useRef(false);

  const render = useCallback(
    (
      gl: WebGLRenderingContext,
      program: WebGLProgram,
      frontTex: WebGLTexture,
      backTex: WebGLTexture,
    ) => {
      const canvas = gl.canvas as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width * dpr;
      const h = rect.height * dpr;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      // Cursor
      const cur = cursorRef.current;
      gl.uniform2f(gl.getUniformLocation(program, "u_cursor"), cur.x, cur.y);

      // Reduce reveal during auto-demo so front image stays dominant
      const hovering = isHoveringRef.current;
      const strength = hovering ? revealStrength : revealStrength * 0.6;
      const size = hovering ? cursorSize : cursorSize * 0.7;

      // Radius in UV space
      const radius = size / Math.max(rect.width, rect.height);
      gl.uniform1f(gl.getUniformLocation(program, "u_radius"), radius);
      gl.uniform1f(gl.getUniformLocation(program, "u_strength"), strength);
      gl.uniform1f(gl.getUniformLocation(program, "u_softness"), Math.min(revealSoftness, 0.99));
      gl.uniform2f(gl.getUniformLocation(program, "u_imageRatio"), rect.width, rect.height);

      // Bind textures
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, frontTex);
      gl.uniform1i(gl.getUniformLocation(program, "u_front"), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, backTex);
      gl.uniform1i(gl.getUniformLocation(program, "u_back"), 1);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    [cursorSize, revealStrength, revealSoftness],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);

    // Compile program
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // Full-screen quad
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Load textures
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === 2) startLoop();
    };
    const frontTex = loadTexture(gl, frontImage, onLoad);
    const backTex = loadTexture(gl, backImage, onLoad);

    function startLoop() {
      const loop = (time: number) => {
        // Auto-demo cursor movement
        if (autoDemo && !isHoveringRef.current) {
          const t = time * 0.001 * autoSpeed;
          cursorRef.current = {
            x: 0.5 + Math.sin(t) * 0.25 * autoIntensity * 0.4,
            y: 0.5 + Math.cos(t * 0.7) * 0.2 * autoIntensity * 0.4,
          };
        }

        render(gl!, program, frontTex, backTex);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    // Mouse events
    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      cursorRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    }

    function onPointerEnter() {
      isHoveringRef.current = true;
    }

    function onPointerLeave() {
      isHoveringRef.current = false;
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteTexture(frontTex);
      gl.deleteTexture(backTex);
      gl.deleteBuffer(buf);
    };
  }, [frontImage, backImage, autoDemo, autoSpeed, autoIntensity, render]);

  return <canvas ref={canvasRef} className={className} style={{ display: "block" }} />;
}
