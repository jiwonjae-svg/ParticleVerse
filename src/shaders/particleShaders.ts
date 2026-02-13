// Particle vertex shader - GPU optimized
export const particleVertexShader = `
uniform float uTime;
uniform float uSize;
uniform float uSpeed;
uniform float uTurbulence;
uniform float uEffectIntensity;
uniform int uEffect;
uniform vec3 uLeftHand;
uniform vec3 uRightHand;
uniform float uHandRadius;
uniform float uAttractionForce;
uniform float uRepulsionForce;
uniform int uGesture;
uniform bool uRotateAxisX;
uniform bool uRotateAxisY;
uniform bool uRotateAxisZ;
uniform float uRotateSpeed;
// Lighting mode uniforms
uniform int uLightingMode;
uniform float uLightingSpeed;
uniform float uLightingIntensity;
uniform float uLightingRadius;
// Transition uniforms
uniform float uTransitionProgress;
uniform float uFloatOffset;
// GPGPU physics displacement texture
uniform sampler2D texturePhysics;
uniform bool uUseGPGPU;
// Audio reactive uniforms
uniform float uAudioBass;
uniform float uAudioMid;
uniform float uAudioTreble;
uniform float uAudioEnergy;

attribute vec3 originalPosition;
attribute vec3 targetPosition;
attribute vec3 color;
attribute vec3 targetColor;
attribute float randomOffset;
attribute vec2 texCoord;

varying vec3 vColor;
varying float vOpacity;
varying float vDistance;
varying float vLightingGlow;

// Simplex noise function
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
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 applyEffect(vec3 pos, vec3 originalPos, float time) {
  vec3 result = pos;
  float t = time * uSpeed;
  float intensity = uEffectIntensity;
  
  // 0: none
  if (uEffect == 0) {
    return result;
  }
  // 1: wave
  else if (uEffect == 1) {
    result.y += sin(pos.x * 0.5 + t) * intensity * 20.0;
    result.y += sin(pos.z * 0.5 + t * 0.8) * intensity * 15.0;
  }
  // 2: spiral - rotate around original position
  else if (uEffect == 2) {
    float angle = t * 0.5 + length(originalPos.xz) * 0.1;
    float radius = length(originalPos.xz);
    vec3 offset = vec3(
      cos(angle) * radius - originalPos.x,
      sin(t * 0.3 + randomOffset * 6.28) * intensity * 10.0,
      sin(angle) * radius - originalPos.z
    );
    result = originalPos + offset * intensity;
  }
  // 3: explode
  else if (uEffect == 3) {
    vec3 dir = normalize(pos);
    float dist = length(pos);
    result = pos + dir * sin(t * 2.0) * intensity * 30.0;
  }
  // 4: implode
  else if (uEffect == 4) {
    vec3 dir = normalize(pos);
    float dist = length(pos);
    result = pos - dir * sin(t * 2.0) * intensity * 20.0 * (1.0 - dist * 0.01);
  }
  // 5: noise
  else if (uEffect == 5) {
    result.x += snoise(pos * 0.02 + t * 0.5) * intensity * 30.0;
    result.y += snoise(pos * 0.02 + t * 0.5 + 100.0) * intensity * 30.0;
    result.z += snoise(pos * 0.02 + t * 0.5 + 200.0) * intensity * 30.0;
  }
  // 6: vortex - rotate around original Y axis
  else if (uEffect == 6) {
    float angle = t * 0.5 + originalPos.y * 0.05;
    float radius = length(originalPos.xz);
    vec3 offset = vec3(
      cos(angle) * radius - originalPos.x,
      0.0,
      sin(angle) * radius - originalPos.z
    );
    result = originalPos + offset * intensity;
  }
  // 7: pulse
  else if (uEffect == 7) {
    float pulse = sin(t * 3.0 + randomOffset * 6.28) * 0.5 + 0.5;
    vec3 dir = normalize(pos);
    result = pos + dir * pulse * intensity * 20.0;
  }
  // 8: flow
  else if (uEffect == 8) {
    result.x += sin(pos.y * 0.1 + t) * intensity * 15.0;
    result.z += cos(pos.y * 0.1 + t * 0.7) * intensity * 15.0;
  }
  // 9: rotate - smooth continuous rotation, shape fully preserved
  else if (uEffect == 9) {
    // Intensity modulates the angle (not position interpolation) to prevent shape distortion
    float angle = uTime * uRotateSpeed * intensity;
    float cosA = cos(angle);
    float sinA = sin(angle);
    
    vec3 rotated = originalPos;
    
    // X axis rotation (YZ plane)
    if (uRotateAxisX) {
      vec3 temp = rotated;
      rotated.y = temp.y * cosA - temp.z * sinA;
      rotated.z = temp.y * sinA + temp.z * cosA;
    }
    
    // Y axis rotation (XZ plane)
    if (uRotateAxisY) {
      vec3 temp = rotated;
      rotated.x = temp.x * cosA + temp.z * sinA;
      rotated.z = -temp.x * sinA + temp.z * cosA;
    }
    
    // Z axis rotation (XY plane)
    if (uRotateAxisZ) {
      vec3 temp = rotated;
      rotated.x = temp.x * cosA - temp.y * sinA;
      rotated.y = temp.x * sinA + temp.y * cosA;
    }
    
    // Apply rotation directly (preserves shape at all intensity levels)
    vec3 turbulenceOffset = pos - originalPos;
    result = rotated + turbulenceOffset;
  }
  // 10: float - entire object floats like a balloon
  else if (uEffect == 10) {
    // Apply uniform offset to all particles (uFloatOffset computed on CPU)
    result.y += uFloatOffset * intensity * 50.0;
    result.x += sin(t * 0.3) * intensity * 15.0;
    result.z += cos(t * 0.2) * intensity * 10.0;
  }
  
  return result;
}

// Physics-based hand interaction (sand/granular particle behavior)
vec3 applyHandInteraction(vec3 pos) {
  vec3 result = pos;
  
  // Process left hand - push particles like sand
  if (length(uLeftHand) > 0.001) {
    vec3 toParticle = pos - uLeftHand;
    float dist = length(toParticle);
    
    if (dist < uHandRadius && dist > 0.01) {
      float normalizedDist = dist / uHandRadius;
      // Cubic falloff for natural granular response
      float force = pow(1.0 - normalizedDist, 3.0);
      
      vec3 pushDir = normalize(toParticle);
      
      // Add organic noise for scatter variation (like real sand grains)
      float n1 = snoise(pos * 0.03 + uTime * 0.5);
      float n2 = snoise(pos * 0.03 + uTime * 0.5 + 100.0);
      float n3 = snoise(pos * 0.03 + uTime * 0.5 + 200.0);
      pushDir += vec3(n1, n2, n3) * 0.3;
      pushDir = normalize(pushDir);
      
      // Slight upward bias for realistic scatter
      pushDir.y += 0.1 * force;
      
      float strength = force * uRepulsionForce * 100.0;
      result += pushDir * strength;
    }
  }
  
  // Process right hand - same physics-based push
  if (length(uRightHand) > 0.001) {
    vec3 toParticle = pos - uRightHand;
    float dist = length(toParticle);
    
    if (dist < uHandRadius && dist > 0.01) {
      float normalizedDist = dist / uHandRadius;
      float force = pow(1.0 - normalizedDist, 3.0);
      
      vec3 pushDir = normalize(toParticle);
      
      float n1 = snoise(pos * 0.03 + uTime * 0.5 + 300.0);
      float n2 = snoise(pos * 0.03 + uTime * 0.5 + 400.0);
      float n3 = snoise(pos * 0.03 + uTime * 0.5 + 500.0);
      pushDir += vec3(n1, n2, n3) * 0.3;
      pushDir = normalize(pushDir);
      
      pushDir.y += 0.1 * force;
      
      float strength = force * uRepulsionForce * 100.0;
      result += pushDir * strength;
    }
  }
  
  return result;
}

// Lighting glow calculation
float calculateLightingGlow(vec3 pos, float time) {
  float glow = 0.0;
  float t = time * uLightingSpeed;
  
  // 0: none
  if (uLightingMode == 0) {
    return 0.0;
  }
  // 1: move - glowing area moves in one direction (extended range)
  else if (uLightingMode == 1) {
    float wavePos = mod(t * 100.0, 600.0) - 300.0;
    float dist = abs(pos.x - wavePos);
    if (dist < uLightingRadius) {
      glow = (1.0 - dist / uLightingRadius) * uLightingIntensity;
    }
  }
  // 2: expand - light expands from center outward, fades at edge
  else if (uLightingMode == 2) {
    float expandRadius = mod(t * 150.0, 400.0);
    float dist = length(pos);
    float diff = abs(dist - expandRadius);
    if (diff < uLightingRadius) {
      glow = (1.0 - diff / uLightingRadius) * uLightingIntensity;
    }
    // Gradually fade out as the ring approaches max radius
    float fadeOut = 1.0 - smoothstep(280.0, 400.0, expandRadius);
    glow *= fadeOut;
  }
  // 3: contract - light contracts from outside to center, fades at center
  else if (uLightingMode == 3) {
    float maxRadius = 400.0;
    float contractRadius = maxRadius - mod(t * 150.0, maxRadius);
    float dist = length(pos);
    float diff = abs(dist - contractRadius);
    if (diff < uLightingRadius) {
      glow = (1.0 - diff / uLightingRadius) * uLightingIntensity;
    }
    // Gradually fade out as the ring approaches center
    float fadeOut = smoothstep(0.0, 120.0, contractRadius);
    glow *= fadeOut;
  }
  // 4: pulse - entire scene pulsates like a heartbeat
  else if (uLightingMode == 4) {
    glow = (sin(t * 3.0) * 0.5 + 0.5) * uLightingIntensity;
  }
  // 5: wave - wave-like light pattern
  else if (uLightingMode == 5) {
    float wave = sin(pos.x * 0.05 + pos.z * 0.05 + t * 2.0);
    glow = (wave * 0.5 + 0.5) * uLightingIntensity;
  }
  
  return clamp(glow, 0.0, 1.0);
}

void main() {
  // Transition: interpolate from original to target position
  vec3 basePosition = mix(originalPosition, targetPosition, uTransitionProgress);
  
  // Apply turbulence
  vec3 turbulence = vec3(
    snoise(basePosition * 0.01 + uTime * 0.2) * uTurbulence * 10.0,
    snoise(basePosition * 0.01 + uTime * 0.2 + 100.0) * uTurbulence * 10.0,
    snoise(basePosition * 0.01 + uTime * 0.2 + 200.0) * uTurbulence * 10.0
  );
  
  vec3 pos = basePosition + turbulence;
  
  // Apply effect (pass originalPosition to prevent rotation accumulation)
  pos = applyEffect(pos, basePosition, uTime);
  
  // Apply physics: GPGPU displacement or vertex-shader hand interaction
  if (uUseGPGPU) {
    vec3 physicsDisplacement = texture2D(texturePhysics, texCoord).xyz;
    pos += physicsDisplacement;
  } else {
    pos = applyHandInteraction(pos);
  }
  
  // Calculate lighting glow
  vLightingGlow = calculateLightingGlow(pos, uTime);
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // Perspective-based size scaling
  float distanceScale = 300.0 / -mvPosition.z;
  gl_PointSize = uSize * distanceScale;
  gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);
  
  // Size increase from lighting glow
  gl_PointSize *= (1.0 + vLightingGlow * 0.5);
  
  // Audio-reactive size modulation
  gl_PointSize *= (1.0 + uAudioBass * 0.5 + uAudioTreble * 0.3);
  
  gl_Position = projectionMatrix * mvPosition;
  
  // Color transition
  vColor = mix(color, targetColor, uTransitionProgress);
  vOpacity = 1.0;
  vDistance = -mvPosition.z;
}
`;

