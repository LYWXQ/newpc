const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const outputDir = path.join(__dirname, '../src/static/tabbar');
const size = 56; // 图标尺寸

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 颜色定义
const colorNormal = { r: 153, g: 153, b: 153 }; // #999999
const colorActive = { r: 0, g: 122, b: 255 };   // #007aff

// 创建空白 PNG
function createPNG(size) {
  const png = new PNG({ width: size, height: size });
  // 填充透明背景
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;     // R
    png.data[i + 1] = 0; // G
    png.data[i + 2] = 0; // B
    png.data[i + 3] = 0; // A (透明)
  }
  return png;
}

// 绘制像素点
function setPixel(png, x, y, color, alpha = 255) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = alpha;
}

// 绘制抗锯齿线条（使用 Wu's line algorithm 的简化版）
function drawLine(png, x0, y0, x1, y1, color, width = 1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    // 绘制圆角线端
    for (let w = -Math.floor(width / 2); w <= Math.floor(width / 2); w++) {
      if (dx > dy) {
        setPixel(png, x0, y0 + w, color);
      } else {
        setPixel(png, x0 + w, y0, color);
      }
    }

    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

// 绘制圆
function drawCircle(png, cx, cy, radius, color, fill = false) {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const dist = Math.sqrt(x * x + y * y);
      if (fill) {
        if (dist <= radius) {
          setPixel(png, cx + x, cy + y, color);
        }
      } else {
        if (dist >= radius - 1.5 && dist <= radius + 0.5) {
          setPixel(png, cx + x, cy + y, color);
        }
      }
    }
  }
}

// 绘制矩形
function drawRect(png, x, y, w, h, color, fill = false) {
  if (fill) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        setPixel(png, px, py, color);
      }
    }
  } else {
    // 上边框
    for (let px = x; px < x + w; px++) {
      setPixel(png, px, y, color);
      setPixel(png, px, y + 1, color);
    }
    // 下边框
    for (let px = x; px < x + w; px++) {
      setPixel(png, px, y + h - 1, color);
      setPixel(png, px, y + h - 2, color);
    }
    // 左边框
    for (let py = y; py < y + h; py++) {
      setPixel(png, x, py, color);
      setPixel(png, x + 1, py, color);
    }
    // 右边框
    for (let py = y; py < y + h; py++) {
      setPixel(png, x + w - 1, py, color);
      setPixel(png, x + w - 2, py, color);
    }
  }
}

// 绘制首页图标（房子形状）
function drawHome(png, color) {
  const padding = Math.floor(size * 0.12);
  const centerX = size / 2;
  const baseY = size - padding - 4;
  const roofY = padding + 6;

  // 房子主体（三角形屋顶 + 矩形底部）
  const houseWidth = size - padding * 2 - 8;
  const houseHeight = (baseY - roofY) * 0.65;
  const wallTop = baseY - houseHeight;

  // 绘制屋顶（三角形）
  for (let y = roofY; y <= wallTop; y++) {
    const progress = (y - roofY) / (wallTop - roofY);
    const halfWidth = (houseWidth / 2) * progress;
    const leftX = Math.floor(centerX - halfWidth);
    const rightX = Math.floor(centerX + halfWidth);
    for (let x = leftX; x <= rightX; x++) {
      setPixel(png, x, y, color);
    }
  }

  // 绘制墙壁
  for (let y = Math.floor(wallTop); y <= baseY; y++) {
    for (let x = Math.floor(centerX - houseWidth / 2); x <= Math.floor(centerX + houseWidth / 2); x++) {
      setPixel(png, x, y, color);
    }
  }

  // 绘制门
  const doorWidth = houseWidth * 0.25;
  const doorHeight = houseHeight * 0.55;
  const doorColor = { r: 255, g: 255, b: 255 }; // 白色门（镂空效果）
  for (let y = Math.floor(baseY - doorHeight); y <= baseY; y++) {
    for (let x = Math.floor(centerX - doorWidth / 2); x <= Math.floor(centerX + doorWidth / 2); x++) {
      setPixel(png, x, y, doorColor);
    }
  }
}

