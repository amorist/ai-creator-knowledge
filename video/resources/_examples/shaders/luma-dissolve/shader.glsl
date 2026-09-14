// 柔和亮度溶解（示例草稿）：阈值从 uFrom 的暗部扫到亮部，先暗后亮地被 uTo 吃掉。
// 只允许片元主体：不要写任何井号开头的编译指令，也不要引入基于时间的输入 ——
// 渲染必须只依赖 uProgress，才能逐帧复现、可 seek。
// 采样口径与内置 GL 转场一致（contain）：p = (vUv - fit.zw) / fit.xy，画面外给黑。

vec4 sampleFit(sampler2D tex, vec4 fit, vec2 uv) {
  vec2 p = (uv - fit.zw) / fit.xy;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0, 0.0, 0.0, 1.0);
  return texture2D(tex, p);
}

float lumaOf(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);
  vec4 from = sampleFit(uFrom, uFitFrom, vUv);
  vec4 to = sampleFit(uTo, uFitTo, vUv);

  float softness = 0.12;
  float threshold = mix(-softness, 1.0 + softness, p);
  float weight = 1.0 - smoothstep(threshold - softness, threshold + softness, lumaOf(from.rgb));
  gl_FragColor = vec4(mix(from.rgb, to.rgb, weight), 1.0);
}
