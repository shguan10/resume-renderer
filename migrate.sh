#!/bin/bash

# Ensure both directory arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <source_dir_A> <target_dir_B>"
    exit 1
fi

DIR_A=$1
DIR_B=$2
TARBALL="transfer_$(date +%s).tar.gz"

# 1. Tar + Gzip DIR_A excluding .git
# -C changes to the directory first so the archive doesn't contain the parent path
echo "Creating tarball of $DIR_A (excluding .git, dist, node_modules)..."
tar --exclude='.git' --exclude='dist' --exclude='node_modules' -czf "/tmp/$TARBALL" -C "$DIR_A" .

# 2. Clear DIR_B except for .git
# mindepth 1 prevents the tool from deleting DIR_B itself
echo "Clearing $DIR_B (except .git)..."
find "$DIR_B" -mindepth 1 -maxdepth 1 ! -name ".git" -exec rm -rf {} +

# 3. Move, Extract, and Cleanup
echo "Extracting tarball to $DIR_B..."
tar -xzf "/tmp/$TARBALL" -C "$DIR_B"
rm "/tmp/$TARBALL"

echo "Success: $DIR_A copied to $DIR_B (Git history preserved in $DIR_B)."
