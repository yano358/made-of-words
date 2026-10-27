const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_time, u_curvature, u_scanlines, u_scanDensity, u_aberration, u_noise, u_flicker, u_vignette,
  u_saturation, u_tintAmount, u_pixelate, u_tracking, u_jitter, u_brightness, u_contrast;
uniform vec3 u_tint;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv *= 1.0 + u_curvature * 0.25 * dot(uv, uv);
  uv = uv * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  float t = u_time;
  float row = floor(uv.y * u_res.y);
  uv.x += u_jitter * (hash(vec2(row * 0.1, floor(t * 24.0))) - 0.5) * 0.004;
  float band = abs(fract(uv.y * 0.6 + t * 0.08) - 0.5);
  float track = u_tracking * smoothstep(0.06, 0.0, band);
  uv.x += track * (hash(vec2(row, floor(t * 30.0))) - 0.5) * 0.04;

  if (u_pixelate > 0.0) {
    vec2 cells = u_res / (1.0 + u_pixelate * 11.0);
    uv = (floor(uv * cells) + 0.5) / cells;
  }

  float a = u_aberration * 0.006;
  vec3 col = vec3(texture(u_tex, uv + vec2(a, 0.0)).r, texture(u_tex, uv).g, texture(u_tex, uv - vec2(a, 0.0)).b);
  col += track * (hash(uv * u_res + t) - 0.5) * 0.8;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, u_saturation);
  col = mix(col, lum * u_tint * 1.5, u_tintAmount);
  col = ((col - 0.5) * u_contrast + 0.5) * u_brightness;

  float scan = 0.5 + 0.5 * sin(uv.y * u_res.y * u_scanDensity * 3.14159);
  col *= 1.0 - u_scanlines * (1.0 - scan) * 0.7;
  col += (hash(uv * u_res + fract(t) * 91.0) - 0.5) * u_noise * 0.35;
  col *= 1.0 - u_flicker * 0.12 * hash(vec2(floor(t * 20.0), 7.0));

  vec2 v = uv * (1.0 - uv);
  col *= mix(1.0, clamp(pow(v.x * v.y * 16.0, 0.35), 0.0, 1.0), u_vignette);
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export const SHADER_PARAMS = [
  "curvature", "scanlines", "scanDensity", "aberration", "noise", "flicker", "vignette",
  "saturation", "tintAmount", "pixelate", "tracking", "jitter", "brightness", "contrast",
];

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export function createTv(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  if (!gl) {
    const ctx = canvas.getContext("2d");
    return { render: (src) => ctx.drawImage(src, 0, 0, width, height) };
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindVertexArray(gl.createVertexArray());

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const loc = (name) => gl.getUniformLocation(prog, name);
  const params = SHADER_PARAMS.map((key) => [key, loc("u_" + key)]);
  const uTime = loc("u_time");
  const uTint = loc("u_tint");
  gl.uniform2f(loc("u_res"), width, height);
  gl.uniform1i(loc("u_tex"), 0);
  gl.viewport(0, 0, width, height);

  return {
    render(src, style, time) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      for (const [key, u] of params) gl.uniform1f(u, style[key]);
      gl.uniform3fv(uTint, hexToRgb(style.tint));
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
