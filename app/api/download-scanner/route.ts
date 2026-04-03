import { NextResponse } from "next/server"

// This endpoint provides instructions for downloading the network scanner
// In production, you would host the EXE file and serve it here
export async function GET() {
  // Return HTML page with download instructions
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download Network Scanner</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      padding: 32px;
    }
    h1 { color: #0f172a; margin-bottom: 8px; }
    .subtitle { color: #64748b; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .section h2 { color: #334155; font-size: 16px; margin-bottom: 12px; }
    .code-block {
      background: #1e293b;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .step { 
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .step-number {
      width: 28px;
      height: 28px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      flex-shrink: 0;
    }
    .step-content { color: #475569; }
    .btn {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 16px;
    }
    .btn:hover { background: #2563eb; }
    .note {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      padding: 12px;
      border-radius: 8px;
      color: #92400e;
      font-size: 14px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Network Scanner</h1>
    <p class="subtitle">Exam Center Audit System - PC Detection Tool</p>
    
    <div class="section">
      <h2>Prerequisites</h2>
      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">Install Node.js 18+ from <a href="https://nodejs.org">nodejs.org</a></div>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">Download the scanner files from your project's /scripts/network-scanner folder</div>
      </div>
    </div>
    
    <div class="section">
      <h2>Installation</h2>
      <div class="code-block">cd network-scanner
npm install</div>
    </div>
    
    <div class="section">
      <h2>Run Scanner</h2>
      <div class="code-block">node scanner.js</div>
      <p style="color: #64748b; font-size: 14px; margin-top: 8px;">
        Follow the interactive prompts to enter center details and JWT token.
      </p>
    </div>
    
    <div class="section">
      <h2>Build Standalone EXE (Optional)</h2>
      <div class="code-block">npm install -g pkg
pkg scanner.js --targets node18-win-x64 --output network-scanner.exe</div>
    </div>
    
    <div class="section">
      <h2>Command Line Usage</h2>
      <div class="code-block">node scanner.js \\
  --api-url https://your-app.vercel.app \\
  --token YOUR_JWT_TOKEN \\
  --center-code EC001 \\
  --center-name "Example Center" \\
  --city "Mumbai" \\
  --auditor "John Doe" \\
  --contact "9876543210"</div>
    </div>
    
    <div class="note">
      <strong>Note:</strong> Run the scanner on a PC that is connected to the exam center's local network (LAN). 
      The scanner will detect all active PCs in the 192.168.x.x or 10.x.x.x subnet.
    </div>
  </div>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}
