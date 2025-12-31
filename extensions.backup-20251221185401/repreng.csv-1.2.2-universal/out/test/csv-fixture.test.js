"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const papaparse_1 = __importDefault(require("papaparse"));
const module_1 = __importDefault(require("module"));
// Provide a minimal vscode stub for utilities that inspect theme kind
const originalRequire = module_1.default.prototype.require;
module_1.default.prototype.require = function (id) {
    if (id === 'vscode') {
        return {
            window: { activeColorTheme: { kind: 1 } },
            ColorThemeKind: { Dark: 1 }
        };
    }
    return originalRequire.apply(this, arguments);
};
const CsvEditorProvider_1 = require("../CsvEditorProvider");
(0, node_test_1.describe)('CSV fixture: super_example.csv', () => {
    const csvPath = path_1.default.join(process.cwd(), 'src', 'test', 'super_example.csv');
    const text = fs_1.default.readFileSync(csvPath, 'utf8');
    const parsed = papaparse_1.default.parse(text, { dynamicTyping: false, delimiter: ',' });
    const rows = parsed.data;
    (0, node_test_1.it)('parses the expected header and body sizes', () => {
        assert_1.default.ok(rows.length > 1000, 'expected > 1000 rows');
        const headerIdx = rows.findIndex(r => (r[0] || '').trim() === 'Hero');
        assert_1.default.ok(headerIdx > 0, 'expected header after meta rows');
        assert_1.default.strictEqual((rows[headerIdx] || []).length, 12, 'expected 12 columns');
        const bodyRows = rows.slice(headerIdx + 1);
        assert_1.default.ok(bodyRows.length >= 1000, 'expected >= 1000 body rows for chunking');
    });
    (0, node_test_1.it)('infers column types correctly from body', () => {
        const headerIdx = rows.findIndex(r => (r[0] || '').trim() === 'Hero');
        const body = rows.slice(headerIdx + 1);
        const numCols = Math.max(...body.map(r => r.length), 0);
        const cols = Array.from({ length: numCols }, (_, i) => body.map(r => r[i] || ''));
        const estimate = CsvEditorProvider_1.CsvEditorProvider.__test.estimateColumnDataType;
        const types = cols.map(c => estimate(c));
        assert_1.default.deepStrictEqual(types.slice(0, 12), [
            'string',
            'string',
            'boolean',
            'boolean',
            'date',
            'date',
            'integer',
            'integer',
            'float',
            'float',
            'empty',
            'empty' // Spare
        ]);
    });
    (0, node_test_1.it)('header heuristic respects hiddenRows and overrides', () => {
        // With 3 meta rows hidden, the next row is the column header
        const treat = CsvEditorProvider_1.CsvEditorProvider.__test.getEffectiveHeader(rows, 3);
        assert_1.default.strictEqual(treat, true);
        // An explicit override should be honored
        const forcedFalse = CsvEditorProvider_1.CsvEditorProvider.__test.getEffectiveHeader(rows, 3, false);
        assert_1.default.strictEqual(forcedFalse, false);
        const forcedTrue = CsvEditorProvider_1.CsvEditorProvider.__test.getEffectiveHeader(rows, 3, true);
        assert_1.default.strictEqual(forcedTrue, true);
    });
    (0, node_test_1.it)('chunking metadata reflects large dataset (CHUNK_SIZE=1000)', () => {
        const meta = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableChunksMeta(rows, /*treatHeader*/ true, /*addSerialIndex*/ true, /*hiddenRows*/ 3);
        // Expect one chunk for rows beyond 1000 plus one final virtual-row chunk
        assert_1.default.strictEqual(meta.chunkCount, 2);
        assert_1.default.ok(meta.hasTable);
    });
    (0, node_test_1.it)('chunking chunkCount remains stable across hiddenRows when still > CHUNK_SIZE', () => {
        // With different hiddenRows, as long as visible data rows exceed 1000, chunk count remains 2
        const meta0 = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableChunksMeta(rows, true, true, 0);
        const meta2 = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableChunksMeta(rows, true, true, 2);
        const meta5 = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableChunksMeta(rows, true, true, 5);
        assert_1.default.strictEqual(meta0.chunkCount, 2);
        assert_1.default.strictEqual(meta2.chunkCount, 2);
        assert_1.default.strictEqual(meta5.chunkCount, 2);
    });
    (0, node_test_1.it)('engages chunking with or without header', () => {
        const withHeader = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableChunksMeta(rows, true, true, 3);
        const noHeader = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableChunksMeta(rows, false, true, 3);
        assert_1.default.strictEqual(withHeader.chunkCount, 2);
        assert_1.default.strictEqual(noHeader.chunkCount, 2);
    });
    (0, node_test_1.it)('computeColumnWidths matches independent calculation', () => {
        const headerIdx = rows.findIndex(r => (r[0] || '').trim() === 'Hero');
        const visible = rows.slice(headerIdx); // include header + body
        const expected = (() => {
            const n = Math.max(...visible.map(r => r.length), 0);
            const arr = Array(n).fill(0);
            for (const r of visible) {
                for (let i = 0; i < n; i++) {
                    arr[i] = Math.max(arr[i], (r[i] || '').length);
                }
            }
            return arr;
        })();
        const widths = CsvEditorProvider_1.CsvEditorProvider.__test.computeColumnWidths(visible);
        assert_1.default.deepStrictEqual(widths, expected);
    });
});
