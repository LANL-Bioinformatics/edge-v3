#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re
import json
import argparse
import os
import plotly.graph_objects as go
from plotly.subplots import make_subplots

import faqcs_len_histogram
import faqcs_ATGCcontent
import faqcs_ATGCcomposition
import faqcs_quality_histogram
import faqcs_quality_plots


def parse_qc_file(input_path):
    json_dict = {}
    criteria_labels = {}
    after_trimming = False

    with open(input_path, 'rt') as f:
        for line in f:
            line = line.strip()
            if line == "After Trimming":
                after_trimming = True
            m = re.search(r': ([\d.]+)', line)
            if m:
                if line.startswith("Reads #") and not after_trimming:
                    json_dict["inputReads"] = m.group(1)
                elif line.startswith("Total bases") and not after_trimming:
                    json_dict["inputBases"] = m.group(1)
                elif line.startswith("Reads Length") and not after_trimming:
                    json_dict["inputReadLength"] = m.group(1)
                elif line.startswith("Reads #") and after_trimming:
                    json_dict["outputReads"] = m.group(1)
                elif line.startswith("Total bases") and after_trimming:
                    json_dict["outputBases"] = m.group(1)
                elif line.startswith("Mean Reads Length") and after_trimming:
                    json_dict["outputReadLength"] = m.group(1)
                elif line.startswith("Paired Reads #"):
                    json_dict["outputPairedReads"] = m.group(1)
                elif line.startswith("Paired total bases"):
                    json_dict["outputPairedBases"] = m.group(1)
                elif line.startswith("Unpaired Reads #"):
                    json_dict["outputUnpairedReads"] = m.group(1)
                elif line.startswith("Unpaired total bases"):
                    json_dict["outputUnpairedBases"] = m.group(1)
                elif line.startswith("Discarded reads #"):
                    json_dict["filteredTotalReads"] = m.group(1)
                elif line.startswith("Trimmed bases"):
                    json_dict["trimmedTotalBases"] = m.group(1)
                elif "Reads Filtered by length" in line:
                    cutoff = re.search(r'cutoff \((.*?)\)', line)
                    label = f"Length < {cutoff.group(1)}" if cutoff else "Length Filtered"
                    criteria_labels["lenFilteredReads"] = label
                    json_dict["lenFilteredReads"] = m.group(1)
                elif "Bases Filtered by length" in line:
                    json_dict["lenFilteredBases"] = m.group(1)
                elif "Reads Filtered by continuous" in line:
                    count = re.search(r'"N" \((.*?)\)', line)
                    label = f'Continuous "N" ≥ {count.group(1)}' if count else 'Continuous N Filtered'
                    criteria_labels["nFilteredReads"] = label
                    json_dict["nFilteredReads"] = m.group(1)
                elif "Bases Filtered by continuous" in line:
                    json_dict["nFilteredBases"] = m.group(1)
                elif "Reads Filtered by low complexity" in line:
                    ratio = re.search(r'ratio \((.*?)\)', line)
                    label = f"Low Complexity > {ratio.group(1)}" if ratio else "Low Complexity Filtered"
                    criteria_labels["lcFilteredReads"] = label
                    json_dict["lcFilteredReads"] = m.group(1)
                elif "Bases Filtered by low complexity" in line:
                    json_dict["lcFilteredBases"] = m.group(1)
                elif "Reads Trimmed by quality" in line:
                    cutoff = re.search(r'quality \((.*?)\)', line)
                    label = f"Quality < {cutoff.group(1)}" if cutoff else "Quality Trimmed"
                    criteria_labels["qualTrimmedReads"] = label
                    json_dict["qualTrimmedReads"] = m.group(1)
                elif "Bases Trimmed by quality" in line:
                    json_dict["qualTrimmedBases"] = m.group(1)

    return json_dict, criteria_labels

