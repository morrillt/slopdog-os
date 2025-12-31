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
exports.registerCsvCommands = void 0;
const font_list_1 = require("font-list");
const vscode = __importStar(require("vscode"));
const CsvEditorProvider_1 = require("./CsvEditorProvider");
async function toggleBooleanConfig(key, defaultVal, messagePrefix) {
    const config = vscode.workspace.getConfiguration('csv');
    const currentVal = config.get(key, defaultVal);
    const newVal = !currentVal;
    await config.update(key, newVal, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`${messagePrefix} ${newVal ? 'enabled' : 'disabled'}.`);
    CsvEditorProvider_1.CsvEditorProvider.editors.forEach(ed => ed.refresh());
}
function registerCsvCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('csv.toggleExtension', () => toggleBooleanConfig('enabled', true, 'CSV extension')), vscode.commands.registerCommand('csv.toggleHeader', async () => {
        const active = CsvEditorProvider_1.CsvEditorProvider.getActiveProvider();
        if (!active) {
            vscode.window.showInformationMessage('Open a CSV/TSV file in the CSV editor.');
            return;
        }
        const uri = active.getDocumentUri();
        const cur = CsvEditorProvider_1.CsvEditorProvider.getHeaderForUri(context, uri);
        await CsvEditorProvider_1.CsvEditorProvider.setHeaderForUri(context, uri, !cur);
        CsvEditorProvider_1.CsvEditorProvider.editors.filter(ed => ed.getDocumentUri().toString() === uri.toString()).forEach(ed => ed.refresh());
        vscode.window.showInformationMessage(`CSV: First row as header ${!cur ? 'enabled' : 'disabled'} for this file.`);
    }), vscode.commands.registerCommand('csv.toggleSerialIndex', async () => {
        const active = CsvEditorProvider_1.CsvEditorProvider.getActiveProvider();
        if (!active) {
            vscode.window.showInformationMessage('Open a CSV/TSV file in the CSV editor.');
            return;
        }
        const uri = active.getDocumentUri();
        const cur = CsvEditorProvider_1.CsvEditorProvider.getSerialIndexForUri(context, uri);
        await CsvEditorProvider_1.CsvEditorProvider.setSerialIndexForUri(context, uri, !cur);
        CsvEditorProvider_1.CsvEditorProvider.editors.filter(ed => ed.getDocumentUri().toString() === uri.toString()).forEach(ed => ed.refresh());
        vscode.window.showInformationMessage(`CSV: Serial index ${!cur ? 'enabled' : 'disabled'} for this file.`);
    }), vscode.commands.registerCommand('csv.changeSeparator', async () => {
        var _a;
        const active = CsvEditorProvider_1.CsvEditorProvider.getActiveProvider();
        if (!active) {
            vscode.window.showInformationMessage('Open a CSV/TSV file in the CSV editor.');
            return;
        }
        const uri = active.getDocumentUri();
        const currentSep = (_a = CsvEditorProvider_1.CsvEditorProvider.getSeparatorForUri(context, uri)) !== null && _a !== void 0 ? _a : (uri.fsPath.toLowerCase().endsWith('.tsv') ? '\\t' : ',');
        const input = await vscode.window.showInputBox({ prompt: 'Enter new CSV separator (empty to inherit from file)', value: currentSep });
        if (input !== undefined) {
            const sep = input;
            await CsvEditorProvider_1.CsvEditorProvider.setSeparatorForUri(context, uri, sep.length ? sep : undefined);
            vscode.window.showInformationMessage(`CSV separator ${sep.length ? `set to "${sep}"` : 'now inherits from file type'}`);
            CsvEditorProvider_1.CsvEditorProvider.editors.filter(ed => ed.getDocumentUri().toString() === uri.toString()).forEach(ed => ed.refresh());
        }
    }), vscode.commands.registerCommand('csv.changeFontFamily', async () => {
        const csvCfg = vscode.workspace.getConfiguration('csv');
        const editorCfg = vscode.workspace.getConfiguration('editor');
        const currentCsvFont = csvCfg.get('fontFamily', '');
        const inheritedFont = editorCfg.get('fontFamily', 'Menlo');
        const currentEffective = currentCsvFont || inheritedFont;
        let fonts = [];
        try {
            fonts = (await (0, font_list_1.getFonts)()).map((f) => f.replace(/^"(.*)"$/, '$1')).sort();
        }
        catch (e) {
            console.error('CSV: unable to enumerate system fonts', e);
        }
        const picks = ['(inherit editor setting)', ...fonts];
        const choice = await vscode.window.showQuickPick(picks, {
            placeHolder: `Current: ${currentEffective}`
        });
        if (choice === undefined) {
            return;
        }
        const newVal = choice === '(inherit editor setting)' ? '' : choice;
        await csvCfg.update('fontFamily', newVal, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(newVal ? `CSV font set to “${newVal}”.` : 'CSV font now inherits editor.fontFamily.');
        CsvEditorProvider_1.CsvEditorProvider.editors.forEach(ed => ed.refresh());
    }), vscode.commands.registerCommand('csv.changeIgnoreRows', async () => {
        const active = CsvEditorProvider_1.CsvEditorProvider.getActiveProvider();
        if (!active) {
            vscode.window.showInformationMessage('Open a CSV/TSV file with the CSV editor to change hidden rows.');
            return;
        }
        const uri = active.getDocumentUri();
        const current = CsvEditorProvider_1.CsvEditorProvider.getHiddenRowsForUri(context, uri);
        const input = await vscode.window.showInputBox({
            prompt: 'Hide first N rows (per file)',
            value: String(current),
            validateInput: (val) => (/^\d+$/.test(val) ? undefined : 'Enter a non-negative integer')
        });
        if (input === undefined) {
            return;
        }
        const n = parseInt(input, 10);
        await CsvEditorProvider_1.CsvEditorProvider.setHiddenRowsForUri(context, uri, n);
        // Refresh only editors showing this URI
        CsvEditorProvider_1.CsvEditorProvider.editors
            .filter(ed => ed.getDocumentUri().toString() === uri.toString())
            .forEach(ed => ed.refresh());
        vscode.window.showInformationMessage(`CSV: Hiding first ${n} row(s) for this file.`);
    }), vscode.commands.registerCommand('csv.changeEncoding', async () => {
        const active = CsvEditorProvider_1.CsvEditorProvider.getActiveProvider();
        if (!active) {
            vscode.window.showInformationMessage('Open a CSV/TSV file in the CSV editor.');
            return;
        }
        const uri = active.getDocumentUri();
        // Close any existing tabs for this URI so we can reuse the slot cleanly
        try {
            const toClose = [];
            vscode.window.tabGroups.all.forEach(g => {
                g.tabs.forEach(t => {
                    const inp = t.input;
                    const u = (inp === null || inp === void 0 ? void 0 : inp.uri) instanceof vscode.Uri ? inp.uri : undefined;
                    if (u && u.toString() === uri.toString())
                        toClose.push(t);
                });
            });
            if (toClose.length) {
                console.log(`[CSV(encoding)]: closing ${toClose.length} tab(s) for ${uri.fsPath}`);
                await vscode.window.tabGroups.close(toClose);
            }
        }
        catch (e) {
            console.warn('[CSV(encoding)]: failed to close existing tabs', e);
        }
        // Open the default text editor in-place and invoke the built-in encoding picker
        try {
            console.log(`[CSV(encoding)]: opening default text editor for ${uri.fsPath}`);
            await vscode.commands.executeCommand('vscode.openWith', uri, 'default', { preview: true, preserveFocus: false });
            console.log('[CSV(encoding)]: invoking workbench.action.editor.changeEncoding');
            await vscode.commands.executeCommand('workbench.action.editor.changeEncoding');
            // Switch back to our custom editor
            console.log(`[CSV(encoding)]: reopening with custom editor for ${uri.fsPath}`);
            await vscode.commands.executeCommand('vscode.openWith', uri, CsvEditorProvider_1.CsvEditorProvider.viewType, { preview: false, preserveFocus: false });
            // Best-effort: ensure no duplicate default tab remains
            try {
                const stale = [];
                vscode.window.tabGroups.all.forEach(g => g.tabs.forEach(t => {
                    const inp = t.input;
                    const vt = inp === null || inp === void 0 ? void 0 : inp.viewType;
                    const u = (inp === null || inp === void 0 ? void 0 : inp.uri) instanceof vscode.Uri ? inp.uri : undefined;
                    if (u && u.toString() === uri.toString() && vt !== CsvEditorProvider_1.CsvEditorProvider.viewType)
                        stale.push(t);
                }));
                if (stale.length) {
                    console.log(`[CSV(encoding)]: closing ${stale.length} stale text tab(s)`);
                    await vscode.window.tabGroups.close(stale);
                }
            }
            catch { }
        }
        catch (e) {
            console.error('CSV: encoding change flow failed', e);
            vscode.window.showWarningMessage('CSV: Could not invoke the built-in encoding picker. Please use File → Reopen with Encoding, then re-open the CSV view.');
        }
    }));
}
exports.registerCsvCommands = registerCsvCommands;
