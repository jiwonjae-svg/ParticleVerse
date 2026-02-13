// Simplex noise function shared by compute shaders
const snoiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

// Velocity compute shader — updates particle velocity each frame
// Forces: spring-back, hand repulsion, audio reactivity
export const velocityComputeShader = `
uniform float uTime;
uniform float uDeltaTime;
uniform vec3 uLeftHand;
uniform vec3 uRightHand;
uniform float uHandRadius;
uniform float uRepulsionForce;
uniform float uAttractionForce;
uniform float uAudioBass;
uniform float uAudioEnergy;
uniform sampler2D textureOriginal;

${snoiseGLSL}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 velocity = texture2D(textureVelocity, uv).xyz;
  vec3 displacement = texture2D(texturePosition, uv).xyz;
  vec3 originalPos = texture2D(textureOriginal, uv).xyz;
  vec3 worldPos = originalPos + displacement;

  float dt = min(uDeltaTime, 0.05);

  // Spring force to return particles to formation
  float springK = 2.0 + uAttractionForce * 4.0;
  vec3 springForce = -displacement * springK;

  // Hand repulsion — left hand
  vec3 handForce = vec3(0.0);
  if (length(uLeftHand) > 0.001) {
    vec3 toParticle = worldPos - uLeftHand;
    float dist = length(toParticle);
    if (dist < uHandRadius && dist > 0.01) {
      float normalizedDist = dist / uHandRadius;
      float force = pow(1.0 - normalizedDist, 3.0);
      vec3 pushDir = normalize(toParticle);
      // Organic noise scatter
      float n1 = snoise(worldPos * 0.03 + uTime * 0.5);
      float n2 = snoise(worldPos * 0.03 + uTime * 0.5 + 100.0);
      float n3 = snoise(worldPos * 0.03 + uTime * 0.5 + 200.0);
      pushDir += vec3(n1, n2, n3) * 0.3;
      pushDir = normalize(pushDir);
      pushDir.y += 0.1 * force;
      handForce += pushDir * force * uRepulsionForce * 200.0;
    }
  }

  // Hand repulsion — right hand
  if (length(uRightHand) > 0.001) {
    vec3 toParticle = worldPos - uRightHand;
    float dist = length(toParticle);
    if (dist < uHandRadius && dist > 0.01) {
      float normalizedDist = dist / uHandRadius;
      float force = pow(1.0 - normalizedDist, 3.0);
      vec3 pushDir = normalize(toParticle);
      float n1 = snoise(worldPos * 0.03 + uTime * 0.5 + 300.0);
      float n2 = snoise(worldPos * 0.03 + uTime * 0.5 + 400.0);
      float n3 = snoise(worldPos * 0.03 + uTime * 0.5 + 500.0);
      pushDir += vec3(n1, n2, n3) * 0.3;
      pushDir = normalize(pushDir);
      pushDir.y += 0.1 * force;
      handForce += pushDir * force * uRepulsionForce * 200.0;
    }
  }

  // Audio bass pulse — radial impulse
  if (uAudioBass > 0.01) {
    float dist = length(displacement);
    vec3 radialDir = dist > 0.01 ? normalize(displacement) : vec3(0.0, 1.0, 0.0);
    handForce += radialDir * uAudioBass * 30.0;
  }

  velocity += (springForce + handForce) * dt;
  velocity *= 0.95; // damping

  gl_FragColor = vec4(velocity, 0.0);
}
`;

// Position compute shader — integrates velocity into displacement
export const positionComputeShader = `
uniform float uDeltaTime;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 displacement = texture2D(texturePosition, uv).xyz;
  vec3 velocity = texture2D(textureVelocity, uv).xyz;

  float dt = min(uDeltaTime, 0.05);
  displacement += velocity * dt * 60.0;

  // Clamp to prevent runaway particles
  float maxDist = 500.0;
  float len = length(displacement);
  if (len > maxDist) {
    displacement = displacement * (maxDist / len);
  }

  gl_FragColor = vec4(displacement, 0.0);
}
`;
