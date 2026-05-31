# Auto Update Setup

The app is configured for GitHub Releases updates.

## One-time setup

1. Create a free GitHub account if needed.
2. Create a repository named `weekly-premium-email-builder`.
3. Create a GitHub personal access token with permission to publish releases if GitHub CLI is not already logged in.
4. In PowerShell, set the token before releasing if needed:

```powershell
$env:GH_TOKEN="your_github_token_here"
```

## Publish a new update

After changing the app version in `package.json`, run:

```powershell
npm run release
```

The installed app checks GitHub Releases when it starts. You can also use File > Check for Updates.

## Important

Auto-updates work from the installed setup version, not the portable `Latest.exe`.
