/**
 * Tests for bounded auto host topology Mermaid generator.
 */
'use strict';

const assert = require('assert');
const { buildAutoHostTopologyMermaid } = require('./lib/autoHostTopologyMermaid');

describe('autoHostTopologyMermaid', () => {
	it('returns empty when disabled', () => {
		assert.strictEqual(
			buildAutoHostTopologyMermaid({ h: [{ id: 'system.adapter.x.0', enabled: true }] }, { enabled: false }),
			'',
		);
	});

	it('renders subgraph per host with instance short ids', () => {
		const hosts = {
			h1: [
				{ id: 'system.adapter.admin.0', enabled: true },
				{ id: 'system.adapter.javascript.0', enabled: false },
			],
			h2: [{ id: 'system.adapter.zigbee.0', enabled: true }],
		};
		const out = buildAutoHostTopologyMermaid(hosts, { enabled: true, maxNodes: 40 });
		assert.ok(out.includes('flowchart TB'));
		assert.ok(out.includes('Host: h1'));
		assert.ok(out.includes('admin.0'));
		assert.ok(out.includes('javascript.0 (off)'));
		assert.ok(out.includes('Host: h2'));
		assert.ok(out.includes('zigbee.0'));
	});

	it('annotates truncation when over instance limit', () => {
		const hosts = {
			a: [
				{ id: 'system.adapter.a.0', enabled: true },
				{ id: 'system.adapter.a.1', enabled: true },
				{ id: 'system.adapter.a.2', enabled: true },
				{ id: 'system.adapter.a.3', enabled: true },
				{ id: 'system.adapter.a.4', enabled: true },
			],
			b: [
				{ id: 'system.adapter.b.0', enabled: true },
				{ id: 'system.adapter.b.1', enabled: true },
				{ id: 'system.adapter.b.2', enabled: true },
				{ id: 'system.adapter.b.3', enabled: true },
				{ id: 'system.adapter.b.4', enabled: true },
			],
		};
		const out = buildAutoHostTopologyMermaid(hosts, { enabled: true, maxNodes: 8 });
		assert.ok(out.includes('%% 8 / 10 instances'));
	});
});
