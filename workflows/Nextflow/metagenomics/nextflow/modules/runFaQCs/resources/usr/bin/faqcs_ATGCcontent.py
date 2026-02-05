#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
This script reads base content data from a specified file, computes statistics for each base ratio (A, T, C, G, and GC), and generates a multi-panel plot using Plotly.
It supports reading data before and after trimming, allowing for comparison of base content distributions.
"""
import pandas as pd
import numpy as np
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import argparse
import os

def read_gc_plot(base_content_file, title_prefix):
    df = pd.read_csv(base_content_file, sep="\t", header=None, names=["Base", "Percent", "Count"])
    
    base_data = {}
    for base in ["A", "T", "C", "G", "GC"]:
        base_data[base] = df[df["Base"] == base][["Percent", "Count"]].astype(float)

    def compute_stats(base_df):
        avg = np.average(base_df["Percent"], weights=base_df["Count"])
        std = np.sqrt(np.average((base_df["Percent"] - avg)**2, weights=base_df["Count"]))
        bin_counts = base_df.groupby(pd.cut(base_df["Percent"], bins=np.arange(0, 101, 1)))["Count"].sum()
        return avg, std, bin_counts.fillna(0)

    stats = {base: compute_stats(base_data[base]) for base in ["GC", "A", "T", "C", "G"]}

    fig = make_subplots(
        rows=5, cols=1,
        row_heights=[0.4, 0.15, 0.15, 0.15, 0.15],
        shared_xaxes=False,
        subplot_titles=[
            f"{title_prefix} GC (%)",
            f"A: {stats['A'][0]:.2f}% ± {stats['A'][1]:.2f}",
            f"T: {stats['T'][0]:.2f}% ± {stats['T'][1]:.2f}",
            f"C: {stats['C'][0]:.2f}% ± {stats['C'][1]:.2f}",
            f"G: {stats['G'][0]:.2f}% ± {stats['G'][1]:.2f}"
        ]
    )

    base_colors = {
        "GC": "purple",
        "A": "green",
        "T": "red",
        "C": "blue",
        "G": "black"
    }

    fig.add_trace(go.Bar(
        x=np.arange(0, 100),
        y=stats["GC"][2].values / 1_000_000,
        name="GC",
        marker=dict(line=dict(width=0.5)),
        marker_color=base_colors["GC"]
    ), row=1, col=1)

    for i, base in enumerate(["A", "T", "C", "G"], start=2):
        fig.add_trace(go.Bar(
            x=np.arange(0, 100),
            y=stats[base][2].values / 1_000_000,
            name=base,
            marker_color=base_colors[base]
        ), row=i, col=1)

    fig.update_layout(
        height=800,
        title=dict(
            text=f"Reads GC Content - {title_prefix}",
            x=0.5,
            xanchor='center'
        ),
        showlegend=False
    )

    fig.update_yaxes(title_text="Count (millions)", row=1, col=1)
    return fig

def main():
    parser = argparse.ArgumentParser(description="Plot base content distributions from QC output.")
    parser.add_argument("--input1", required=True, help="Input base content file before trimming (e.g., qa.QC.base_content.txt)")
    parser.add_argument("--input2", required=True, help="Input base content file after trimming (e.g., QC.base_content.txt)")
    parser.add_argument("--out1", required=True, help="Output HTML for the first GC plot")
    parser.add_argument("--out2", required=True, help="Output HTML for the second GC plot")

    args = parser.parse_args()

    fig1 = read_gc_plot(args.input1, title_prefix="Input Reads")
    fig2 = read_gc_plot(args.input2, title_prefix="Trimmed Reads")

    fig1.write_html(args.out1)
    print(f"Saved: {args.out1}")

    fig2.write_html(args.out2)
    print(f"Saved: {args.out2}")

if __name__ == "__main__":
    main()