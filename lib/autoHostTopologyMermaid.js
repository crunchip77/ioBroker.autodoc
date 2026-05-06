/**
 * Small Mermaid flowchart: adapter instances grouped by ioBroker host.
 * Phase 5.x.3 — bounded auto-graph only (hard node limit); not a full dependency graph.
 */
'use strict';

const MAX_OUTPUT_CHARS = 12000;

function shortInstanceId(fullId) {
	const s = String(fullId || '');
	const p = 'system.adapter.';
	if (s.startsWith(p)) {
		return s.slice(p.length);
	}
	return s;
}

function mermaidEscapeLabel(s, maxLen) {
	let t = String(s || '')
		.replace(/\r\n/g, '\n')
		.replace(/[\r\n]+/g, ' ')
		.replace(/["]/g, "'")
		.replace(/[[\]]/g, ' ')
		.trim();
	if (t.length > maxLen) {
		t = `${t.slice(0, maxLen - 1)}…`;
	}
	return t;
}

function instanceGraphLabel(inst) {
	let s = shortInstanceId(inst.id);
	if (inst.enabled === false) {
		s += ' (off)';
	}
	return s;
}

/**
 * Fair cap: round-robin take up to `max` instances across hosts.
 *
 * @param {Array<{host:string,inst:object,label:string}>} rows Per-instance rows with host bucket key
 * @param {number} max Maximum number of instances to keep
 * @returns {Array<{host:string,inst:object,label:string}>} Possibly shortened list
 */
function pickInstancesRoundRobin(rows, max) {
	if (rows.length <= max) {
		return rows.slice();
	}
	const byHost = {};
	for (const r of rows) {
		if (!byHost[r.host]) {
			byHost[r.host] = [];
		}
		byHost[r.host].push(r);
	}
	const hosts = Object.keys(byHost).sort((a, b) => String(a).localeCompare(String(b)));
	const picked = [];
	let idx = 0;
	while (picked.length < max) {
		let progressed = false;
		for (const h of hosts) {
			if (picked.length >= max) {
				break;
			}
			const bucket = byHost[h];
			if (idx < bucket.length) {
				picked.push(bucket[idx]);
				progressed = true;
			}
		}
		if (!progressed) {
			break;
		}
		idx += 1;
	}
	return picked;
}

/**
 * Build Mermaid source for host-grouped adapter instances.
 *
 * @param {Record<string, object[]>} hostsMap Host name → instances (`docModel.adapters.hosts`)
 * @param {{ enabled?: boolean, maxNodes?: number }} opts Toggle and instance-node budget (clamped 8–200)
 * @returns {string} Mermaid flowchart source or ''
 */
function buildAutoHostTopologyMermaid(hostsMap, opts) {
	if (!opts || opts.enabled !== true || !hostsMap || typeof hostsMap !== 'object') {
		return '';
	}
	let maxNodes = parseInt(String(opts.maxNodes != null ? opts.maxNodes : 40), 10);
	if (!Number.isFinite(maxNodes)) {
		maxNodes = 40;
	}
	maxNodes = Math.min(200, Math.max(8, maxNodes));

	const hostNames = Object.keys(hostsMap).sort((a, b) => String(a).localeCompare(String(b)));
	if (hostNames.length === 0) {
		return '';
	}

	const rows = [];
	let totalAvailable = 0;
	for (const host of hostNames) {
		const list = hostsMap[host] || [];
		const sorted = [...list].sort((a, b) => shortInstanceId(a.id).localeCompare(shortInstanceId(b.id)));
		for (const inst of sorted) {
			const hKey = host != null && String(host) !== '' ? String(host) : '(host)';
			rows.push({
				host: hKey,
				inst,
				label: instanceGraphLabel(inst),
			});
			totalAvailable += 1;
		}
	}
	if (rows.length === 0) {
		return '';
	}

	const picked = pickInstancesRoundRobin(rows, maxNodes);
	const byHost = {};
	for (const r of picked) {
		if (!byHost[r.host]) {
			byHost[r.host] = [];
		}
		byHost[r.host].push(r);
	}

	const hostOrder = hostNames.filter(h => byHost[h] && byHost[h].length > 0);

	/*
	 * Grid layout via invisible links (~~~, Mermaid ≥10.2):
	 * Nodes are split into columns; within each column they are chained with ~~~ so
	 * the layout engine places them compactly instead of distributing isolated nodes
	 * with large gaps.  flowchart LR + direction TB per subgraph → columns appear
	 * side-by-side inside each host box; multiple host boxes appear side-by-side.
	 * Auto column count: ceil(sqrt(n)) capped at 5 keeps the grid roughly square.
	 *
	 * Disabled instances get class `offNode` (dashed border + muted fill) so they
	 * are visually distinct from running ones without relying on the "(off)" label.
	 */
	const lines = ['flowchart LR', 'classDef offNode fill:#6b7280,stroke:#4b5563,color:#e5e7eb,stroke-dasharray:5 3'];
	if (totalAvailable > picked.length) {
		lines.push(`%% ${picked.length} / ${totalAvailable} instances (limit ${maxNodes})`);
	}

	let sid = 0;
	let nid = 0;
	for (const host of hostOrder) {
		const sg = `sg${sid}`;
		sid += 1;
		const hostLbl = mermaidEscapeLabel(`Host: ${host}`, 120);
		const hostRows = byHost[host];
		const numCols = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(hostRows.length))));

		/* Assign stable node ids and split into columns (distribute row-by-row). */
		const colBuckets = Array.from({ length: numCols }, () => []);
		const nodeIds = hostRows.map(r => {
			const id = `n${nid}`;
			nid += 1;
			return { id, lbl: mermaidEscapeLabel(r.label, 100), off: r.inst.enabled === false };
		});
		nodeIds.forEach((n, i) => colBuckets[i % numCols].push(n.id));

		lines.push(`  subgraph ${sg} ["${hostLbl}"]`);
		lines.push(`    direction TB`);
		/* Node declarations — disabled instances get the offNode class */
		for (const { id, lbl, off } of nodeIds) {
			lines.push(off ? `    ${id}["${lbl}"]:::offNode` : `    ${id}["${lbl}"]`);
		}
		/* Invisible column chains → compact vertical stacking */
		for (const col of colBuckets) {
			if (col.length > 1) {
				lines.push(`    ${col.join(' ~~~ ')}`);
			}
		}
		lines.push('  end');
	}

	let out = lines.join('\n');
	if (out.length > MAX_OUTPUT_CHARS) {
		out = `${out.slice(0, MAX_OUTPUT_CHARS - 24)}\n%% [truncated]`;
	}
	return out;
}

module.exports = { buildAutoHostTopologyMermaid };
