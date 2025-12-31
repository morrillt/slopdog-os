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
(0, node_test_1.describe)('Date column sort', () => {
    (0, node_test_1.it)('sorts ISO yyyy-mm-dd ascending and descending', () => {
        const input = [
            ['2017-02-18'],
            ['2017-12-04'],
            ['2017-02-10'],
            ['2017-04-16'],
            ['2017-06-22'],
            ['2017-04-08'],
            ['2017-06-14'],
            ['2017-08-20']
        ];
        const asc = CsvEditorProvider_1.CsvEditorProvider.__test.sortByColumn(input, 0, true, false, 0).map(r => r[0]);
        assert_1.default.deepStrictEqual(asc, [
            '2017-02-10',
            '2017-02-18',
            '2017-04-08',
            '2017-04-16',
            '2017-06-14',
            '2017-06-22',
            '2017-08-20',
            '2017-12-04'
        ]);
        const desc = CsvEditorProvider_1.CsvEditorProvider.__test.sortByColumn(input, 0, false, false, 0).map(r => r[0]);
        assert_1.default.deepStrictEqual(desc, [
            '2017-12-04',
            '2017-08-20',
            '2017-06-22',
            '2017-06-14',
            '2017-04-16',
            '2017-04-08',
            '2017-02-18',
            '2017-02-10'
        ]);
    });
    (0, node_test_1.it)('treats empty dates as last in ascending', () => {
        const input = [['2017-01-01'], [''], ['2017-01-03']];
        const asc = CsvEditorProvider_1.CsvEditorProvider.__test.sortByColumn(input, 0, true, false, 0).map(r => r[0]);
        assert_1.default.deepStrictEqual(asc, ['2017-01-01', '2017-01-03', '']);
    });
});
