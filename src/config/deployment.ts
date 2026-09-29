// Which build of the editor is running, decided at build time.
//
// Only the preview workflow (.github/workflows/vercel-preview.yml) sets VITE_DEPLOY_ENV
// and VITE_GIT_COMMIT_SHA. The production GitHub Pages build leaves both unset, so it
// resolves to 'production'.

export const GITHUB_REPO_URL = 'https://github.com/Avaviel/kle-cad'
// URL to link to from a preview build so users can get to the production site
export const PRODUCTION_URL = 'https://avaviel.github.io/kle-cad/'

export type DeploymentEnv = 'local' | 'preview' | 'production'

export const deploymentEnv: DeploymentEnv =
  import.meta.env.VITE_DEPLOY_ENV === 'preview'
    ? 'preview'
    : import.meta.env.DEV
      ? 'local'
      : 'production'

export const isPreviewDeployment = deploymentEnv === 'preview'

// Word for the header stamp and the tab title prefix; null on production, which stays unmarked.
export const deploymentLabel: string | null = deploymentEnv === 'production' ? null : deploymentEnv

// Commit the bundle was built from. Empty unless the preview workflow provided it.
export const commitSha: string = import.meta.env.VITE_GIT_COMMIT_SHA ?? ''
export const shortSha: string = commitSha.slice(0, 7)

export const commitUrl: string | null = commitSha ? `${GITHUB_REPO_URL}/commit/${commitSha}` : null
