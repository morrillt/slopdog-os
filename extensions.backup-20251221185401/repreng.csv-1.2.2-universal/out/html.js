"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWebviewHtml = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// Rendering-only helpers
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}
function isDate(value) {
    return !isNaN(Date.parse(value));
}
function estimateColumnDataType(column) {
    let allBoolean = true, allDate = true, allInteger = true, allFloat = true, allEmpty = true;
    for (const cell of column) {
        const items = cell.split(',').map(item => item.trim());
        for (const item of items) {
            if (item === '')
                continue;
            allEmpty = false;
            const lower = item.toLowerCase();
            if (!(lower === 'true' || lower === 'false'))
                allBoolean = false;
            if (!isDate(item))
                allDate = false;
            const num = Number(item);
            if (!Number.isInteger(num))
                allInteger = false;
            if (isNaN(num))
                allFloat = false;
        }
    }
    if (allEmpty)
        return 'empty';
    if (allBoolean)
        return 'boolean';
    if (allDate)
        return 'date';
    if (allInteger)
        return 'integer';
    if (allFloat)
        return 'float';
    return 'string';
}
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function getColumnColor(type, isDark, columnIndex) {
    let hueRange = 0, isDefault = false;
    switch (type) {
        case 'boolean':
            hueRange = 30;
            break;
        case 'date':
            hueRange = 210;
            break;
        case 'float':
            hueRange = isDark ? 60 : 270;
            break;
        case 'integer':
            hueRange = 120;
            break;
        case 'string':
            hueRange = 0;
            break;
        case 'empty':
            isDefault = true;
            break;
    }
    if (isDefault)
        return isDark ? '#BBB' : '#444';
    const saturationOffset = ((columnIndex * 7) % 31) - 15;
    const saturation = saturationOffset + (isDark ? 60 : 80);
    const lightnessOffset = ((columnIndex * 13) % 31) - 15;
    const lightness = lightnessOffset + (isDark ? 70 : 30);
    const hueOffset = ((columnIndex * 17) % 31) - 15;
    const finalHue = (hueRange + hueOffset + 360) % 360;
    return hslToHex(finalHue, saturation, lightness);
}
function computeColumnWidths(data) {
    const numColumns = Math.max(...data.map(row => row.length));
    const widths = Array(numColumns).fill(0);
    for (const row of data) {
        for (let i = 0; i < numColumns; i++) {
            widths[i] = Math.max(widths[i], (row[i] || '').length);
        }
    }
    return widths;
}
function renderWebviewHtml(opts) {
    const { webview, extensionUri, nonce, csvText, config } = opts;
    const isDark = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
    const styleFsUri = vscode.Uri.file(path.join(extensionUri.fsPath, 'media', 'webview.css'));
    const scriptFsUri = vscode.Uri.file(path.join(extensionUri.fsPath, 'media', 'webview.js'));
    const styleUri = webview.asWebviewUri(styleFsUri);
    const scriptUri = webview.asWebviewUri(scriptFsUri);
    // Prepare data slices and column metrics
    let data = csvText.map(r => r.slice());
    let headerFlag = config.treatHeader;
    if (data.length === 0) {
        data.push(['']);
        headerFlag = false;
    }
    const headerRow = headerFlag ? data[0] : [];
    const bodyData = headerFlag ? data.slice(1) : data;
    const numColumns = Math.max(...data.map(row => row.length));
    const columnData = Array.from({ length: numColumns }, (_, i) => bodyData.map(row => row[i] || ''));
    const columnTypes = columnData.map(col => estimateColumnDataType(col));
    const columnColors = columnTypes.map((type, i) => getColumnColor(type, isDark, i));
    const columnWidths = computeColumnWidths(data);
    // Virtual scroll chunks (HTML strings for later append)
    const CHUNK_SIZE = 1000;
    const allRows = headerFlag ? bodyData : data;
    const chunks = [];
    if (allRows.length > CHUNK_SIZE) {
        for (let i = CHUNK_SIZE; i < allRows.length; i += CHUNK_SIZE) {
            const htmlChunk = allRows.slice(i, i + CHUNK_SIZE).map((row, localR) => {
                const absRow = headerFlag ? i + localR + 1 : i + localR;
                const cells = row.map((cell, cIdx) => {
                    const safe = escapeHtml(cell);
                    return `<td tabindex="0" class="cell col-${cIdx}" data-row="${absRow}" data-col="${cIdx}">${safe}</td>`;
                }).join('');
                const serial = config.addSerialIndex
                    ? `<td tabindex="0" class="cell serial" data-row="${absRow}" data-col="-1">${absRow}</td>`
                    : '';
                return `<tr>${serial}${cells}</tr>`;
            }).join('');
            chunks.push(htmlChunk);
        }
        if (headerFlag)
            bodyData.length = CHUNK_SIZE;
        else
            data.length = CHUNK_SIZE;
    }
    // Build initial table (no inline styles)
    let tableHtml = '<table>';
    if (headerFlag) {
        tableHtml += '<thead><tr>' +
            (config.addSerialIndex ? `<th tabindex="0" class="header serial">#</th>` : '') +
            headerRow.map((cell, i) => `<th tabindex="0" class="header col-${i}" data-row="0" data-col="${i}">${escapeHtml(cell)}</th>`).join('') +
            '</tr></thead><tbody>';
        bodyData.forEach((row, r) => {
            tableHtml += '<tr>' +
                (config.addSerialIndex ? `<td tabindex="0" class="cell serial" data-row="${r + 1}" data-col="-1">${r + 1}</td>` : '') +
                row.map((cell, i) => `<td tabindex="0" class="cell col-${i}" data-row="${r + 1}" data-col="${i}">${escapeHtml(cell)}</td>`).join('') +
                '</tr>';
        });
        tableHtml += '</tbody>';
    }
    else {
        tableHtml += '<tbody>';
        data.forEach((row, r) => {
            tableHtml += '<tr>' +
                (config.addSerialIndex ? `<td tabindex="0" class="cell serial" data-row="${r}" data-col="-1">${r + 1}</td>` : '') +
                row.map((cell, i) => `<td tabindex="0" class="cell col-${i}" data-row="${r}" data-col="${i}">${escapeHtml(cell)}</td>`).join('') +
                '</tr>';
        });
        tableHtml += '</tbody>';
    }
    tableHtml += '</table>';
    const chunksJson = JSON.stringify(chunks);
    // A tiny, nonce'd style block to set variables and column-specific width/color rules (no large inline CSS)
    const cssVarLines = [
        `:root{--csv-font:${JSON.stringify(config.fontFamily)};--csv-cell-padding:${config.cellPadding}px;--csv-border:${isDark ? '#555' : '#ccc'};--csv-hdr-bg:${isDark ? '#1e1e1e' : '#ffffff'};--csv-serial-color:${isDark ? '#888' : '#888'};--csv-select-bg:${isDark ? '#333333' : '#cce0ff'};--csv-hl-bg:${isDark ? '#222222' : '#fefefe'};--csv-find-active:${isDark ? '#444444' : '#ffffcc'};}`
    ];
    const perColRules = [];
    for (let i = 0; i < numColumns; i++) {
        const w = Math.min(columnWidths[i] || 0, 100);
        perColRules.push(`th.col-${i},td.col-${i}{min-width:${w}ch;max-width:100ch}`);
        perColRules.push(`th.col-${i},td.col-${i}{color:${columnColors[i]}}`);
    }
    const initJson = JSON.stringify({ separator: config.separator });
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src ${webview.cspSource} 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSV</title>
    <link rel="stylesheet" href="${styleUri}">
    <style nonce="${nonce}">${cssVarLines.join('\n')}${perColRules.join('\n')}</style>
  </head>
  <body>
    <script id="__csvInit" type="application/json">${initJson}</script>
    <script id="__csvChunks" type="application/json">${chunksJson}</script>
    <div class="table-container">${tableHtml}</div>
    <div id="findWidget">
      <input id="findInput" type="text" placeholder="Find...">
      <span id="findStatus"></span>
      <button id="findClose">✕</button>
    </div>
    <div id="contextMenu"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}
exports.renderWebviewHtml = renderWebviewHtml;
