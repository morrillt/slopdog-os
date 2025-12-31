"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const module_1 = __importDefault(require("module"));
// Stub the 'vscode' module used by extension.ts so it can be imported in a
// regular Node environment. Only the utilities are tested here so an empty
// object is sufficient.
const originalRequire = module_1.default.prototype.require;
module_1.default.prototype.require = function (id) {
    if (id === 'vscode') {
        return {};
    }
    return originalRequire.apply(this, arguments);
};
const CsvEditorProvider_1 = require("../CsvEditorProvider");
(0, node_test_1.describe)('CsvEditorProvider utility methods', () => {
    (0, node_test_1.it)('computeColumnWidths returns max length per column', () => {
        const data = [
            ['a', 'bb', 'ccc'],
            ['dddd', 'ee', 'f']
        ];
        const widths = CsvEditorProvider_1.CsvEditorProvider.__test.computeColumnWidths(data);
        assert_1.default.deepStrictEqual(widths, [4, 2, 3]);
    });
    (0, node_test_1.it)('isDate correctly identifies date strings', () => {
        const isDate = CsvEditorProvider_1.CsvEditorProvider.__test.isDate;
        assert_1.default.strictEqual(isDate('2024-01-02'), true);
        assert_1.default.strictEqual(isDate('not-a-date'), false);
        assert_1.default.strictEqual(isDate('1003'), false);
        assert_1.default.strictEqual(isDate('2024'), false);
        assert_1.default.strictEqual(isDate('2024/01/02'), true);
    });
    (0, node_test_1.it)('estimateColumnDataType detects common types', () => {
        const estimate = CsvEditorProvider_1.CsvEditorProvider.__test.estimateColumnDataType;
        assert_1.default.strictEqual(estimate(['true', 'FALSE']), 'boolean');
        assert_1.default.strictEqual(estimate(['1', '0', '0', '1']), 'boolean');
        assert_1.default.strictEqual(estimate(['t', 'F', 'T', 'f']), 'boolean');
        assert_1.default.strictEqual(estimate(['yes', 'No', 'Y', 'n']), 'boolean');
        assert_1.default.strictEqual(estimate(['on', 'OFF']), 'boolean');
        assert_1.default.strictEqual(estimate(['2020-01-01', '1999-12-31']), 'date');
        assert_1.default.strictEqual(estimate(['0x1', '0x2']), 'integer');
        assert_1.default.strictEqual(estimate(['1003', '42', '0']), 'integer');
        assert_1.default.strictEqual(estimate(['1.2e0', '3.4e0']), 'float');
        assert_1.default.strictEqual(estimate(['', '']), 'empty');
        assert_1.default.strictEqual(estimate(['hello', '1a']), 'string');
    });
    (0, node_test_1.it)('getColumnColor returns hex colors', () => {
        const getColor = CsvEditorProvider_1.CsvEditorProvider.__test.getColumnColor;
        assert_1.default.strictEqual(getColor('empty', true, 0), '#BBB');
        assert_1.default.strictEqual(getColor('empty', false, 0), '#444');
        const hex = getColor('boolean', true, 2);
        assert_1.default.match(hex, /^#[0-9a-fA-F]{6}$/);
    });
    (0, node_test_1.it)('hslToHex converts known colors', () => {
        const hslToHex = CsvEditorProvider_1.CsvEditorProvider.__test.hslToHex;
        assert_1.default.strictEqual(hslToHex(0, 100, 50), '#ff0000'); // red
        assert_1.default.strictEqual(hslToHex(120, 100, 50), '#00ff00'); // green
        assert_1.default.strictEqual(hslToHex(240, 100, 50), '#0000ff'); // blue
    });
});
