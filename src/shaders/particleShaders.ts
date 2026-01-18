// 파티클 버텍스 셰이더 - GPU 최적화
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
uniform int uGesture;uniform bool uRotateAxisX;
uniform bool uRotateAxisY;
uniform bool uRotateAxisZ;
// 라이팅 모드 유니폼
uniform int uLightingMode;
uniform float uLightingSpeed;
uniform float uLightingIntensity;
uniform float uLightingRadius;

// 트랜지션 유니폼
uniform float uTransitionProgress;
uniform float uFloatOffset; // 전체 부유 오프셋

attribute vec3 originalPosition;
attribute vec3 targetPosition;
attribute vec3 color;
attribute vec3 targetColor;
attribute float randomOffset;

varying vec3 vColor;
varying float vOpacity;
varying float vDistance;
varying float vLightingGlow;

// Simplex noise 함수
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
  // 2: spiral - originalPosition 기준으로 회전
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
  // 6: vortex - originalPosition 기준으로 회전
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
  // 9: rotate - originalPosition 기준으로 회전 (속도 감소)
  else if (uEffect == 9) {
    vec3 rotated = originalPos;
    float angle = t * 0.3 * intensity; // 속도를 0.3배로 감소
    float cosA = cos(angle);
    float sinA = sin(angle);
    
    // X축 회전 (YZ 평면에서 회전)
    if (uRotateAxisX) {
      vec3 temp = rotated;
      rotated.y = temp.y * cosA - temp.z * sinA;
      rotated.z = temp.y * sinA + temp.z * cosA;
    }
    
    // Y축 회전 (XZ 평면에서 회전)
    if (uRotateAxisY) {
      vec3 temp = rotated;
      rotated.x = temp.x * cosA + temp.z * sinA;
      rotated.z = -temp.x * sinA + temp.z * cosA;
    }
    
    // Z축 회전 (XY 평면에서 회전)
    if (uRotateAxisZ) {
      vec3 temp = rotated;
      rotated.x = temp.x * cosA - temp.y * sinA;
      rotated.y = temp.x * sinA + temp.y * cosA;
    }
    
    // intensity는 이미 angle 계산에 적용되어 있으므로 mix 사용 안 함
    result = rotated;
  }
  // 10: float - 전체 객체가 풍선처럼 움직임
  else if (uEffect == 10) {
    // 전체 객체에 동일한 오프셋 적용 (uFloatOffset은 CPU에서 계산)
    result.y += uFloatOffset * intensity * 50.0;
    result.x += sin(t * 0.3) * intensity * 15.0;
    result.z += cos(t * 0.2) * intensity * 10.0;
  }
  
  return result;
}

vec3 applyHandInteraction(vec3 pos) {
  vec3 result = pos;
  
  // 왼손 상호작용
  if (uLeftHand.x != 0.0 || uLeftHand.y != 0.0 || uLeftHand.z != 0.0) {
    vec3 toHand = uLeftHand - pos;
    float dist = length(toHand);
    
    if (dist < uHandRadius) {
      float force = 1.0 - (dist / uHandRadius);
      force = force * force; // 부드러운 감쇠
      
      // 제스처에 따른 동작
      if (uGesture == 1) { // open - 밀어내기
        result -= normalize(toHand) * force * uRepulsionForce * 50.0;
      } else if (uGesture == 2) { // closed - 당기기
        result += normalize(toHand) * force * uAttractionForce * 30.0;
      } else if (uGesture == 3) { // pinch - 모으기
        result += normalize(toHand) * force * uAttractionForce * 50.0;
      }
    }
  }
  
  // 오른손 상호작용
  if (uRightHand.x != 0.0 || uRightHand.y != 0.0 || uRightHand.z != 0.0) {
    vec3 toHand = uRightHand - pos;
    float dist = length(toHand);
    
    if (dist < uHandRadius) {
      float force = 1.0 - (dist / uHandRadius);
      force = force * force;
      
      if (uGesture == 1) {
        result -= normalize(toHand) * force * uRepulsionForce * 50.0;
      } else if (uGesture == 2) {
        result += normalize(toHand) * force * uAttractionForce * 30.0;
      } else if (uGesture == 3) {
        result += normalize(toHand) * force * uAttractionForce * 50.0;
      }
    }
  }
  
  return result;
}