def create_qc_plot(json_dict, criteria_labels, output_html):
    fig = make_subplots(rows=1, cols=2, subplot_titles=(
        "Reads Before and After Trimming",
        "Discarded Reads Breakdown with Cutoffs"
    ),column_widths=[0.35, 0.65])

    # Bar 1: Reads
    if 'outputPairedReads' in json_dict:
        # If paired and unpaired reads are available, use them
        x_vals = ["Before Trimming", "After Trimming - Paired", "After Trimming - Unpaired"]
        y_vals = [int(json_dict["inputReads"]),
                  int(json_dict.get("outputPairedReads", 0)),
                  int(json_dict.get("outputUnpairedReads", 0))]
        bar1_hover_text = [f'{json_dict["inputBases"]} bases<br>Avg Length: {json_dict.get("inputReadLength", "N/A")} bp',
                           f'{json_dict.get("outputPairedBases", 0)} bases',
                           f'{json_dict.get("outputUnpairedBases", 0)} bases']
    else:
        # If paired reads are not available, use total output reads
        x_vals = ["Before Trimming", "After Trimming"]
        y_vals = [int(json_dict["inputReads"]),
                  int(json_dict.get("outputReads", 0))]
        bar1_hover_text = [f'{json_dict["inputBases"]} bases<br>Avg Length: {json_dict.get("inputReadLength", "N/A")} bp',
                           f'{json_dict.get("outputBases", 0)} bases<br>Avg Length: {json_dict.get("outputReadLength", "N/A")} bp',]
    
    fig.add_trace(go.Bar(
        x=x_vals,
        y=y_vals,
        customdata=bar1_hover_text,
        hovertemplate="<br>".join([
                            "Reads: %{y}",
                            "Bases: %{customdata}"]) + "<extra></extra>",
        name="Reads Count"
    ), row=1, col=1)

    # Bar 2: Filters
    discard_keys = ["lenFilteredReads", "nFilteredReads", "lcFilteredReads", "qualTrimmedReads"]
    x_vals = [criteria_labels[k] for k in discard_keys]
    y_vals = [int(json_dict[k]) for k in discard_keys]
    hover_texts = [f'{int(float(json_dict.get(k.replace("Reads", "Bases"), 0)))} bases' for k in discard_keys]

    fig.add_trace(go.Bar(
        x=x_vals,
        y=y_vals,
        customdata=hover_texts,
        hovertemplate="<br>".join([
                            "Reads: %{y}",
                            "Bases: %{customdata}"]) + "<extra></extra>",
        name="Filtered Reads"
    ), row=1, col=2)

    fig.update_layout(
        title_text="QC Summary Plots",
        showlegend=False,
        xaxis2_title="Filter Criteria with Cutoffs"
    )

    fig.write_html(output_html)
    print(f"[✓] QC summary plot saved to: {output_html}")

def merge_html_plots(html_sections, output_path="QC_final_report.html"):
    def extract_body_content(html):
        match = re.search(r"<body.*?>(.*)</body>", html, re.DOTALL)
        return match.group(1).strip() if match else html

    wrapped_sections = []
    for title, html_path in html_sections:
        with open(html_path, "r") as f:
            section_body = extract_body_content(f.read())
        wrapped = f"""
<details open>
    <summary>{title}</summary>
    {section_body}
</details>
"""
        wrapped_sections.append(wrapped)

    final_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>QC Report</title>
    <style>
        details {{
            margin-bottom: 20px;
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 4px;
        }}
        summary {{
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
        }}
    </style>
</head>
<body>
    {''.join(wrapped_sections)}
