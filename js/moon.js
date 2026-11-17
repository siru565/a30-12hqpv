// 달의 밝은 면을 SVG path로. illum: 밝은 비율(0~1), waxing: 차오르는 중이면 오른쪽이 밝다.
(function () {
  const A = (window.A30 = window.A30 || {});
  A.moonPath = (illum, waxing, r = 40, c = 50) => {
    const top = c - r, bottom = c + r;
    const rx = Math.round(r * Math.abs(1 - 2 * illum) * 10) / 10;
    const outer = waxing ? 1 : 0;              // 밝은 쪽 테두리: 오른쪽(1) / 왼쪽(0)
    const bulgeToLit = illum < 0.5;            // 초승·그믐이면 명암 경계가 밝은 쪽으로 볼록
    const inner = bulgeToLit ? 1 - outer : outer;
    return `M${c} ${top} A${r} ${r} 0 0 ${outer} ${c} ${bottom} A${rx} ${r} 0 0 ${inner} ${c} ${top} Z`;
  };
})();
