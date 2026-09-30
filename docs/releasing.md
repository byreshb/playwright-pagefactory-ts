# Releasing

Two channels exist: GitHub Releases, which is set up and used today, and npm, which is planned
but **not set up**.

## GitHub Release (in use)

A release is a git tag of the form `vX.Y.Z`. Pushing the tag triggers
`.github/workflows/release.yml`, which builds the package tarball and publishes a GitHub Release
with the matching changelog section as its notes.

1. **Write the changelog.** In `CHANGELOG.md`, move the entries under `## [Unreleased]` into a
   new heading `## [X.Y.Z] - YYYY-MM-DD`, and update the comparison links at the bottom.
2. **Set the version.** In `package.json` change `version` to `X.Y.Z` (run `npm install` so
   `package-lock.json` follows), and update the version in the README's install snippet.
3. **Commit and push** to `main`. Wait for the CI workflow to go green.
4. **Tag and push the tag:**

   ```bash
   git tag -a vX.Y.Z -m "Release X.Y.Z"
   git push origin vX.Y.Z
   ```

5. **Verify.** The Release workflow appears under Actions within a minute. It fails deliberately
   if the tag does not match the `package.json` version, or if the changelog has no section for
   the version. On success the release is at
   `https://github.com/byreshb/playwright-pagefactory-ts/releases/tag/vX.Y.Z` with the
   `playwright-pagefactory-ts-X.Y.Z.tgz` tarball attached.

Consumers can install a specific release straight from GitHub, or from the attached tarball:

```bash
npm install github:byreshb/playwright-pagefactory-ts#vX.Y.Z
npm install https://github.com/byreshb/playwright-pagefactory-ts/releases/download/vX.Y.Z/playwright-pagefactory-ts-X.Y.Z.tgz
```

### Fixing a bad release

Delete the release on GitHub, delete the tag (`git push origin :refs/tags/vX.Y.Z` and
`git tag -d vX.Y.Z`), fix the problem, and tag again. Never reuse a version number that anyone
may already have installed; prefer releasing a patch version instead.

## npm registry (planned, not set up)

> **Status: not done.** Nothing below is configured. Publishing to npm is free for public
> packages.

Once done, users can run `npm install playwright-pagefactory-ts` with no GitHub URL. One-time
setup:

1. Create an npm account at https://www.npmjs.com and enable two-factor authentication.
2. Confirm the package name is still free: `npm view playwright-pagefactory-ts` should return a 404.
3. `npm login`, then publish the first version by hand with `npm publish --access public`.
4. To publish from CI, create an npm automation token, store it as the `NPM_TOKEN` repository
   secret, and add a step to `release.yml` after the build:
   `npm publish --access public` with `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` and
   `actions/setup-node`'s `registry-url: https://registry.npmjs.org`.

A published npm version cannot be replaced, only deprecated or (within 72 hours) unpublished, so
publish only from a tagged commit whose CI run is green.
