"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const module_1 = __importDefault(require("module"));
// Stub 'vscode' before importing provider (theme checks only)
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
(0, node_test_1.describe)('Sort preserves empty cells (no nan)', () => {
    (0, node_test_1.it)('sorting by col 0 keeps empty strings in col 1', () => {
        const rows = [
            ['b', ''],
            ['a', 'x'],
            ['c', '']
        ];
        const out = CsvEditorProvider_1.CsvEditorProvider.__test.sortByColumn(rows, /*index*/ 0, /*ascending*/ true, /*treatHeader*/ false, /*hiddenRows*/ 0);
        // Expect order: a, b, c and column 1 empties remain ''
        assert_1.default.deepStrictEqual(out.map(r => r[0]), ['a', 'b', 'c']);
        assert_1.default.deepStrictEqual(out.map(r => r[1]), ['x', '', '']);
        // Ensure no literal 'nan' leak
        assert_1.default.ok(!out.flat().some(v => (v || '').toLowerCase() === 'nan'));
    });
});
