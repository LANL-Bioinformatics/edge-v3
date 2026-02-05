#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import argparse

def length_histogram(input_file, xlab, ylab):
    df = pd.read_csv(input_file, sep="\t", header=None)
    length_list = df.iloc[:, 0].astype(int)
    length_count = df.iloc[:, 1].astype(int)
    
    # Stats
    len_avg = np.average(length_list, weights=length_count)
    len_std = np.sqrt(np.average((length_list - len_avg)**2, weights=length_count))
    len_max = length_list[length_count > 0].max()
    len_min = length_list[length_count > 0].min()
    total_reads = length_count.sum()

    # Bar chart
    bar = go.Bar(
        x=length_list,
        y=length_count / 1_000_000,  # Convert to millions
        name=f'{xlab}',
        text=[f"{c/1_000_000:.2f}M" for c in length_count],
        textposition='auto'
    )

    # Annotation text
    annotations = [
        f"Mean: {len_avg:.2f} ± {len_std:.2f}",
        f"Max: {len_max}",
        f"Min: {len_min}"
    ]
    return bar, annotations, total_reads

def combine_length_histogram(fig1, fig2, fig1_anno, fig2_anno):
    fig = make_subplots(rows=1, cols=2, subplot_titles=("Input Length", "Trimmed Length"))

    fig.add_trace(fig1, row=1, col=1)
    fig.add_trace(fig2, row=1, col=2)

    fig.update_layout(
        title=dict(
            text="Reads Length Histogram",
            x=0.5,
            xanchor='center'
        ),
        annotations=[
            dict(text="; ".join(fig1_anno), x=1, y=1, xref="x1", yref="paper", showarrow=False, align="left", font=dict(size=12)),
            dict(text="; ".join(fig2_anno), x=1, y=1, xref="x2", yref="paper", showarrow=False, align="left", font=dict(size=12))
        ],
        xaxis_title="Length",
        yaxis_title="Count (millions)",
        bargap=0.1
    )
    return fig

def main():
    parser = argparse.ArgumentParser(description="Generate read length histograms from QC data.")
    parser.add_argument("--input1", required=True, help="Input file for untrimmed read length histogram (TSV format)")
    parser.add_argument("--input2", required=True, help="Input file for trimmed read length histogram (TSV format)")
    parser.add_argument("--output", required=True, help="Output HTML file for the plot")

    args = parser.parse_args()

    qa_bar, qa_annot, qa_total = length_histogram(args.input1, "Input Length", "Count (millions)")
    main_bar, main_annot, main_total = length_histogram(args.input2, "Trimmed Length", "Count (millions)")

    fig = combine_length_histogram(qa_bar, main_bar, qa_annot, main_annot)
    fig.write_html(args.output)

if __name__ == "__main__":
    main()