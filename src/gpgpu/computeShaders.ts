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
// Forces: spring-back, gesture-aware hand interaction, audio reactivity
// Gesture modes: 0=none, 1=open(repel), 2=closed(attract), 3=pinch(vortex), 4=point(none), 5=peace(explode)
export const velocityComputeShader = `
uniform float uTime;
uniform float uDeltaTime;
uniform vec3 uLeftHand;
uniform vec3 uRightHand;
uniform float uHandRadius;
uniform float uRepulsionForce;
uniform float uAttractionForce;
uniform int uGesture;
uniform float uAudioBass;
uniform float uAudioEnergy;
uniform sampler2D textureOriginal;

${snoiseGLSL}

// Compute gesture-aware force for a single hand
vec3 computeHandForce(vec3 worldPos, vec3 handPos, float seedOffset) {
  vec3 force = vec3(0.0);
  if (length(handPos) < 0.001) return force;

  vec3 toParticle = worldPos - handPos;
  float dist = length(toParticle);
  if (dist >= uHandRadius || dist < 0.01) return force;

  float normalizedDist = dist / uHandRadius;
  float falloff = pow(1.0 - normalizedDist, 3.0);

  // Organic noise for natural variation
  float n1 = snoise(worldPos * 0.03 + uTime * 0.5 + seedOffset);
  float n2 = snoise(worldPos * 0.03 + uTime * 0.5 + seedOffset + 100.0);
  float n3 = snoise(worldPos * 0.03 + uTime * 0.5 + seedOffset + 200.0);

  // Gesture 0 (none) or 4 (point): no interaction
  if (uGesture == 0 || uGesture == 4) {
    return force;
  }

  // Gesture 1 (open hand): repel — push particles away like sand
  if (uGesture == 1) {
    vec3 pushDir = normalize(toParticle);
    pushDir += vec3(n1, n2, n3) * 0.3;
    pushDir = normalize(pushDir);
    pushDir.y += 0.1 * falloff;
    force = pushDir * falloff * uRepulsionForce * 60.0;
  }

  // Gesture 2 (closed fist): attract — pull particles toward hand
  else if (uGesture == 2) {
    vec3 pullDir = -normalize(toParticle);
    pullDir += vec3(n1, n2, n3) * 0.15;
    pullDir = normalize(pullDir);
    force = pullDir * falloff * uAttractionForce * 50.0;
  }

  // Gesture 3 (pinch): vortex — particles orbit around hand
  else if (uGesture == 3) {
    // Tangential force (cross product with up vector for horizontal swirl)
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 tangent = normalize(cross(up, toParticle));
    // Add slight inward pull to keep particles in orbit
    vec3 inward = -normalize(toParticle) * 0.3;
    vec3 orbitDir = tangent + inward;
    orbitDir += vec3(n1, n2, n3) * 0.1;
    orbitDir = normalize(orbitDir);
    force = orbitDir * falloff * uRepulsionForce * 45.0;
  }

  // Gesture 5 (peace): explosion burst — strong radial scatter
  else if (uGesture == 5) {
    vec3 burstDir = normalize(toParticle);
    burstDir += vec3(n1, n2, n3) * 0.5;
    burstDir = normalize(burstDir);
    force = burstDir * falloff * uRepulsionForce * 120.0;
  }

  return force;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 velocity = texture2D(textureVelocity, uv).xyz;
  vec3 displacement = texture2D(texturePosition, uv).xyz;
  vec3 originalPos = texture2D(textureOriginal, uv).xyz;
  vec3 worldPos = originalPos + displacement;

  float dt = min(uDeltaTime, 0.05);

  // Spring force to return particles to formation (strong enough for fast recovery)
  float springK = 6.0 + uAttractionForce * 8.0;
  vec3 springForce = -displacement * springK;

  // Gesture-aware hand forces
  vec3 handForce = vec3(0.0);
  handForce += computeHandForce(worldPos, uLeftHand, 0.0);
  handForce += computeHandForce(worldPos, uRightHand, 300.0);

  // Audio bass pulse — radial impulse
  if (uAudioBass > 0.01) {
    float dist = length(displacement);
    vec3 radialDir = dist > 0.01 ? normalize(displacement) : vec3(0.0, 1.0, 0.0);
    handForce += radialDir * uAudioBass * 30.0;
  }

  velocity += (springForce + handForce) * dt;
  velocity *= 0.85; // strong damping for fast settling

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
  displacement += velocity * dt * 20.0;

  // Clamp to prevent runaway particles
  float maxDist = 150.0;
  float len = length(displacement);
  if (len > maxDist) {
    displacement = displacement * (maxDist / len);
  }

  gl_FragColor = vec4(displacement, 0.0);
}
`;
