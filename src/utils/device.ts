/**
 * 设备指纹：用于游客身份按设备限次（每台设备免费 3 次）。
 *
 * 由稳定的浏览器属性哈希生成（不依赖 localStorage，清缓存也无法绕过）：
 * User-Agent / 语言 / 平台 / 屏幕尺寸 / 色深 / 时区 / 硬件并发数。
 * 局限：两台完全相同的设备可能误判为同一台（概率很低）；隐私模式无法识别为同一设备。
 */
export function getDeviceFingerprint(): string {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      navigator.platform || '',
      String(screen.width),
      String(screen.height),
      String(screen.colorDepth),
      String(new Date().getTimezoneOffset()),
      String(navigator.hardwareConcurrency || ''),
    ];
    let hash = 0x811c9dc5;
    for (const p of parts) {
      for (let i = 0; i < p.length; i++) {
        hash ^= p.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
    }
    return `d_${(hash >>> 0).toString(36)}`;
  } catch {
    return 'd_unknown';
  }
}