</body>
</html>
"""
    with open(output_path, "w") as f:
        f.write(final_html)
    print(f"[✓] Final QC report written to: {output_path}")



def main(): 
    parser = argparse.ArgumentParser(description="Parse QC stats and generate plots.")
    parser.add_argument("input_file", help="Path to the QC.stats file")
    parser.add_argument("--json_out", default="QC.stats.json", help="Path to output JSON summary")
    parser.add_argument("--html_out", default="QC_summary_plots.html", help="Path to output HTML plot")
    parser.add_argument("--hist_out", default="QC_length_histogram.html", help="Path to output length histogram plot")
    parser.add_argument("--gc1_out", default="QC_input_GC_content.html", help="GC plot for input reads")
    parser.add_argument("--gc2_out", default="QC_trimmed_GC_content.html", help="GC plot for trimmed reads")
    parser.add_argument("--atcg_out", default="QC_ATCG_composition.html", help="ATCG composition plot")
    parser.add_argument("--N_composition_out", default="QC_N_composition.html", help="N composition plot")
    parser.add_argument("--trim5", type=int, default=0, help="Trim adjustment for 5' trimming (default: 0)")
    parser.add_argument("--qual_out", default="QC_quality_histogram.html", help="Path to output quality histogram plot")
    parser.add_argument("--boxplot_out", default="QC_quality_boxplot.html", help="Path to output quality boxplot")
    parser.add_argument("--qhist_out", default="QC_quality_score_histogram.html", help="Path to output quality score histogram plot")
    parser.add_argument("--q3d_input", default="QC_quality_3D_input.html", help="Path to output quality 3D plot for input reads")
    parser.add_argument("--q3d_trim", default="QC_quality_3D_trimmed.html", help="Path to output quality 3D plot for trimmed reads")
    # Final merged HTML output
    parser.add_argument("--final_out", default="QC_final_report.html", help="Path to merged final HTML output")



    args = parser.parse_args()

    json_dict, criteria_labels = parse_qc_file(args.input_file)

    # Write JSON
    with open(args.json_out, 'w') as f:
        json.dump(json_dict, f, indent=2)

    # Generate plot
    create_qc_plot(json_dict, criteria_labels, args.html_out)

    # Check for histogram inputs
    qc_stats_dir = os.path.dirname(os.path.abspath(args.input_file))
    # Histogram files
    hist1 = os.path.join(qc_stats_dir, "qa.QC.length_count.txt")
    hist2 = os.path.join(qc_stats_dir, "QC.length_count.txt")
    if os.path.isfile(hist1) and os.path.isfile(hist2):
        qa_bar, qa_annot, _ = faqcs_len_histogram.length_histogram(hist1, "Input Length", "Count (millions)")
        main_bar, main_annot, _ = faqcs_len_histogram.length_histogram(hist2, "Trimmed Length", "Count (millions)")
        hist_fig = faqcs_len_histogram.combine_length_histogram(qa_bar, main_bar, qa_annot, main_annot)
        hist_fig.write_html(args.hist_out)
    else:
        print("[!] Skipping histogram section — required length_count.txt files not found.")
        args.hist_out = None

    # GC content files
    base1 = os.path.join(qc_stats_dir, "qa.QC.base_content.txt")
    base2 = os.path.join(qc_stats_dir, "QC.base_content.txt")
    if os.path.isfile(base1) and os.path.isfile(base2):
        gc_fig1 = faqcs_ATGCcontent.read_gc_plot(base1, "Input Reads")
        gc_fig2 = faqcs_ATGCcontent.read_gc_plot(base2, "Trimmed Reads")
        gc_fig1.write_html(args.gc1_out)
        gc_fig2.write_html(args.gc2_out)
    else:
        print("[!] Skipping GC content section — required base_content.txt files not found.")
        args.gc1_out = None
        args.gc2_out = None

    # ATCG composition plots
    base_matrix1 = os.path.join(qc_stats_dir, "qa.QC.base.matrix")
    base_matrix2 = os.path.join(qc_stats_dir, "QC.base.matrix")
    if os.path.isfile(base_matrix1) and os.path.isfile(base_matrix2):
        atcg_fig1, qa_n_base, qa_total_reads = faqcs_ATGCcomposition.atcg_composition_plot(base_matrix1, "Input Reads Base", "Base content (%)", 0)
        atcg_fig2, n_base, total_reads = faqcs_ATGCcomposition.atcg_composition_plot(base_matrix2, "Trimmed Reads Base", args.trim5)
        combined_atcg = faqcs_ATGCcomposition.combine_atcg_plots(atcg_fig1, atcg_fig2)
        combined_atcg.write_html(args.atcg_out)
        print(f"[✓] ATCG plot saved to {args.atcg_out}")
        if qa_n_base.sum() > 0:
            n_fig1 = faqcs_ATGCcomposition.n_composition_plot(qa_n_base, "Input Reads Position", "N Base count per million reads", int(json_dict["inputReads"]), 0)
            n_fig2 = faqcs_ATGCcomposition.n_composition_plot(n_base, "Trimmed Reads Position", "", int(json_dict["inputReads"]), args.trim5)
            n_combined = faqcs_ATGCcomposition.combine_n_plots(n_fig1, n_fig2)
            n_combined.write_html(args.N_composition_out)
            print(f"[✓] N base plot saved to {args.N_composition_out}")

    # Quality histogram files
    qual1 = os.path.join(qc_stats_dir, "qa.QC.for_qual_histogram.txt")
    qual2 = os.path.join(qc_stats_dir, "QC.for_qual_histogram.txt")

    if os.path.isfile(qual1) and os.path.isfile(qual2):
        qh_fig1, qa_annotation, qh_min1, qh_max1 = faqcs_quality_histogram.quality_histogram(qual1, "Input Reads Avg Score")
        qh_fig2, main_annotation, qh_min2, qh_max2 = faqcs_quality_histogram.quality_histogram(qual2, "Trimmed Reads Avg Score")
        combined_qual = faqcs_quality_histogram.combine_quality_histograms(qh_fig1, qh_fig2, qa_annotation, main_annotation, qh_min1, qh_max1, qh_min2, qh_max2)
        combined_qual.write_html(args.qual_out)
        print(f"[✓] Quality histogram written to {args.qual_out}")

    # Quality boxplot and 3D plots
    qa_matrix = os.path.join(qc_stats_dir, "qa.QC.quality.matrix")
    trim_matrix = os.path.join(qc_stats_dir, "QC.quality.matrix")
    if os.path.isfile(qa_matrix) and os.path.isfile(trim_matrix):
        boxplot_fig1, boxplot_anno1 = faqcs_quality_plots.manual_quality_boxplot(qa_matrix, int(json_dict["inputReads"]), int(json_dict["inputBases"]), "Input Reads Position", "Quality score", 0)
        boxplot_fig2, boxplot_anno2 = faqcs_quality_plots.manual_quality_boxplot(trim_matrix, int(json_dict["outputReads"]), int(json_dict["outputBases"]), "Trimmed Reads Position", "Quality score", 0)
        faqcs_quality_plots.combine_boxplots(boxplot_fig1, boxplot_fig2, boxplot_anno1, boxplot_anno2).write_html(args.boxplot_out)
        print(f"[✓] Quality boxplot written to {args.boxplot_out}")

        q3d_fig1 = faqcs_quality_plots.quality_3d_plot(qa_matrix, "Input Reads", "Q Score")
        q3d_fig2 = faqcs_quality_plots.quality_3d_plot(trim_matrix, "Trimmed Reads", "Q Score")
        q3d_fig1.write_html(args.q3d_input)
        q3d_fig2.write_html(args.q3d_trim)
        print(f"[✓] Quality 3D plots written to {args.q3d_input}, {args.q3d_trim}")

        qbar_fig1, qbar_anno1 = faqcs_quality_plots.quality_count_histogram(qa_matrix, qh_max1, "Input Reads Q score", "Total (million)")
        qbar_fig2, qbar_anno2 = faqcs_quality_plots.quality_count_histogram(trim_matrix, qh_max1, "Trimmed Reads Q score", "")
        faqcs_quality_plots.combine_quality_histograms(qbar_fig1, qbar_fig2, qbar_anno1, qbar_anno2).write_html(args.qhist_out)
        print(f"[✓] Quality score histogram written to {args.qhist_out}")
    
    # Merge into final report
    sections = [("QC Summary Plots", args.html_out)]
    if os.path.isfile(args.hist_out):
        sections.append(("Length Histogram", args.hist_out))
    if os.path.isfile(args.gc1_out) and os.path.isfile(args.gc2_out):
        sections.append(("GC Content - Input", args.gc1_out))
        sections.append(("GC Content - Trimmed", args.gc2_out))
    if os.path.isfile(args.atcg_out):
        sections.append(("ATCG Composition", args.atcg_out))
    if os.path.isfile(args.N_composition_out):
        sections.append(("N Composition", args.N_composition_out))
    if os.path.isfile(args.qual_out):
        sections.append(("Average Quality Histogram", args.qual_out))
    if os.path.isfile(args.boxplot_out):
        sections.append(("Quality Boxplot", args.boxplot_out))
    if os.path.isfile(args.q3d_input) and os.path.isfile(args.q3d_trim):
        sections.append(("Quality 3D Plots - Input", args.q3d_input))
        sections.append(("Quality 3D Plots - Trimmed", args.q3d_trim))
    if os.path.isfile(args.qhist_out):
        sections.append(("Quality Score Histogram", args.qhist_out))

    merge_html_plots(sections, args.final_out)

if __name__ == "__main__":
    main()