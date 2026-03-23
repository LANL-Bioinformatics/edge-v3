#!/usr/bin/env bash

set -euo pipefail

outdir=""
assembly=""
gff=""
bam=""
vcf=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --outdir)
            outdir="$2"
            shift 2
            ;;
        --assembly)
            assembly="$2"
            shift 2
            ;;
        --gff)
            gff="$2"
            shift 2
            ;;
        --bam)
            bam="$2"
            shift 2
            ;;
        --vcf)
            vcf="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

if [[ -z "$outdir" || -z "$assembly" || -z "$bam" ]]; then
    echo "Usage: $0 --outdir DIR --assembly reference.fasta --bam reads.sort.bam [--gff reference.gff] [--vcf reads.vcf]" >&2
    exit 1
fi

mkdir -p "$outdir"

assembly_base="$(basename "$assembly")"
bam_base="$(basename "$bam")"

cp "$assembly" "$outdir/$assembly_base"
samtools faidx "$outdir/$assembly_base"

jbrowse create "$outdir" --force
jbrowse add-assembly "$outdir/$assembly_base" \
    --out "$outdir" \
    --load inPlace \
    --force

cp "$bam" "$outdir/$bam_base"
samtools index -b "$outdir/$bam_base"
jbrowse add-track "$outdir/$bam_base" \
    --out "$outdir" \
    --load inPlace \
    --force

if [[ -n "$gff" && -s "$gff" ]]; then
    gff_base="$(basename "$gff")"
    sorted_gff="$outdir/${gff_base%.gz}.sorted"
    awk 'BEGIN { header = 1 } /^#/ && header { print; next } { header = 0; print > "'"$sorted_gff"'.body" }' "$gff" > "$sorted_gff"
    sort -k1,1 -k4,4n "$sorted_gff.body" >> "$sorted_gff"
    rm -f "$sorted_gff.body"
    bgzip -f "$sorted_gff"
    tabix -f -p gff "$sorted_gff.gz"
    jbrowse add-track "$sorted_gff.gz" \
        --out "$outdir" \
        --load inPlace \
        --force
fi

if [[ -n "$vcf" && -s "$vcf" ]]; then
    vcf_base="$(basename "$vcf")"
    bgzip -f -c "$vcf" > "$outdir/$vcf_base.gz"
    tabix -f -p vcf "$outdir/$vcf_base.gz"
    jbrowse add-track "$outdir/$vcf_base.gz" \
        --out "$outdir" \
        --load inPlace \
        --force
fi