// Particle fragment shader
export const particleFragmentShader = `
uniform float uOpacity;
uniform int uPrevColorMode;
uniform int uCurrColorMode;
uniform float uColorBlend;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform float uTime;
uniform float uAudioEnergy;
uniform float uAudioBass;

varying vec3 vColor;
varying float vOpacity;
varying float vDistance;
varying float vLightingGlow;

// Compute color for a given color mode index
vec3 getColorForMode(int mode) {
  // 0: original
  if (mode == 0) {
    return vColor;
  }
  // 1: gradient
  else if (mode == 1) {
    float t = vDistance * 0.002;
    return mix(uPrimaryColor, uSecondaryColor, clamp(t, 0.0, 1.0));
  }
  // 2: rainbow
  else if (mode == 2) {
    float hue = fract(vDistance * 0.003 + uTime * 0.1);
    vec3 rainbow = vec3(
      abs(hue * 6.0 - 3.0) - 1.0,
      2.0 - abs(hue * 6.0 - 2.0),
      2.0 - abs(hue * 6.0 - 4.0)
    );
    return clamp(rainbow, 0.0, 1.0);
  }
  // 3: monochrome
  else if (mode == 3) {
    float gray = dot(vColor, vec3(0.299, 0.587, 0.114));
    return vec3(gray) * uPrimaryColor;
  }
  // 4: temperature
  else if (mode == 4) {
    float t = vDistance * 0.002;
    vec3 cold = vec3(0.0, 0.5, 1.0);
    vec3 hot = vec3(1.0, 0.3, 0.0);
    return mix(hot, cold, clamp(t, 0.0, 1.0));
  }
  return vColor;
}

void main() {
  // Circular particle (disc)
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) {
    discard;
  }
  
  // Smooth edge
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  
  // Smooth color mode transition: blend between previous and current mode
  vec3 prevColor = getColorForMode(uPrevColorMode);
  vec3 currColor = getColorForMode(uCurrColorMode);
  vec3 finalColor = mix(prevColor, currColor, uColorBlend);
  
  // Apply lighting glow
  finalColor += vLightingGlow * uPrimaryColor * 1.5;
  
  // Glow effect
  float glow = exp(-dist * 4.0) * 0.5;
  finalColor += glow * uPrimaryColor;
  
  // Audio-reactive glow
  finalColor += uAudioEnergy * uPrimaryColor * 0.8;
  
  // Alpha increase from lighting
  float finalAlpha = alpha * uOpacity * vOpacity * (1.0 + vLightingGlow * 0.3);
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;
