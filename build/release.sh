# It should exit the script if any statement returns a non-true return value
set -e

if [[ -z $1 ]]; then
  echo "[Ballpen.js] Enter new version: "
  read VERSION
else
  VERSION=$1
fi

read -p "[Ballpen.js] Releasing v$VERSION - are you sure? (y/n)" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "[Ballpen.js] Releasing v$VERSION ..."

  # build
  VERSION=$VERSION npm run build

  # commit
  git add -A
  git commit -m "[Ballpen.js] New build and release - v$VERSION"
  npm version $VERSION --message "[Ballpen.js] Release - v$VERSION"

  # publish
  git push origin refs/tags/v$VERSION
  git push origin master
  npm publish
fi