// 라이팅 모드 계산
float calculateLightingGlow(vec3 pos, float time) {
  float glow = 0.0;
  float t = time * uLightingSpeed;
  
  // 0: none
  if (uLightingMode == 0) {
    return 0.0;
  }
  // 1: move - 특정 방향으로 발광 영역이 이동 (확장된 범위)
  else if (uLightingMode == 1) {
    float wavePos = mod(t * 100.0, 600.0) - 300.0; // -300 ~ 300 (파티클 범위 초과)
    float dist = abs(pos.x - wavePos);
    if (dist < uLightingRadius) {
      glow = (1.0 - dist / uLightingRadius) * uLightingIntensity;
    }
  }
  // 2: expand - 중심에서 바깥으로 확산 (확장된 범위)
  else if (uLightingMode == 2) {
    float expandRadius = mod(t * 150.0, 400.0); // 0 ~ 400 (파티클 범위 초과)
    float dist = length(pos);
    float diff = abs(dist - expandRadius);
    if (diff < uLightingRadius) {
      glow = (1.0 - diff / uLightingRadius) * uLightingIntensity;
    }
  }
  // 3: contract - 바깥에서 중심으로 수축 (확장된 범위)
  else if (uLightingMode == 3) {
    float maxRadius = 400.0; // 파티클 범위 초과
    float contractRadius = maxRadius - mod(t * 150.0, maxRadius);
    float dist = length(pos);
    float diff = abs(dist - contractRadius);
    if (diff < uLightingRadius) {
      glow = (1.0 - diff / uLightingRadius) * uLightingIntensity;
    }
  }
  // 4: pulse - 전체가 맥박처럼 깜빡임
  else if (uLightingMode == 4) {
    glow = (sin(t * 3.0) * 0.5 + 0.5) * uLightingIntensity;
  }
  // 5: wave - 파동 형태로 발광
  else if (uLightingMode == 5) {
    float wave = sin(pos.x * 0.05 + pos.z * 0.05 + t * 2.0);
    glow = (wave * 0.5 + 0.5) * uLightingIntensity;
  }
  
  return clamp(glow, 0.0, 1.0);
}

void main() {
  // 트랜지션: 원래 위치에서 타겟 위치로 보간
  vec3 basePosition = mix(originalPosition, targetPosition, uTransitionProgress);
  
  // 터뷸런스 적용
  vec3 turbulence = vec3(
    snoise(basePosition * 0.01 + uTime * 0.2) * uTurbulence * 10.0,
    snoise(basePosition * 0.01 + uTime * 0.2 + 100.0) * uTurbulence * 10.0,
    snoise(basePosition * 0.01 + uTime * 0.2 + 200.0) * uTurbulence * 10.0
  );
  
  vec3 pos = basePosition + turbulence;
  
  // 이펙트 적용 (originalPosition 전달하여 회전 누적 방지)
  pos = applyEffect(pos, basePosition, uTime);
  
  // 손 상호작용 적용
  pos = applyHandInteraction(pos);
  
  // 라이팅 글로우 계산
  vLightingGlow = calculateLightingGlow(pos, uTime);
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // 거리에 따른 크기 조절 (원근감)
  float distanceScale = 300.0 / -mvPosition.z;
  gl_PointSize = uSize * distanceScale;
  gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);
  
  // 라이팅으로 인한 크기 증가
  gl_PointSize *= (1.0 + vLightingGlow * 0.5);
  
  gl_Position = projectionMatrix * mvPosition;
  
  // 색상 트랜지션
  vColor = mix(color, targetColor, uTransitionProgress);
  vOpacity = 1.0;
  vDistance = -mvPosition.z;
}
`;

// 파티클 프래그먼트 셰이더
export const particleFragmentShader = `
uniform float uOpacity;
uniform int uColorMode;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform float uTime;
uniform float uColorTransitionProgress;

varying vec3 vColor;
varying float vOpacity;
varying float vDistance;
varying float vLightingGlow;

void main() {
  // 원형 파티클 (디스크)
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) {
    discard;
  }
  
  // 부드러운 가장자리
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  
  vec3 finalColor = vColor;
  
  // 컬러 모드 적용
  // 0: original
  if (uColorMode == 0) {
    finalColor = vColor;
  }
  // 1: gradient
  else if (uColorMode == 1) {
    float t = vDistance * 0.002;
    finalColor = mix(uPrimaryColor, uSecondaryColor, clamp(t, 0.0, 1.0));
  }
  // 2: rainbow
  else if (uColorMode == 2) {
    float hue = fract(vDistance * 0.003 + uTime * 0.1);
    vec3 rainbow = vec3(
      abs(hue * 6.0 - 3.0) - 1.0,
      2.0 - abs(hue * 6.0 - 2.0),
      2.0 - abs(hue * 6.0 - 4.0)
    );
    finalColor = clamp(rainbow, 0.0, 1.0);
  }
  // 3: monochrome
  else if (uColorMode == 3) {
    float gray = dot(vColor, vec3(0.299, 0.587, 0.114));
    finalColor = vec3(gray) * uPrimaryColor;
  }
  // 4: temperature
  else if (uColorMode == 4) {
    float t = vDistance * 0.002;
    vec3 cold = vec3(0.0, 0.5, 1.0);
    vec3 hot = vec3(1.0, 0.3, 0.0);
    finalColor = mix(hot, cold, clamp(t, 0.0, 1.0));
  }
  
  // 라이팅 글로우 적용
  finalColor += vLightingGlow * uPrimaryColor * 1.5;
  
  // 글로우 효과
  float glow = exp(-dist * 4.0) * 0.5;
  finalColor += glow * uPrimaryColor;
  
  // 라이팅으로 인한 알파 증가
  float finalAlpha = alpha * uOpacity * vOpacity * (1.0 + vLightingGlow * 0.3);
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;
