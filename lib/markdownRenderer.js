/**
 * AutoDoc Markdown Renderer Module
 * Renders document models to Markdown format
 */

class MarkdownRenderer {
    constructor(adapter) {
        this.adapter = adapter;
    }

    /**
     * Render complete document model to Markdown
     * @param {Object} docModel Document model
     * @returns {string} Markdown content
     */
    renderMarkdown(docModel) {
        const config = this.adapter.config;
        const profile = config.profile || 'admin';

        let markdown = '';

        // Title and metadata
        markdown += this.renderHeader(docModel, profile);

        // Table of contents
        markdown += this.renderTableOfContents();

        // System chapter
        markdown += this.renderSystemChapter(docModel);

        // Adapters chapter
        markdown += this.renderAdaptersChapter(docModel, profile);

        // Manual context
        if (config.manualContext) {
            markdown += this.renderManualContext(config.manualContext);
        }

        // Appendices
        markdown += this.renderAppendices(docModel);

        return markdown;
    }

    /**
     * Render document header
     * @param {Object} docModel Document model
     * @param {string} profile Target profile
     * @returns {string} Header markdown
     */
    renderHeader(docModel, profile) {
        const config = this.adapter.config;

        return `# ${config.projectName || 'ioBroker System'} Documentation

**Generated:** ${new Date(docModel.meta.generatedAt).toLocaleString()}
**Profile:** ${profile}
**System:** ${config.targetSystem || 'Production'}
**Trigger:** ${docModel.meta.trigger}

---
`;
    }

    /**
     * Render table of contents
     * @returns {string} Table of contents markdown
     */
    renderTableOfContents() {
        return `## Table of Contents

1. [System Overview](#system-overview)
2. [Adapter Instances](#adapter-instances)
3. [Manual Information](#manual-information)
4. [Appendices](#appendices)

---
`;
    }

    /**
     * Render system overview chapter
     * @param {Object} docModel Document model
     * @returns {string} System chapter markdown
     */
    renderSystemChapter(docModel) {
        const system = docModel.system;
        const stats = system.statistics;

        return `## System Overview

### Project Information
- **Project Name:** ${system.projectName}
- **Target System:** ${system.targetSystem}

### Primary Host
- **Name:** ${system.primaryHost.name}
- **Platform:** ${system.primaryHost.platform}
- **Version:** ${system.primaryHost.version}

### System Statistics
- **Total Adapter Instances:** ${stats.instanceCount}
- **Enabled Instances:** ${stats.enabledInstanceCount}
- **Disabled Instances:** ${stats.disabledInstanceCount}
- **Total State Objects:** ${stats.totalStateObjects}
- **Writable States:** ${stats.writableStateObjects}
- **Read-only States:** ${stats.readonlyStateObjects}

### Hosts
${system.hosts.map(host => `- **${host.name}** (${host.platform}) - v${host.version}`).join('\n')}

---
`;
    }

    /**
     * Render adapters chapter
     * @param {Object} docModel Document model
     * @param {string} profile Target profile
     * @returns {string} Adapters chapter markdown
     */
    renderAdaptersChapter(docModel, profile) {
        const adapters = docModel.adapters;
        const config = this.adapter.config;

        let markdown = `## Adapter Instances

### Overview
- **Total Adapters:** ${adapters.totalAdapters}
- **Total Instances:** ${adapters.adapters.reduce((sum, adapter) => sum + adapter.totalInstances, 0)}

### Adapter Details

`;

        for (const adapter of adapters.adapters) {
            markdown += `#### ${adapter.name}
- **Total Instances:** ${adapter.totalInstances}
- **Enabled Instances:** ${adapter.enabledInstances}

`;

            // Instance details based on profile and config
            if (!config.hideInstanceDetailsInMarkdown) {
                for (const instance of adapter.instances) {
                    markdown += `- **${instance.id}** (${instance.enabled ? 'enabled' : 'disabled'}) - ${instance.version || 'unknown version'}
`;
                }
            }

            markdown += '\n';
        }

        markdown += '---\n';
        return markdown;
    }

    /**
     * Render manual context chapter
     * @param {Object} manualContext Manual context from config
     * @returns {string} Manual context markdown
     */
    renderManualContext(manualContext) {
        let markdown = `## Manual Information

`;

        if (manualContext.description) {
            markdown += `### Description
${manualContext.description}

`;
        }

        if (manualContext.contact) {
            markdown += `### Contact
${manualContext.contact}

`;
        }

        if (manualContext.notes) {
            markdown += `### Additional Notes
${manualContext.notes}

`;
        }

        markdown += '---\n';
        return markdown;
    }

    /**
     * Render appendices
     * @param {Object} docModel Document model
     * @returns {string} Appendices markdown
     */
    renderAppendices(docModel) {
        const appendices = docModel.appendices;

        return `## Appendices

### State Objects Summary
- **Total:** ${appendices.stateSummary.total}
- **Writable:** ${appendices.stateSummary.writable}
- **Read-only:** ${appendices.stateSummary.readonly}

### Collection Information
- **Collected at:** ${new Date(appendices.collectionTimestamp).toLocaleString()}
- **Schema Version:** ${docModel.meta.schemaVersion}

---
*Generated by ioBroker.autodoc v${docModel.meta.version}*
`;
    }
}

module.exports = MarkdownRenderer;