// 绘制首页图标（填充版本 - 选中状态）
function drawHomeActive(png, color) {
  const padding = Math.floor(size * 0.12);
  const centerX = size / 2;
  const baseY = size - padding - 4;
  const roofY = padding + 6;

  const houseWidth = size - padding * 2 - 8;
  const houseHeight = (baseY - roofY) * 0.65;
  const wallTop = baseY - houseHeight;

  // 绘制屋顶（三角形）
  for (let y = roofY; y <= wallTop; y++) {
    const progress = (y - roofY) / (wallTop - roofY);
    const halfWidth = (houseWidth / 2) * progress;
    const leftX = Math.floor(centerX - halfWidth);
    const rightX = Math.floor(centerX + halfWidth);
    for (let x = leftX; x <= rightX; x++) {
      setPixel(png, x, y, color);
    }
  }

  // 绘制墙壁
  for (let y = Math.floor(wallTop); y <= baseY; y++) {
    for (let x = Math.floor(centerX - houseWidth / 2); x <= Math.floor(centerX + houseWidth / 2); x++) {
      setPixel(png, x, y, color);
    }
  }

  // 绘制门（白色镂空）
  const doorWidth = houseWidth * 0.25;
  const doorHeight = houseHeight * 0.55;
  const doorColor = { r: 255, g: 255, b: 255 };
  for (let y = Math.floor(baseY - doorHeight); y <= baseY; y++) {
    for (let x = Math.floor(centerX - doorWidth / 2); x <= Math.floor(centerX + doorWidth / 2); x++) {
      setPixel(png, x, y, doorColor);
    }
  }
}

// 绘制订单图标（列表/文档形状）
function drawOrder(png, color) {
  const padding = Math.floor(size * 0.15);
  const left = padding + 2;
  const top = padding;
  const right = size - padding - 2;
  const bottom = size - padding;

  // 文档外框
  drawRect(png, left, top, right - left, bottom - top, color, false);

  // 列表线条
  const lineY1 = Math.floor(top + (bottom - top) * 0.32);
  const lineY2 = Math.floor(top + (bottom - top) * 0.52);
  const lineY3 = Math.floor(top + (bottom - top) * 0.72);
  const lineStart = left + 6;
  const lineEnd = right - 6;

  for (let x = lineStart; x <= lineEnd; x++) {
    setPixel(png, x, lineY1, color);
    setPixel(png, x, lineY1 + 1, color);
    setPixel(png, x, lineY2, color);
    setPixel(png, x, lineY2 + 1, color);
  }
  for (let x = lineStart; x <= lineEnd - 8; x++) {
    setPixel(png, x, lineY3, color);
    setPixel(png, x, lineY3 + 1, color);
  }
}

// 绘制订单图标（填充版本 - 选中状态）
function drawOrderActive(png, color) {
  const padding = Math.floor(size * 0.15);
  const left = padding + 2;
  const top = padding;
  const right = size - padding - 2;
  const bottom = size - padding;

  // 填充文档背景
  drawRect(png, left, top, right - left, bottom - top, color, true);

  // 用白色画线条
  const white = { r: 255, g: 255, b: 255 };
  const lineY1 = Math.floor(top + (bottom - top) * 0.32);
  const lineY2 = Math.floor(top + (bottom - top) * 0.52);
  const lineY3 = Math.floor(top + (bottom - top) * 0.72);
  const lineStart = left + 6;
  const lineEnd = right - 6;

  for (let x = lineStart; x <= lineEnd; x++) {
    setPixel(png, x, lineY1, white);
    setPixel(png, x, lineY1 + 1, white);
    setPixel(png, x, lineY2, white);
    setPixel(png, x, lineY2 + 1, white);
  }
  for (let x = lineStart; x <= lineEnd - 8; x++) {
    setPixel(png, x, lineY3, white);
    setPixel(png, x, lineY3 + 1, white);
  }
}

// 绘制发布图标（加号/添加形状）
function drawPublish(png, color) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = Math.floor(size * 0.22);

  // 圆形背景
  drawCircle(png, centerX, centerY, radius, color, false);

  // 加号
  const crossSize = Math.floor(radius * 0.5);
  // 横线
  for (let x = centerX - crossSize; x <= centerX + crossSize; x++) {
    setPixel(png, x, centerY, color);
    setPixel(png, x, centerY - 1, color);
  }
  // 竖线
  for (let y = centerY - crossSize; y <= centerY + crossSize; y++) {
    setPixel(png, centerX, y, color);
    setPixel(png, centerX - 1, y, color);
  }
}

