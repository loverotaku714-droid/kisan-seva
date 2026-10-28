#!/usr/bin/env bash
# Publishes the GitHub profile README + polishes kisan-seva repo metadata.
# Usage:  bash publish_github_profile.sh <GITHUB_TOKEN> [--reauthor]
#   <GITHUB_TOKEN>  a fresh PAT with classic "repo" scope (or fine-grained:
#                   Contents read/write + Administration read/write on your repos)
#   --reauthor      ALSO rewrite kisan-seva commit history so all past commits
#                   ("Z User <z@container>") are attributed to the GitHub profile
#                   and force-push main. Use once.
# The token is used inline only — never echoed, never written to disk.
set -euo pipefail

TOKEN="${1:?Usage: publish_github_profile.sh <GITHUB_TOKEN> [--reauthor]}"
MODE="${2:-}"
GH_USER="loverotaku714-droid"
GH_ID="300504935"
NOREPLY="${GH_ID}+${GH_USER}@users.noreply.github.com"
API="https://api.github.com"
AUTH_H="Authorization: Bearer ${TOKEN}"
ACCEPT_H="Accept: application/vnd.github+json"
README_SRC="/home/z/my-project/download/github-profile/README.md"
DEMO_URL="https://kisan-seva-z764.onrender.com"

echo "== 1/4 Creating profile repo ${GH_USER}/${GH_USER} =="
code=$(curl -s -o /tmp/prof_create.json -w '%{http_code}' -X POST "${API}/user/repos" \
  -H "${AUTH_H}" -H "${ACCEPT_H}" \
  -d "{\"name\":\"${GH_USER}\",\"description\":\"My GitHub profile — featured: Kisan Seva, a voice assistant for farmers\",\"private\":false,\"has_wiki\":false,\"auto_init\":false}")
if [ "$code" = "201" ]; then
  echo "   created OK"
elif [ "$code" = "422" ]; then
  echo "   already exists — reusing it"
else
  echo "   ERROR (HTTP ${code}):"; cat /tmp/prof_create.json; exit 1
fi

echo "== 2/4 Pushing profile README =="
WORK="$(mktemp -d)"
git init -q -b main "${WORK}"
cp "${README_SRC}" "${WORK}/README.md"
git -C "${WORK}" add README.md
git -C "${WORK}" -c user.name="ASJADAHMED07" -c user.email="${NOREPLY}" commit -qm "Add profile README"
git -C "${WORK}" remote add origin "https://x-access-token:${TOKEN}@github.com/${GH_USER}/${GH_USER}.git"
git -C "${WORK}" push -q --force -u origin main
rm -rf "${WORK}"
echo "   README pushed (profile page will render it within seconds)"

echo "== 3/4 Setting kisan-seva homepage (About panel link) =="
code=$(curl -s -o /tmp/patch_repo.json -w '%{http_code}' -X PATCH "${API}/repos/${GH_USER}/kisan-seva" \
  -H "${AUTH_H}" -H "${ACCEPT_H}" \
  -d "{\"homepage\":\"${DEMO_URL}\"}")
echo "   PATCH status: ${code} (200 = demo link now visible in About)"

if [ "${MODE}" = "--reauthor" ]; then
  echo "== 4/4 Re-authoring kisan-seva history + force-push =="
  cd /home/z/my-project
  git filter-branch -f --env-filter '
export GIT_AUTHOR_NAME="ASJADAHMED07"
export GIT_AUTHOR_EMAIL="'"${NOREPLY}"'"
export GIT_COMMITTER_NAME="ASJADAHMED07"
export GIT_COMMITTER_EMAIL="'"${NOREPLY}"'"
' -- main
  git push "https://x-access-token:${TOKEN}@github.com/${GH_USER}/kisan-seva.git" main:main --force
  echo "   history rewritten and pushed — every commit now links to the profile"
else
  echo "== 4/4 Skipped (--reauthor not given): past commits stay as 'Z User' =="
fi

echo
echo "DONE. Verify: https://github.com/${GH_USER}"
echo "Security reminder: revoke this token after the run (GitHub > Settings > Developer settings)."
