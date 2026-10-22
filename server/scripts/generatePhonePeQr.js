const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const jpeg = require('jpeg-js');

async function generatePhonePeQR() {
  const width = 640;
  const height = 900;
  const buffer = Buffer.alloc(width * height * 4);

  // Helper to set pixel color
  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    buffer[idx] = r;
    buffer[idx + 1] = g;
    buffer[idx + 2] = b;
    buffer[idx + 3] = a;
  }

  function fillRect(x1, y1, x2, y2, r, g, b) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        setPixel(x, y, r, g, b);
      }
    }
  }

  // 1. Background - Soft clean grey-purple gradient / PhonePe theme
  fillRect(0, 0, width - 1, height - 1, 246, 244, 252);

  // 2. PhonePe Brand Header - Deep vibrant Purple (#5f259f -> 95, 37, 159)
  fillRect(0, 0, width - 1, 190, 95, 37, 159);
  // Gold accent strip below header (#FFB703)
  fillRect(0, 190, width - 1, 196, 255, 183, 3);

  // 3. Central White Card for the QR code
  const cardX1 = 40;
  const cardY1 = 140;
  const cardX2 = width - 40;
  const cardY2 = height - 130;
  fillRect(cardX1, cardY1, cardX2, cardY2, 255, 255, 255);

  // Card shadow / border
  for (let x = cardX1; x <= cardX2; x++) {
    setPixel(x, cardY1, 220, 215, 235);
    setPixel(x, cardY2, 210, 205, 225);
  }
  for (let y = cardY1; y <= cardY2; y++) {
    setPixel(cardX1, y, 220, 215, 235);
    setPixel(cardX2, y, 210, 205, 225);
  }

  // 4. Generate QR bitmatrix
  const upiUri = 'upi://pay?pa=pranaygavhade@ybl&pn=PRANAY%20GAVHADE&cu=INR&tn=IMovies%20Ticket%20Booking';
  const qr = QRCode.create(upiUri, { errorCorrectionLevel: 'H' });
  const qrSize = qr.modules.size;
  const qrTargetWidth = 380;
  const modulePixelSize = Math.floor(qrTargetWidth / qrSize);
  const actualQRWidth = modulePixelSize * qrSize;
  const qrStartX = Math.floor((width - actualQRWidth) / 2);
  const qrStartY = 240;

  // Draw QR Modules
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      const isDark = qr.modules.get(r, c);
      const color = isDark ? [15, 12, 35] : [255, 255, 255]; // Deep indigo-black
      const mx = qrStartX + c * modulePixelSize;
      const my = qrStartY + r * modulePixelSize;
      fillRect(mx, my, mx + modulePixelSize - 1, my + modulePixelSize - 1, color[0], color[1], color[2]);
    }
  }

  // 5. Center Logo Box in QR (PhonePe 'Pe' logo box)
  const centerBoxSize = 54;
  const cx1 = Math.floor((width - centerBoxSize) / 2);
  const cy1 = qrStartY + Math.floor((actualQRWidth - centerBoxSize) / 2);
  fillRect(cx1, cy1, cx1 + centerBoxSize, cy1 + centerBoxSize, 255, 255, 255);
  fillRect(cx1 + 4, cy1 + 4, cx1 + centerBoxSize - 4, cy1 + centerBoxSize - 4, 95, 37, 159);

  // PhonePe 'पे' Hindi symbol stylized inside center box
  fillRect(cx1 + 18, cy1 + 14, cx1 + 36, cy1 + 17, 255, 255, 255); // Top bar
  fillRect(cx1 + 25, cy1 + 17, cx1 + 29, cy1 + 38, 255, 255, 255); // Stem
  fillRect(cx1 + 18, cy1 + 20, cx1 + 25, cy1 + 28, 255, 255, 255); // Loop
  fillRect(cx1 + 31, cy1 + 10, cx1 + 35, cy1 + 14, 255, 255, 255); // Matra

  // 6. Footer section in White Card - Payee details
  // Target Payee Box
  const payeeBoxY1 = qrStartY + actualQRWidth + 30;
  fillRect(cardX1 + 20, payeeBoxY1, cardX2 - 20, payeeBoxY1 + 80, 248, 245, 255);

  // Draw simple raster text placeholder / block
  // Bottom branding bar (UPI, GPay, Paytm, BHIM icons placeholder)
  fillRect(cardX1 + 20, payeeBoxY1 + 100, cardX2 - 20, payeeBoxY1 + 140, 240, 240, 245);

  // Bottom card text / UPI accepted
  fillRect(cardX1 + 30, height - 90, cardX2 - 30, height - 88, 200, 195, 215);

  // Encode to JPEG
  const rawImageData = {
    data: buffer,
    width,
    height,
  };
  const jpegImageData = jpeg.encode(rawImageData, 96);

  // Ensure directories exist
  const publicAssetsDir = path.join(__dirname, '../../client/public/assets');
  if (!fs.existsSync(publicAssetsDir)) {
    fs.mkdirSync(publicAssetsDir, { recursive: true });
  }

  const outputPath = path.join(publicAssetsDir, 'phonepe-qr.jpeg');
  fs.writeFileSync(outputPath, jpegImageData.data);
  console.log('PhonePe QR JPEG generated successfully at:', outputPath);

  // Also write to dist/assets if dist exists
  const distAssetsDir = path.join(__dirname, '../../client/dist/assets');
  if (fs.existsSync(distAssetsDir)) {
    fs.writeFileSync(path.join(distAssetsDir, 'phonepe-qr.jpeg'), jpegImageData.data);
    console.log('PhonePe QR copied to client/dist/assets/phonepe-qr.jpeg');
  }
}

generatePhonePeQR().catch(console.error);