// 绘制消息图标（对话气泡形状）
function drawMessage(png, color) {
  const padding = Math.floor(size * 0.14);
  const left = padding;
  const right = size - padding;
  const top = padding + 2;
  const bottom = size - padding - 8;
  const centerX = size / 2;

  // 气泡主体（圆角矩形）
  for (let y = top + 4; y <= bottom - 4; y++) {
    for (let x = left + 4; x <= right - 4; x++) {
      setPixel(png, x, y, color);
    }
  }

  // 顶部和底部填充
  for (let x = left + 6; x <= right - 6; x++) {
    for (let y = top; y <= top + 4; y++) {
      setPixel(png, x, y, color);
    }
    for (let y = bottom - 4; y <= bottom; y++) {
      setPixel(png, x, y, color);
    }
  }

  // 左右填充
  for (let y = top + 6; y <= bottom - 6; y++) {
    for (let x = left; x <= left + 4; x++) {
      setPixel(png, x, y, color);
    }
    for (let x = right - 4; x <= right; x++) {
      setPixel(png, x, y, color);
    }
  }

  // 小尾巴
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j <= i; j++) {
      setPixel(png, centerX - 3 - j, bottom + i, color);
      setPixel(png, centerX + 2 + j, bottom + i, color);
    }
  }
}

// 绘制消息图标（填充版本 - 选中状态）
function drawMessageActive(png, color) {
  const padding = Math.floor(size * 0.14);
  const left = padding;
  const right = size - padding;
  const top = padding + 2;
  const bottom = size - padding - 8;
  const centerX = size / 2;

  // 气泡主体（填充）
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      setPixel(png, x, y, color);
    }
  }

  // 小尾巴
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j <= i + 2; j++) {
      setPixel(png, centerX - 4 - j, bottom + i, color);
      setPixel(png, centerX + 3 + j, bottom + i, color);
    }
  }
}

// 绘制我的图标（用户/人像形状）
function drawProfile(png, color) {
  const centerX = size / 2;
  const headRadius = Math.floor(size * 0.13);
  const headY = Math.floor(size * 0.32);

  // 头部（圆形）
  drawCircle(png, centerX, headY, headRadius, color, false);

  // 身体（弧线）
  const bodyRadius = Math.floor(size * 0.28);
  const bodyY = headY + headRadius + 4;

  for (let angle = Math.PI * 0.85; angle <= Math.PI * 2.15; angle += 0.02) {
    const x = centerX + bodyRadius * Math.cos(angle);
    const y = bodyY + bodyRadius * Math.sin(angle) * 0.6;
    setPixel(png, Math.round(x), Math.round(y), color);
    setPixel(png, Math.round(x), Math.round(y) + 1, color);
  }
}

// 绘制我的图标（填充版本 - 选中状态）
function drawProfileActive(png, color) {
  const centerX = size / 2;
  const headRadius = Math.floor(size * 0.13);
  const headY = Math.floor(size * 0.32);

  // 头部（填充圆形）
  drawCircle(png, centerX, headY, headRadius, color, true);

  // 身体（填充半圆）
  const bodyRadius = Math.floor(size * 0.28);
  const bodyY = headY + headRadius + 4;

  for (let y = bodyY; y <= bodyY + bodyRadius * 0.6; y++) {
    for (let x = centerX - bodyRadius; x <= centerX + bodyRadius; x++) {
      const dx = x - centerX;
      const dy = (y - bodyY) / 0.6;
      if (dx * dx + dy * dy <= bodyRadius * bodyRadius) {
        setPixel(png, x, y, color);
      }
    }
  }
}

// 生成图标函数
function generateIcon(name, drawFunc, color) {
  const png = createPNG(size);
  drawFunc(png, color);

  // 保存为 PNG
  const buffer = PNG.sync.write(png);
  const filePath = path.join(outputDir, `${name}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: ${filePath}`);
}

// 生成所有图标
console.log('Generating tabbar icons...');

// 正常状态图标（线框风格）
generateIcon('home', drawHome, colorNormal);
generateIcon('order', drawOrder, colorNormal);
generateIcon('publish', drawPublish, colorNormal);
generateIcon('message', drawMessage, colorNormal);
generateIcon('profile', drawProfile, colorNormal);

// 选中状态图标（填充风格）
generateIcon('home-active', drawHomeActive, colorActive);
generateIcon('order-active', drawOrderActive, colorActive);
generateIcon('message-active', drawMessageActive, colorActive);
generateIcon('profile-active', drawProfileActive, colorActive);

console.log('All icons generated successfully!');
