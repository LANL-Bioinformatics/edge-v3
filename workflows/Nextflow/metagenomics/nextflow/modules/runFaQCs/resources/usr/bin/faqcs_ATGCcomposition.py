#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
This script reads base content data from a specified file, computes statistics for each base per cycle (A, T, C, G, and GC), and generates a multi-panel plot using Plotly.
It supports reading data before and after trimming, allowing for comparison of base content distributions.
"""
import pandas as pd
import numpy as np
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import argparse

def atcg_composition_plot(base_matrix_file, xlab, ylab, xlab_adj=0):
    df = pd.read_csv(base_matrix_file, sep="\t", header=None, names=["A", "T", "C", "G", "N"])

    row_sums = df[["A", "T", "C", "G", "N"]].sum(axis=1)
    a_per = df["A"] / row_sums * 100
    t_per = df["T"] / row_sums * 100
    c_per = df["C"] / row_sums * 100
    g_per = df["G"] / row_sums * 100
    n_base = df["N"]
    total_reads = max(row_sums)

    xpos = np.arange(1, len(df) + 1)
    labels = xpos + xlab_adj
    ymax = np.floor(max(a_per.max(), t_per.max(), c_per.max(), g_per.max())) + 5
    ymin = max(0, np.floor(min(a_per.min(), t_per.min(), c_per.min(), g_per.min())) - 5)

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=labels, y=a_per, mode='lines', name='A', line=dict(color='green')))
    fig.add_trace(go.Scatter(x=labels, y=t_per, mode='lines', name='T', line=dict(color='red')))
    fig.add_trace(go.Scatter(x=labels, y=c_per, mode='lines', name='C', line=dict(color='blue')))
    fig.add_trace(go.Scatter(x=labels, y=g_per, mode='lines', name='G', line=dict(color='black')))

    fig.update_layout(
        title=dict(text="Nucleotide Content Per Cycle", x=0.5),
        xaxis=dict(title=xlab),
        yaxis=dict(title=ylab, range=[ymin, ymax]),
        legend=dict(title="Base")
    )

    return fig, n_base, total_reads

def n_composition_plot(n_array, xlab, ylab, total_reads, xlab_adj=0):
    xpos = np.arange(1, len(n_array) + 1)
    labels = xpos + xlab_adj
    n_rate = n_array / total_reads * 1_000_000

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=labels, y=n_rate, mode='lines', name='N', line=dict(color='red')))
    fig.update_layout(
        title=dict(text="N Nucleotide Content Per Cycle", x=0.5),
        xaxis_title=xlab,
        yaxis_title=ylab,
        showlegend=False
    )
    fig.add_annotation(
        text=f"Total N bases: {int(n_array.sum())}",
        x=0.99,
        y=0.99,
        xref="paper",
        yref="paper",
        showarrow=False,
        font=dict(size=10),
        align="right"
    )
    return fig

def combine_atcg_plots(fig1, fig2):
    combined = make_subplots(rows=1, cols=2, subplot_titles=("Input Reads Position", "Trimmed Reads Position"))

    for trace in fig1.data:
        combined.add_trace(trace, row=1, col=1)
    for trace in fig2.data:
        trace.showlegend = False
        combined.add_trace(trace, row=1, col=2)

    combined.update_layout(
        title=dict(text="Nucleotide Content Per Cycle", x=0.5),
        showlegend=True,
    )
    combined.update_xaxes(title_text="Cycle", row=1, col=1)
    combined.update_yaxes(title_text="Base content (%)", row=1, col=1)
    combined.update_xaxes(title_text="Cycle", row=1, col=2)

    return combined

def combine_n_plots(fig3, fig4):
    combined = make_subplots(rows=1, cols=2, subplot_titles=("Input Reads Position", "Trimmed Reads Position"))

    for trace in fig3.data:
        combined.add_trace(trace, row=1, col=1)
    for trace in fig4.data:
        combined.add_trace(trace, row=1, col=2)

    combined.update_layout(
        title=dict(text="N Nucleotide Content Per Cycle", x=0.5),
        showlegend=False,
    )
    combined.update_xaxes(title_text="Cycle", row=1, col=1)
    combined.update_yaxes(title_text="N Base count per million reads", row=1, col=1)
    combined.update_xaxes(title_text="Cycle", row=1, col=2)

    return combined

def main():
    parser = argparse.ArgumentParser(description="Plot base composition across cycles.")
    parser.add_argument("--input1", required=True, help="Base matrix file for input reads (e.g., qa.QC.base.matrix)")
    parser.add_argument("--input2", required=True, help="Base matrix file for trimmed reads (e.g., QC.base.matrix)")
    parser.add_argument("--out_atcg", required=True, help="Output HTML for combined ATCG composition")
    parser.add_argument("--out_n", required=True, help="Output HTML for combined N base plot")
    parser.add_argument("--trim5", type=int, default=0, help="Trim adjustment for 5' trimming (default: 0)")

    args = parser.parse_args()

    # Step 1: ATCG composition plots
    fig1, qa_n_base, qa_total_reads = atcg_composition_plot(args.input1, "Input Reads Base", "Base content (%)", 0)
    fig2, n_base, total_reads = atcg_composition_plot(args.input2, "Trimmed Reads Base", "", args.trim5)

    combined_atcg = combine_atcg_plots(fig1, fig2)

    combined_atcg.write_html(args.out_atcg)
    
    # Step 2: N base plots (if N present)
    if qa_n_base.sum() > 0:
        fig3 = n_composition_plot(qa_n_base, "Input Reads Position", "N Base count per million reads", qa_total_reads, 0)
        fig4 = n_composition_plot(n_base, "Trimmed Reads Position", "", qa_total_reads, args.trim5)

        combined_n = combine_n_plots(fig3, fig4)

        combined_n.write_html(args.out_n)
        print(f"[✓] N base plot saved to {args.out_n}")

if __name__ == "__main__":
    main()