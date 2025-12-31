"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const module_1 = __importDefault(require("module"));
// Stub 'vscode' prior to loading provider (theme checks)
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
(0, node_test_1.describe)('Sorting excludes virtual trailing row', () => {
    (0, node_test_1.it)('does not include trailing empty row in sort', () => {
        // Last row represents a virtual UI row (all empty)
        const rows = [
            ['b', '2'],
            ['a', '1'],
            ['', '']
        ];
        const out = CsvEditorProvider_1.CsvEditorProvider.__test.sortByColumn(rows, /*index*/ 0, /*ascending*/ true, /*treatHeader*/ false, /*hiddenRows*/ 0);
        // Out should be exactly the two data rows sorted; no empty trailing row in data
        assert_1.default.deepStrictEqual(out, [['a', '1'], ['b', '2']]);
    });
});
