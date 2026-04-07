/* ============================================================
   charts.js — Canvas-based charts for FinAI
   ============================================================ */

const Charts = {

  // Mini sparkline on hero card
  drawMiniChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const points = [42, 50, 45, 58, 62, 55, 70, 68, 78, 72, 85, 80, 87];
    const min = Math.min(...points), max = Math.max(...points);
    const pad = 6;
    const xs = (i) => pad + (i / (points.length - 1)) * (w - pad * 2);
    const ys = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);

    ctx.clearRect(0, 0, w, h);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(59,130,246,0.35)');
    grad.addColorStop(1, 'rgba(59,130,246,0)');

    ctx.beginPath();
    ctx.moveTo(xs(0), ys(points[0]));
    points.forEach((p, i) => {
      if (i === 0) return;
      const cpx = (xs(i - 1) + xs(i)) / 2;
      ctx.bezierCurveTo(cpx, ys(points[i - 1]), cpx, ys(p), xs(i), ys(p));
    });
    ctx.lineTo(xs(points.length - 1), h);
    ctx.lineTo(xs(0), h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xs(0), ys(points[0]));
    points.forEach((p, i) => {
      if (i === 0) return;
      const cpx = (xs(i - 1) + xs(i)) / 2;
      ctx.bezierCurveTo(cpx, ys(points[i - 1]), cpx, ys(p), xs(i), ys(p));
    });
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // End dot
    ctx.beginPath();
    ctx.arc(xs(points.length - 1), ys(points[points.length - 1]), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
  },

  // Sentiment timeline chart
  drawSentimentChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth || 320;
    const h = canvas.height = 160;
    const { labels, positive, negative } = data;
    const pad = { top: 16, right: 16, bottom: 28, left: 28 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const xs = (i) => pad.left + (i / (labels.length - 1)) * chartW;
    const ys = (v) => pad.top + chartH - (v / 100) * chartH;

    // Get theme colors
    const styles = getComputedStyle(document.body);
    const gridColor = styles.getPropertyValue('--border-color').trim() || 'rgba(136,153,187,0.2)';
    const textColor = styles.getPropertyValue('--text-secondary').trim() || '#8899bb';

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(v => {
      ctx.beginPath();
      ctx.moveTo(pad.left, ys(v));
      ctx.lineTo(pad.left + chartW, ys(v));
      ctx.stroke();
    });

    // Labels bottom
    ctx.fillStyle = textColor;
    ctx.font = '9px Inter';
    ctx.textAlign = 'center';
    labels.forEach((l, i) => {
      if (i % 2 === 0) ctx.fillText(l, xs(i), h - 6);
    });

    // Draw line helper
    const drawLine = (arr, color, gradColor) => {
      const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
      grad.addColorStop(0, gradColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.moveTo(xs(0), ys(arr[0]));
      arr.forEach((v, i) => {
        if (i === 0) return;
        const cpx = (xs(i - 1) + xs(i)) / 2;
        ctx.bezierCurveTo(cpx, ys(arr[i - 1]), cpx, ys(v), xs(i), ys(v));
      });
      ctx.lineTo(xs(arr.length - 1), h - pad.bottom);
      ctx.lineTo(xs(0), h - pad.bottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xs(0), ys(arr[0]));
      arr.forEach((v, i) => {
        if (i === 0) return;
        const cpx = (xs(i - 1) + xs(i)) / 2;
        ctx.bezierCurveTo(cpx, ys(arr[i - 1]), cpx, ys(v), xs(i), ys(v));
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawLine(positive, '#22c55e', 'rgba(34,197,94,0.25)');
    drawLine(negative, '#ef4444', 'rgba(239,68,68,0.2)');

    // Dots on last point
    [[positive, '#22c55e'], [negative, '#ef4444']].forEach(([arr, c]) => {
      ctx.beginPath();
      ctx.arc(xs(arr.length - 1), ys(arr[arr.length - 1]), 4, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
    });
  }
};

window.Charts = Charts;
