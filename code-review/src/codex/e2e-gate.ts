export function shouldRunCodexE2E(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.RUN_CODEX_E2E === "true";
}
