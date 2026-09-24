# Accepted source batches

The consolidated corpus in `20260915-consolidated-v4/` was assembled from these
accepted, independently validated measurement batches:

- `20260914-corrected-v4-m3/`
- `20260914-corrected-v6-m4/`
- `20260914-corrected-v4-m7/`
- `20260914-corrected-v4-output/`
- `20260914-corrected-v4-resources/`

Each batch contains its CSV results, metadata, manifests, and validation
artifacts. Complete raw logs are stored inside the batch as
`measurement-logs.tar.gz`; they are compressed because individual uncompressed
output logs exceed GitHub's file-size limit. Extract an archive from its batch
directory with:

```sh
tar -xzf measurement-logs.tar.gz
```

Verify the archives from the repository root with:

```sh
shasum -a 256 -c results/validated-reruns/accepted-log-archives.sha256
```

The uncompressed local log directories are intentionally not tracked. The
archives preserve their original `tier1/logs/` and `tier2/logs/` paths.
