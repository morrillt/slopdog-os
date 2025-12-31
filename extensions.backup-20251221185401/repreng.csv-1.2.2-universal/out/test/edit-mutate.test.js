"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const module_1 = __importDefault(require("module"));
// Stub 'vscode' before importing provider
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
(0, node_test_1.describe)('Edit mutate invariants', () => {
    (0, node_test_1.it)('does not promote virtual row on empty edit', () => {
        const res = CsvEditorProvider_1.CsvEditorProvider.__test.mutateDataForEdit([], 0, 0, '');
        assert_1.default.deepStrictEqual(res.data, []);
        assert_1.default.strictEqual(res.createdRow, false);
    });
    (0, node_test_1.it)('does not promote virtual cell on empty edit into new column', () => {
        const init = [['a']];
        const res = CsvEditorProvider_1.CsvEditorProvider.__test.mutateDataForEdit(init.map(r => [...r]), 0, 2, '');
        assert_1.default.deepStrictEqual(res.data, [['a']]);
        assert_1.default.strictEqual(res.createdCol, false);
    });
    (0, node_test_1.it)('non-empty edit expands rows and columns as needed', () => {
        const a = CsvEditorProvider_1.CsvEditorProvider.__test.mutateDataForEdit([], 0, 0, 'x');
        assert_1.default.deepStrictEqual(a.data, [['x']]);
        assert_1.default.strictEqual(a.createdRow, true);
        assert_1.default.strictEqual(a.createdCol, true);
        const b = CsvEditorProvider_1.CsvEditorProvider.__test.mutateDataForEdit([['a']], 0, 2, 'v');
        assert_1.default.deepStrictEqual(b.data, [['a', '', 'v']]);
        assert_1.default.strictEqual(b.createdCol, true);
    });
    (0, node_test_1.it)('trims trailing empty rows when editing last row', () => {
        const init = [['a'], ['']];
        const res = CsvEditorProvider_1.CsvEditorProvider.__test.mutateDataForEdit(init.map(r => [...r]), 1, 0, '');
        assert_1.default.deepStrictEqual(res.data, [['a']]);
        assert_1.default.strictEqual(res.trimmed, true);
    });
});
