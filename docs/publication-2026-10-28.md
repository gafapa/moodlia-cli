# User management publication verification

`moodlia@0.5.2` is published on npm and the `latest` tag resolves to `0.5.2`. The package includes the plugin `v0.1.222` operation contract and user management documentation.

The registry tarball was downloaded independently and matched the submitted artifact byte for byte. A clean installation with lifecycle scripts disabled installed two packages. Both `plugin list-users --help` and `plugin set-user-suspended --help` passed from that installation. Registry hashes and verification time are recorded in [the evidence](evidence/publication-2026-10-28.json).

The source commit is `095f2fba61cfa93e2e9b9b269f91b47a9c6051a3`; [CI run 40776825039](https://github.com/gafapa/moodlia-cli/actions/runs/40776825039) passed. The matching [GitHub release](https://github.com/gafapa/moodlia-cli/releases/tag/v0.5.2) is published.

Install or update with:

```sh
npm install -g moodlia@0.5.2
```

The Moodle plugin was separately deployed to Aula and Clases. Reconnect MCP clients to refresh their tool catalog after the plugin upgrade. Production checks used read-only requests and invalid-input rejection; account mutations were covered by the native Moodle test matrix rather than performed on production accounts.
