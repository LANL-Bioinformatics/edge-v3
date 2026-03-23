#!/usr/bin/env bash

set -euo pipefail


project_dir=""
jbrowse2_base_dir=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --project-dir)
            project_dir="$2"
            shift 2
            ;;
        --jbrowse2-base-dir)
            jbrowse2_base_dir="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

if [[ -z "$project_dir" || -z "$jbrowse2_base_dir" ]]; then
    echo "Usage: $0 --project-dir DIR --jbrowse2-base-dir DIR" >&2
    exit 1
fi

mkdir -p "$project_dir"

shopt -s nullglob

refbased_dir="$project_dir/output/RefBased"
outdir="$project_dir/output/Jbrowse2"
config_json="$outdir/ref_config.json"
ui_json="$refbased_dir/jbrowse2_path.json"
reference_fasta="$refbased_dir/reference.fasta"

mkdir -p "$outdir"

if [[ ! -s "$reference_fasta" ]]; then
    echo "Missing reference FASTA: $reference_fasta" >&2
    exit 1
fi

rm -f "$config_json"

samtools faidx "$reference_fasta"

declare -A fasta_seq_ids=()
while read -r seq_id _; do
    fasta_seq_ids["$seq_id"]=1
done < <(awk '/^>/ {sub(/^>/, "", $1); print $1}' "$reference_fasta")

first_seq_id="$(awk '/^>/ {sub(/^>/, "", $1); print $1; exit}' "$reference_fasta")"

track_name_from_gff() {
    local gff_file="$1"
    local seq_id
    seq_id="$(awk 'BEGIN { FS = "\t" } $0 !~ /^#/ && NF > 0 { print $1; exit }' "$gff_file")"
    if [[ -n "$seq_id" && -n "${fasta_seq_ids[$seq_id]:-}" ]]; then
        printf '%s\n' "$seq_id"
    else
        basename "$gff_file" | sed -E 's/\.(gff3|gff)$//'
    fi
}

track_name_from_bam() {
    local bam_file="$1"
    local seq_id
    seq_id="$(
        samtools view -H "$bam_file" | awk '
            /^@SQ/ {
                for (i = 1; i <= NF; i++) {
                    if ($i ~ /^SN:/) {
                        sub(/^SN:/, "", $i)
                        print $i
                        exit
                    }
                }
            }
        '
    )"
    if [[ -n "$seq_id" && -n "${fasta_seq_ids[$seq_id]:-}" ]]; then
        printf '%s\n' "$seq_id"
    else
        basename "$bam_file" .bam
    fi
}

track_name_from_vcf() {
    local vcf_file="$1"
    local seq_id
    seq_id="$(awk 'BEGIN { FS = "\t" } $0 !~ /^#/ && NF > 0 { print $1; exit }' "$vcf_file")"
    if [[ -n "$seq_id" && -n "${fasta_seq_ids[$seq_id]:-}" ]]; then
        printf '%s\n' "$seq_id"
    else
        basename "$vcf_file" | sed -E 's/\.vcf(\.gz)?$//'
    fi
}

jbrowse add-assembly \
    --load copy \
    --out "$config_json" \
    "$reference_fasta" \
    --force


for gff in "$refbased_dir"/*.gff "$refbased_dir"/*.gff3; do
    gff_base="$(basename "$gff")"

    if [[ "$gff_base" == "reference.gff" || "$gff_base" == "reference.gff3" ]]; then
        continue
    fi

    gff_gz="$outdir/${gff_base}.gz"
    bgzip -f -c "$gff" > "$gff_gz"
    tabix -f -p gff "$gff_gz"

    jbrowse add-track \
        "$gff_gz" \
        --load symlink \
        --out "$config_json" \
        --category Annotations \
        --name "$(track_name_from_gff "$gff")" \
        --force

done

for bam in "$refbased_dir"/*.bam; do
    if [[ ! -e "${bam}.bai" ]]; then
        samtools index "$bam"
    fi
    jbrowse add-track \
        "$bam" \
        --load symlink \
        --out "$config_json" \
        --category Alignments \
        --name "$(track_name_from_bam "$bam")" \
        --force
done

for vcf in "$refbased_dir"/*.vcf; do
    if [[ "$(basename "$vcf")" == "readsToRef.vcf" ]]; then
        continue
    fi

    if [[ ! -e "${vcf}.gz" ]]; then
        bgzip -f -c "$vcf" > "${vcf}.gz"
    fi
    if [[ ! -e "${vcf}.gz.tbi" ]]; then
        tabix -f -p vcf "${vcf}.gz"
    fi
    jbrowse add-track \
        "${vcf}.gz" \
        --load symlink \
        --out "$config_json" \
        --category Variants \
        --name "$(track_name_from_vcf "$vcf")" \
        --force
done

project_id="$(basename "$project_dir")"
symlinked_jbrowse2_dir="$jbrowse2_base_dir/data/$project_id"

mkdir -p "$jbrowse2_base_dir/data"
ln -sfn "$outdir" "$symlinked_jbrowse2_dir"

cat > "$ui_json" <<EOF
{
  "jbrowse2_path": "jbrowse2/?config=data%2F${project_id}%2Fref_config.json&&loc=${first_seq_id}:1..10000&tracks=reference-ReferenceSequenceTrack&assembly=reference&tracklist=true"
}
EOF
