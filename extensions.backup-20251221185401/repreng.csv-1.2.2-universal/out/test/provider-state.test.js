"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
const module_1 = __importDefault(require("module"));
// Stub 'vscode' for Node test environment before importing code that requires it
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
// Minimal mock for vscode.ExtensionContext.workspaceState
function createMockContext() {
    const store = {};
    return {
        workspaceState: {
            get: (key, def) => (key in store ? store[key] : def),
            update: async (key, val) => { store[key] = val; }
        }
    };
}
function makeUri(id) {
    return { toString: () => `vscode-test://csv/${id}` };
}
(0, node_test_1.describe)('Per-URI state mapping', () => {
    (0, node_test_1.it)('hiddenRows get/set clamps and clears', async () => {
        const ctx = createMockContext();
        const u = makeUri('one');
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getHiddenRowsForUri(ctx, u), 0);
        await CsvEditorProvider_1.CsvEditorProvider.setHiddenRowsForUri(ctx, u, 5);
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getHiddenRowsForUri(ctx, u), 5);
        await CsvEditorProvider_1.CsvEditorProvider.setHiddenRowsForUri(ctx, u, 0);
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getHiddenRowsForUri(ctx, u), 0);
    });
    (0, node_test_1.it)('header override get/set and presence', async () => {
        const ctx = createMockContext();
        const u = makeUri('two');
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getHeaderForUri(ctx, u), true);
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.hasHeaderOverride(ctx, u), false);
        await CsvEditorProvider_1.CsvEditorProvider.setHeaderForUri(ctx, u, false);
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.hasHeaderOverride(ctx, u), true);
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getHeaderForUri(ctx, u), false);
    });
    (0, node_test_1.it)('serial index get/set defaults true', async () => {
        const ctx = createMockContext();
        const u = makeUri('three');
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getSerialIndexForUri(ctx, u), true);
        await CsvEditorProvider_1.CsvEditorProvider.setSerialIndexForUri(ctx, u, false);
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getSerialIndexForUri(ctx, u), false);
    });
    (0, node_test_1.it)('separator get/set/unset', async () => {
        const ctx = createMockContext();
        const u = makeUri('four');
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getSeparatorForUri(ctx, u), undefined);
        await CsvEditorProvider_1.CsvEditorProvider.setSeparatorForUri(ctx, u, ';');
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getSeparatorForUri(ctx, u), ';');
        await CsvEditorProvider_1.CsvEditorProvider.setSeparatorForUri(ctx, u, undefined);
        assert_1.default.strictEqual(CsvEditorProvider_1.CsvEditorProvider.getSeparatorForUri(ctx, u), undefined);
    });
});
