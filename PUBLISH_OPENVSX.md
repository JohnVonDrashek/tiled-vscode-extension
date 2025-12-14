# Publishing to Open VSX Registry

This guide will help you publish the TILED Map Viewer extension to the [Open VSX Registry](https://open-vsx.org).

## Prerequisites

1. **Create an Open VSX Account**
   - Go to [open-vsx.org](https://open-vsx.org)
   - Sign in with your GitHub account
   - Sign the [Eclipse Foundation Open VSX Publisher Agreement](https://www.eclipse.org/legal/open-vsx-registry-faq/)

2. **Generate a Personal Access Token (PAT)**
   - Go to your Open VSX account settings
   - Generate a new Personal Access Token
   - Save this token securely (you'll need it for publishing)

3. **Create a Namespace** (one-time setup)
   ```bash
   npx ovsx create-namespace csharp-forge -p <YOUR_TOKEN>
   ```
   Replace `<YOUR_TOKEN>` with your Personal Access Token.

## Publishing

### Option 1: Automated Publishing via GitHub Actions (Recommended)

The extension includes a GitHub Actions workflow that automatically publishes to Open VSX when you create a release tag.

**Setup (one-time):**
1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `OPEN_VSX_TOKEN`
5. Value: Your Open VSX Personal Access Token
6. Click **Add secret**

**Publishing:**
1. Update the version in `package.json` (if you want a new version)
   - **Important**: Open VSX requires unique version numbers. If you push multiple commits with the same version, publishing will fail.
   - Consider using `npm run increment-version` to automatically bump the patch version before committing
2. Commit and push your changes to the `main` branch
3. The GitHub Action will automatically build and publish your extension on every push to main

**Manual Trigger:**
You can also manually trigger the workflow from the GitHub Actions tab:
1. Go to **Actions** in your repository
2. Select **Publish to Open VSX** workflow
3. Click **Run workflow**

### Option 2: Manual Publishing from Command Line

**Publish from source:**
This will compile and publish your extension:
```bash
export OVSX_TOKEN=<YOUR_TOKEN>
npm run publish:openvsx
```

**Publish a pre-built .vsix file:**
If you already have a `.vsix` file:
```bash
npx ovsx publish tiled-map-viewer-*.vsix -p <YOUR_TOKEN>
```

## Updating

### Using GitHub Actions (Recommended)
1. Update the version in `package.json` (if you want a new version number)
2. Commit and push to `main` branch
3. The workflow will automatically publish the new version

### Manual Update
1. Update the version in `package.json`
2. Run `npm run publish:openvsx` (or use the GitHub Action)

## Troubleshooting

- **Namespace not found**: Make sure you've created the namespace first using `ovsx create-namespace`
- **Token issues**: Verify your token is valid and has the correct permissions
- **License errors**: Ensure your `package.json` has a valid `license` field (MIT is set)

## References

- [Open VSX Publishing Guide](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)
- [Open VSX FAQ](https://www.eclipse.org/legal/open-vsx-registry-faq/)
