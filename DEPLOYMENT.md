# KeepOrDelete Deployment Setup

KeepOrDelete automatically deploys prebuilt binaries via GitHub Actions.

There are presently two GitHub Action workflows found in `.github/workflows/`:

+ `build.yml`: Builds with `npm start` and tests with `npm test`.
+ `deploy.yml`: Compiles binaries and publishes them under a drafted release [here](https://github.com/COSC481W-2025Winter/KeepOrDelete/releases).

These workflows trigger on different conditions that are defined at the top of their files.

## Publishing a new release with `deploy.yml`

So the project has some new feature(s) and you want to deploy a new release! Here's how:

1. Increment the version number in `package.json`. Optionally consult [Semantic Versioning guidelines](https://semver.org/), or just make one of the numbers bigger.
2. Commit the version change with `git commit`.
3. Create a tag on the new commit with a name identical to the new version number, e.g. `git tag 1.1.0`.
4. Push the commit with `git push`.
5. Push the tag with `git push —-tags`.
