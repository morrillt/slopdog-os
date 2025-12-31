"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = require("node:test");
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}
(0, node_test_1.describe)('HTML Escaping', () => {
    (0, node_test_1.it)('escapes special characters', () => {
        const result = escapeHtml('<script>alert("x")</script>');
        assert_1.default.strictEqual(result, '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    });
});
