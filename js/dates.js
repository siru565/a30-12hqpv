// 날짜 계산. 모두 KST(UTC+9) 고정이며 기기 시간대와 무관하다 (Date.UTC / epoch 연산만 사용).
(function () {
  const A = (window.A30 = window.A30 || {});
  const DAY = 86400000;
  const KST_OFFSET = 9 * 3600000;
  const pad = n => String(n).padStart(2, '0');

  A.KST_MS = (y, m, d) => Date.UTC(y, m - 1, d) - KST_OFFSET;
  A.daysSince = (startMs, nowMs) => Math.floor((nowMs - startMs) / DAY);
  A.clockKST = nowMs => {
    const s = Math.floor((((nowMs + KST_OFFSET) % DAY) + DAY) % DAY / 1000);
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  };
  A.weekdayKo = (y, m, d) => '일월화수목금토'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
})();
