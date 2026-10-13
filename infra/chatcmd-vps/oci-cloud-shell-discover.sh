#!/usr/bin/env bash
# OCI Cloud Shell read-only discovery. This does not deploy, create or alter anything.
set -euo pipefail
umask 077
command -v oci >/dev/null || { echo "Use Oracle Cloud Shell (OCI CLI unavailable)"; exit 2; }
command -v jq >/dev/null || { echo "jq unavailable"; exit 2; }
tenancy="$OCI_TENANCY_OCID"
if [ -z "$tenancy" ] && [ -r "$HOME/.oci/config" ]; then
  tenancy="$(awk -F= '/^[[:space:]]*tenancy[[:space:]]*=/{gsub(/[[:space:]]/,"",$2);print $2;exit}' "$HOME/.oci/config")"
fi
case "$tenancy" in ocid1.tenancy.*) ;; *) echo "Set OCI_TENANCY_OCID from the Oracle Cloud tenancy console. Never share API keys."; exit 2;; esac
echo "OCI_DISCOVERY=read_only"
regions="$(oci iam region-subscription list --tenancy-id "$tenancy" --output json | jq -r '.data[]? | ."region-name"')"
compartments="$(oci iam compartment list --compartment-id "$tenancy" --compartment-id-in-subtree true --access-level ACCESSIBLE --all --output json | jq -r '.data[]? | select(."lifecycle-state" == "ACTIVE") | .id')"
count=0
failures=0
for region in $regions; do
  printf 'REGION=%s\n' "$region"
  for compartment in "$tenancy" $compartments; do
    if ! output="$(oci compute instance list --compartment-id "$compartment" --region "$region" --all --output json 2>/dev/null)"; then
      failures=$((failures+1))
      continue
    fi
    while IFS=$'\t' read -r name state id; do
      [ -n "$id" ] || continue
      count=$((count+1))
      printf 'INSTANCE=%s | STATE=%s | REGION=%s | OCID=%s\n' "$name" "$state" "$region" "$id"
    done < <(jq -r '.data[]? | [.["display-name"], .["lifecycle-state"], .id] | @tsv' <<< "$output")
  done
done
printf 'FOUND_INSTANCES=%s\nQUERY_FAILURES=%s\n' "$count" "$failures"
echo "OCI_DISCOVERY_COMPLETE=true"
