"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const module_1 = __importDefault(require("module"));
// Stub 'vscode' theme checks
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
(0, node_test_1.describe)('Virtual row and cell invariants', () => {
    (0, node_test_1.it)('non-chunked: renders exactly one virtual row matching widest column', () => {
        const data = [
            ['a'],
            ['b', 'c', 'd']
        ];
        const { tableHtml, chunks } = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableAndChunksRaw(data, /*treatHeader*/ false, /*addSerialIndex*/ false, /*hiddenRows*/ 0);
        // Should not use chunks for non-chunked data
        assert_1.default.strictEqual(chunks.length, 0);
        // Virtual row absolute index = offset (0) + nonHeaderRows.length (2)
        const virtualAbs = 2;
        // Expect a cell for each column up to widest (3)
        for (let c = 0; c < 3; c++) {
            const needle = `data-row="${virtualAbs}" data-col="${c}"`;
            assert_1.default.ok(tableHtml.includes(needle), `expected virtual cell presence: ${needle}`);
        }
        // And ensure there is no unexpected next column
        assert_1.default.ok(!tableHtml.includes(`data-row="${virtualAbs}" data-col="3"`));
    });
    (0, node_test_1.it)('chunked: appends one final chunk containing the virtual row', () => {
        const rows = Array.from({ length: 1500 }, (_, i) => [String(i + 1), 'x', 'y']);
        const { tableHtml, chunks } = CsvEditorProvider_1.CsvEditorProvider.__test.generateTableAndChunksRaw(rows, /*treatHeader*/ false, /*addSerialIndex*/ false, /*hiddenRows*/ 0);
        // Initial table should not include the virtual row when chunked
        assert_1.default.ok(!tableHtml.includes('data-row="1500"'));
        // Two chunks: 500 remaining rows + 1 virtual row chunk
        assert_1.default.strictEqual(chunks.length, 2);
        const last = chunks[chunks.length - 1];
        // Virtual absolute row index equals number of data rows (startAbs = 0)
        const virtualAbs = 1500;
        for (let c = 0; c < 3; c++) {
            const needle = `data-row="${virtualAbs}" data-col="${c}"`;
            assert_1.default.ok(last.includes(needle), `expected virtual cell in chunk: ${needle}`);
        }
    });
});
