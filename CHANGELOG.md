# CHANGELOG

## 0.0.1 (2026-04-01)

### Features
- Generate markdown documentation from adapter configuration
- Generate JSON documentation from adapter configuration
- Read basic ioBroker system information from `system.config`
- Read host information of the current adapter instance
- Detect adapter instances including host, enabled state, title and version
- Build enabled and disabled instance summaries
- Build per-host instance summaries
- Support optional filtering to enabled instances only
- Support optional compact markdown output without full instance details
- Support optional limit for documented instances
- Include applied filter metadata in markdown and JSON output
- Support automatic generation on adapter start
- Support manual generation via `action.generate`

### States
- Add `info.connection`
- Add `info.lastGeneration`
- Add `info.lastTrigger`
- Add `info.summary`
- Add `info.systemLanguage`
- Add `info.instanceCount`
- Add `info.enabledInstanceCount`
- Add `info.disabledInstanceCount`
- Add `info.instanceHosts`
- Add `info.hostName`
- Add `info.hostPlatform`
- Add `info.hostVersion`
- Add `documentation.markdown`
- Add `documentation.json`
- Add `action.generate`