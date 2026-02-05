#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
This script reads quality histogram data from specified files, computes cumulative statistics, and generates a combined plot using Plotly.
It supports reading data for both untrimmed and trimmed reads, allowing for comparison of quality distributions before and after trimming.
"""
import pandas as pd
import numpy as np
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import argparse

def quality_histogram(qual_histogram_file, xlab, ylab="Reads Number (millions)"):
    df = pd.read_csv(qual_histogram_file, sep="\t", header=0)

    df['Cumulative'] = df['readsNum'].cumsum() / df['readsNum'].sum() * 100

    q_over_20_reads = df[df['Score'] >= 20]['readsNum'].sum()
    q_over_20_percent = f"{q_over_20_reads / df['readsNum'].sum() * 100:.2f}%"
    q_over_20_bases = df[df['Score'] >= 20]['readsBases'].sum()
    q_over_20_avg_len = f"{q_over_20_bases / q_over_20_reads:.2f}" if q_over_20_reads > 0 else "0"
    total_bases = df['readsBases'].sum()

    df_sorted = df.sort_values(by='Score', ascending=False)

    fig = make_subplots(specs=[[{"secondary_y": True}]])

    fig.add_trace(go.Bar(
        x=df_sorted['Score'],
        y=df_sorted['readsNum'] / 1_000_000,
        name='Reads Number (millions)',
        marker_color='gray'
    ), secondary_y=False)

    fig.add_trace(go.Scatter(
        x=df_sorted['Score'],
        y=df_sorted['Cumulative'],
        name='Cumulative %',
        mode='lines+markers',
        line=dict(color='blue', width=3)
    ), secondary_y=True)

    fig.update_layout(
        title=dict(text="Reads Average Quality Histogram", x=0.5),
        xaxis=dict(title=xlab, autorange="reversed", range=[df_sorted['Score'].min(), df_sorted['Score'].max()]),
        yaxis=dict(title=ylab),
        yaxis2=dict(
            title=dict(
                text="Cumulative Percentage",
                font=dict(color="blue")
            ),
            range=[0, 100],
            showgrid=False,
            tickfont=dict(color="blue")
        ),
        showlegend=False
    )

    annotation_text = f"Number of Q≥20 reads: {q_over_20_reads:,} ({q_over_20_percent}), Mean Length: {q_over_20_avg_len}"
    fig.add_annotation(
        text=annotation_text,
        x=0,
        y=1.08,
        xref="paper",
        yref="paper",
        showarrow=False,
        font=dict(size=10),
        align="left"
    )

    return fig, annotation_text, df_sorted['Score'].min(), df_sorted['Score'].max()

def combine_quality_histograms(fig1, fig2, qa_annotation, main_annotation, min1=None, max1=None, min2=None, max2=None):
    combined = make_subplots(
        rows=1, cols=2,
        specs=[[{"secondary_y": True}, {"secondary_y": True}]],
        subplot_titles=("Input Reads Avg Score", "Trimmed Reads Avg Score")
    )

    for trace in fig1.data:
        combined.add_trace(trace, row=1, col=1, secondary_y=("Cumulative" in trace.name))

    for trace in fig2.data:
        combined.add_trace(trace, row=1, col=2, secondary_y=("Cumulative" in trace.name))

    combined.update_layout(
        title=dict(text="Reads Average Quality Histogram", x=0.5),
        annotations=[
            dict(text=qa_annotation, x=max1/2, y=1.05, xref="x1", yref="paper", showarrow=False, font=dict(size=12)),
            dict(text=main_annotation, x=max2/2, y=1.05, xref="x2", yref="paper", showarrow=False, font=dict(size=12))
        ],
        showlegend=False
    )

    combined.update_xaxes(title_text="Input Reads Avg Score", row=1, col=1, autorange="reversed", autorangeoptions=dict(minallowed=min1, maxallowed=max1))
    combined.update_yaxes(title_text="Reads Number (millions)", row=1, col=1, secondary_y=False)
    combined.update_yaxes(title_text="Cumulative Percentage", row=1, col=1, title_font=dict(color="blue"), tickfont=dict(color="blue"),secondary_y=True)

    combined.update_xaxes(title_text="Trimmed Reads Avg Score", row=1, col=2, autorange="reversed", autorangeoptions=dict(minallowed=min2, maxallowed=max2))
    combined.update_yaxes(title_text="Reads Number (millions)", row=1, col=2, secondary_y=False)
    combined.update_yaxes(title_text="Cumulative Percentage", row=1, col=2, title_font=dict(color="blue"), tickfont=dict(color="blue"),secondary_y=True)

    return combined

def main():
    parser = argparse.ArgumentParser(description="Plot reads average quality histogram.")
    parser.add_argument("--input1", required=True, help="Input file for untrimmed reads (qa.QC.for_qual_histogram.txt)")
    parser.add_argument("--input2", required=True, help="Input file for trimmed reads (QC.for_qual_histogram.txt)")
    parser.add_argument("--output", required=True, help="Output HTML file for combined plot")

    args = parser.parse_args()

    fig1, qa_annotation, min1, max1 = quality_histogram(args.input1, "Input Reads Avg Score")
    fig2, main_annotation, min2, max2 = quality_histogram(args.input2, "Trimmed Reads Avg Score")

    combined = combine_quality_histograms(fig1, fig2, qa_annotation, main_annotation, min1, max1, min2, max2)

    combined.write_html(args.output)


if __name__ == "__main__":
    main()
