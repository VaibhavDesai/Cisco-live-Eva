#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_viewport;
uniform vec2 u_pose;
uniform vec2 u_right_accent_offset;
uniform float u_right_accent_opacity;
uniform float u_dpr;
uniform float u_grain;

const float RAMP_BLUR_STRENGTH = 1.0;
out vec4 fragColor;

float erfApprox(float x) {
  float signX = sign(x);
  x = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * x);
  float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x);
  return signX * y;
}

float gaussianRelu(float x, float sigma) {
  if (sigma < 0.00001) return max(x, 0.0);
  float z = x / sigma;
  float cdf = 0.5 * (1.0 + erfApprox(z / 1.41421356237));
  float pdf = 0.3989422804 * exp(-0.5 * z * z);
  return x * cdf + sigma * pdf;
}

vec4 blurredSkyRamp(float t, float sigma) {
  const float p0 = 0.283119, p1 = 0.316113, p2 = 0.602679, p3 = 1.0;
  const vec4 c0 = vec4(0.6705882353, 0.8666666667, 1.0, 1.0);
  const vec4 c1 = vec4(0.3803921569, 0.5843137255, 1.0, 1.0);
  const vec4 c2 = vec4(0.0470588235, 0.0901960784, 0.3568627451, 1.0);
  const vec4 c3 = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 s0 = (c1 - c0) / (p1 - p0);
  vec4 s1 = (c2 - c1) / (p2 - p1);
  vec4 s2 = (c3 - c2) / (p3 - p2);
  vec4 result = c0;
  result += s0 * gaussianRelu(t - p0, sigma);
  result += (s1 - s0) * gaussianRelu(t - p1, sigma);
  result += (s2 - s1) * gaussianRelu(t - p2, sigma);
  result -= s2 * gaussianRelu(t - p3, sigma);
  return clamp(result, 0.0, 1.0);
}

vec4 blurredAccentRamp(float t, float sigma, float p0, float p1, float p2) {
  const vec4 c0 = vec4(0.7960784314, 0.9372549020, 0.4117647059, 1.0);
  const vec4 c1 = vec4(1.0, 0.4862745098, 0.0, 1.0);
  const vec4 c2 = vec4(0.4039215686, 0.0, 0.5058823529, 1.0);
  vec4 s0 = (c1 - c0) / (p1 - p0);
  vec4 s1 = (c2 - c1) / (p2 - p1);
  vec4 result = c0;
  result += s0 * gaussianRelu(t - p0, sigma);
  result += (s1 - s0) * gaussianRelu(t - p1, sigma);
  result -= s1 * gaussianRelu(t - p2, sigma);
  return clamp(result, 0.0, 1.0);
}

vec2 rotateAround(vec2 point, vec2 center, float angle) {
  vec2 delta = point - center;
  float c = cos(angle);
  float s = sin(angle);
  return center + vec2(c * delta.x - s * delta.y, s * delta.x + c * delta.y);
}

vec2 inverseMatrix(vec2 point, vec4 matrix, vec2 translation) {
  vec2 delta = point - translation;
  float determinant = matrix.x * matrix.w - matrix.y * matrix.z;
  return vec2(
    (matrix.w * delta.x - matrix.z * delta.y) / determinant,
    (-matrix.y * delta.x + matrix.x * delta.y) / determinant
  );
}

float ellipseDistance(vec2 centered, vec2 radii, out float normalizedRadius) {
  vec2 normalized = centered / radii;
  normalizedRadius = length(normalized);
  if (normalizedRadius < 0.00001) return -min(radii.x, radii.y);
  float gradientLength = length(centered / (radii * radii)) / normalizedRadius;
  return (normalizedRadius - 1.0) / max(gradientLength, 0.00001);
}

vec4 ellipseLayer(vec2 designPoint, int index) {
  vec2 local;
  vec2 center;
  vec2 radii;
  vec2 gradientStart;
  vec2 gradientEnd;
  float sigma;

  if (index == 0) {
    center = vec2(772.66, 592.66);
    radii = vec2(576.274);
    local = rotateAround(designPoint, center, 3.1198633044);
    gradientStart = vec2(772.66, 16.3868);
    gradientEnd = vec2(1102.72, 860.711);
    sigma = 110.0;
  } else if (index == 1) {
    center = vec2(84.3841, 451.941);
    radii = vec2(84.3841, 451.941);
    local = inverseMatrix(
      designPoint,
      vec4(0.147644, 0.989041, 0.989041, -0.147644),
      vec2(813.0, 763.219)
    );
    gradientStart = vec2(145.934, 357.461);
    gradientEnd = vec2(-92.4818, 490.076);
    sigma = 65.0;
  } else {
    center = vec2(1534.09, 736.301);
    radii = vec2(286.981, 285.902);
    local = rotateAround(designPoint, center, -2.9973935508);
    gradientStart = vec2(1743.41, 676.532);
    gradientEnd = vec2(1636.62, 995.87);
    sigma = 100.0;
  }

  vec2 centered = local - center;
  float normalizedRadius;
  float signedDistance = ellipseDistance(centered, radii, normalizedRadius);
  float shapeAlpha = 0.5 * (1.0 - erfApprox(signedDistance / (1.41421356237 * sigma)));

  vec2 implicitNormal = centered / (radii * radii);
  vec2 normal = length(implicitNormal) > 0.00001 ? normalize(implicitNormal) : vec2(0.0);
  vec2 colorLocal = local - normal * sigma * 1.8 * (1.0 - shapeAlpha);
  vec2 shifted = colorLocal - center;
  float shiftedRadius = length(shifted / radii);
  if (shiftedRadius > 1.0) colorLocal = center + shifted / shiftedRadius;

  vec2 gradientVector = gradientEnd - gradientStart;
  float t = dot(colorLocal - gradientStart, gradientVector) / dot(gradientVector, gradientVector);
  float gradientSigma = sigma / length(gradientVector) * RAMP_BLUR_STRENGTH;

  vec4 color;
  if (index == 0) {
    color = blurredSkyRamp(t, gradientSigma);
  } else if (index == 1) {
    color = blurredAccentRamp(t, gradientSigma, 0.182118, 0.412175, 0.776846);
  } else {
    color = blurredAccentRamp(t, gradientSigma, 0.0, 0.321391, 0.795053);
  }
  color.a *= shapeAlpha;
  return color;
}

vec3 over(vec3 destination, vec4 source) {
  return source.rgb * source.a + destination * (1.0 - source.a);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 overlay(vec3 base, float blend) {
  vec3 low = 2.0 * base * blend;
  vec3 high = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
  return mix(low, high, step(vec3(0.5), base));
}

void main() {
  vec2 screenPoint = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y) / u_dpr;
  float scale = max(u_viewport.x / 1280.0, u_viewport.y / 720.0);
  vec2 stageOffset = vec2(
    u_viewport.x - 1280.0 * scale,
    u_viewport.y - 720.0 * scale
  );
  vec2 designPoint = (screenPoint - stageOffset) / scale - u_pose;

  vec3 color = vec3(0.0);
  color = over(color, ellipseLayer(designPoint, 0));
  color = over(color, ellipseLayer(designPoint, 1));
  vec4 rightAccent = ellipseLayer(designPoint - u_right_accent_offset, 2);
  rightAccent.a *= u_right_accent_opacity;
  color = over(color, rightAccent);

  vec2 grainCell = floor(screenPoint * 0.75);
  float noise = hash12(grainCell) * 0.6666667
    + hash12(grainCell * 2.0 + 19.17) * 0.3333333;
  color = mix(color, overlay(color, noise), u_grain);
  fragColor = vec4(color, 1.0);
}
