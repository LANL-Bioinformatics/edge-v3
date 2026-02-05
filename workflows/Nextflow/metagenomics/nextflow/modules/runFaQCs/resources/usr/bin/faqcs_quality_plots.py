#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import argparse
import os


def manual_quality_boxplot(matrix_file, total_reads, total_bases, xlab, ylab, xlab_adj=0):
    z = pd.read_csv(matrix_file, sep="\t", header=None).values
    x_pos = np.arange(1, z.shape[0] + 1)
    y_scores = np.arange(z.shape[1])

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=[1], y=[1], mode="markers", marker=dict(opacity=0)))
    for i in x_pos:
        counts = z[i-1]
        total = counts.sum()
        if total == 0:
            continue
        values = np.repeat(y_scores, counts)

        q1 = np.percentile(values, 25)
        
        med = np.percentile(values, 50)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        lower = max(values.min(), q1 - 1.5 * iqr)
        upper = min(values.max(), q3 + 1.5 * iqr)
        # Draw box (Q1 to Q3)
        fig.add_shape(
            type="rect",
            x0=i - 0.4,
            x1=i + 0.4,
            y0=q1,
            y1=q3,
            line=dict(color="black"),
            fillcolor="bisque"
        )

        # Draw whiskers
        fig.add_shape(type="line", x0=i, x1=i, y0=q3, y1=upper, line=dict(dash="dot"))
        fig.add_shape(type="line", x0=i, x1=i, y0=lower, y1=q1, line=dict(dash="dot"))
        fig.add_shape(type="line", x0=i - 0.4, x1=i + 0.4, y0=upper, y1=upper)
        fig.add_shape(type="line", x0=i - 0.4, x1=i + 0.4, y0=lower, y1=lower)

        # Draw median line
        fig.add_shape(type="line", x0=i - 0.4, x1=i + 0.4, y0=med, y1=med, line=dict(width=2))

    # Add horizontal reference line at Q20
    fig.add_shape(type="line", x0=0.5, x1=z.shape[0] + 0.5, y0=20, y1=20, line=dict(color='gray', dash='dash'))

    # Axis config and annotation
    anno= f"# Reads: {total_reads:,}<br># Bases: {total_bases:,}"
    fig.update_layout(
        title=dict(text="Quality Boxplot Per Cycle", x=0.5),
        xaxis=dict(
            title=xlab,
            tickmode="array",
            tickvals=x_pos,
            ticktext=x_pos + xlab_adj,
            range=[0, z.shape[0] + 1]
        ),
        yaxis=dict(title=ylab),
        showlegend=False,
        annotations=[
            dict(text=f"{anno}", x=15, y=1.15, xref="x1", yref="paper", showarrow=False, align="left", font=dict(size=12))
        ] 
    )

    return fig, anno

def quality_boxplot(matrix_file, total_reads, total_bases, xlab, ylab, xlab_adj=0):
    z = pd.read_csv(matrix_file, sep="\t", header=None).values
    x = np.arange(1, z.shape[0] + 1)
    y = np.arange(z.shape[1])

    boxes = []
    for i in range(z.shape[0]):
        total = z[i].sum()
        values = np.repeat(y, z[i])
        if total == 0:
            continue

        q1 = np.percentile(values, 25)
        median = np.percentile(values, 50)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        lower = max(values.min(), q1 - 1.5 * iqr)
        upper = min(values.max(), q3 + 1.5 * iqr)

        boxes.append(go.Box(
            y=values,
            name=str(i + xlab_adj),
            boxpoints=False,
            line=dict(color="black"),
            fillcolor="bisque",
            showlegend=False
        ))
    annotations_text= f"# Reads: {total_reads:,} <br># Bases: {total_bases:,}"
    layout = go.Layout(
        title=dict(text="Quality Boxplot Per Cycle", x=0.5),
        xaxis_title=xlab,
        yaxis_title=ylab,
        shapes=[dict(type='line', x0=-0.5, x1=z.shape[0]+0.5, y0=20, y1=20, line=dict(color='gray'))],
    )

    fig = go.Figure(data=boxes, layout=layout)
    return fig, annotations_text

def quality_3d_plot(matrix_file, xlab, ylab):
    z = pd.read_csv(matrix_file, sep="\t", header=None).values / 1_000_000
    x = np.arange(1, z.shape[0] + 1)
    y = np.arange(z.shape[1])
    X, Y = np.meshgrid(x, y)

    fig = go.Figure(data=[go.Surface(
        z=z.T,          # Transpose to align axis
        x=X,
        y=Y,
        surfacecolor=Y,  # Colorscale based on score
        cmin=y.min(),
        cmax=y.max(),
        colorscale='Viridis',
        colorbar=dict(title='Quality Score'),
        showscale=True
    )])

    fig.update_layout(
        title=dict(text=f"{xlab} Quality", x=0.5),
        scene=dict(
            xaxis_title='Position',
            yaxis_title=ylab,
            zaxis_title="Frequency (millions)"
        ),
        height=800
    )
    return fig

def quality_count_histogram(matrix_file, highest_score, xlab, ylab):
    z = pd.read_csv(matrix_file, sep="\t", header=None).values
    col = z.sum(axis=0)
    score_range = np.arange(col.shape[0])

    less30_num = len(score_range) - highest_score + 30 - 1
    color = ['blue'] * less30_num + ['darkgreen'] * (highest_score - 30 + 1)

    over30per = f"{col[30:].sum() / col.sum() * 100:.2f}%"
    avgQ = f"{np.dot(score_range, col) / col.sum():.2f}"

    fig = go.Figure(data=[
        go.Bar(x=score_range, y=col / 1_000_000, marker_color=color, showlegend=False)
    ])
    annotations = [
        f">=Q30",
        f"{over30per}",
        f"Average: {avgQ}"
    ]
    fig.update_layout(
        title=dict(text="Quality Report", x=0.5),
        xaxis_title=xlab,
        yaxis_title=ylab,

        shapes=[dict(type='line', x0=29.5, x1=29.5, y0=0, y1=max(col / 1_000_000), line=dict(color='darkgreen'))],
        
    )
    return fig, annotations

def combine_boxplots(fig1, fig2, fig1_annotation, fig2_annotation):
    combined = make_subplots(rows=1, cols=2)
    # Copy shapes from each individual figure into the subplot
    for shape in fig1['layout']['shapes']:
        shape['xref'] = 'x1'
        shape['yref'] = 'y1'
        combined.add_shape(shape, row=1, col=1)

    for shape in fig2['layout']['shapes']:
        shape['xref'] = 'x2'
        shape['yref'] = 'y2'
        combined.add_shape(shape, row=1, col=2)

    # Add invisible scatter traces to establish axes
    combined.add_trace(fig1['data'][0], row=1, col=1)
    combined.add_trace(fig2['data'][0], row=1, col=2)

    # Update axes and annotations manually
    combined.update_xaxes(title_text=fig1['layout']['xaxis']['title']['text'], row=1, col=1)
    combined.update_yaxes(title_text=fig1['layout']['yaxis']['title']['text'], row=1, col=1)

    combined.update_xaxes(title_text=fig2['layout']['xaxis']['title']['text'], row=1, col=2)
    combined.update_yaxes(title_text=fig2['layout']['yaxis']['title']['text'], row=1, col=2)

    combined.update_layout(
        title=dict(text="Quality Boxplot Per Cycle", x=0.5),
        annotations=[
            dict(text=f"{fig1_annotation}", x=15, y=1.12, xref="x1", yref="paper", showarrow=False, align="left", font=dict(size=12)),
            dict(text=f"{fig2_annotation}", x=15, y=1.12, xref="x2", yref="paper", showarrow=False, align="left", font=dict(size=12))
        ],
        showlegend=False
    )
    
    combined.update_xaxes(title_text="Input Reads Position", row=1, col=1)
    combined.update_yaxes(title_text="Quality Score", row=1, col=1)
    combined.update_xaxes(title_text="Trimmed Reads Position", row=1, col=2)
    
    return combined

def combine_quality_histograms(fig5, fig6, fig5_annotation, fig6_annotation):
    combined = make_subplots(rows=1, cols=2)
    
    for trace in fig5.data:
        combined.add_trace(trace, row=1, col=1)
    for trace in fig6.data:
        combined.add_trace(trace, row=1, col=2)

    combined.update_layout(
        title=dict(text="Quality Report - Score Distribution", x=0.5),
        annotations=[
            dict(text="<br>".join(fig5_annotation[0:2]), x=32, y=0.9, xref='x1', yref="paper", showarrow=False, align="left", font=dict(size=12)),
            dict(text="<br>".join(fig6_annotation[0:2]), x=32, y=0.9, xref="x2", yref="paper", showarrow=False, align="left", font=dict(size=12)),
            dict(text=f"{fig5_annotation[2]}", x=1, y=1.05, xref="x1", yref="paper", showarrow=False, align="left", font=dict(size=12)),
            dict(text=f"{fig6_annotation[2]}", x=1, y=1.05, xref="x2", yref="paper", showarrow=False, align="left", font=dict(size=12)),
        ],
        showlegend=False
    )
    
    combined.update_xaxes(title_text="Input Reads Q score", row=1, col=1)
    combined.update_yaxes(title_text="Total (millions)", row=1, col=1)
    combined.update_xaxes(title_text="Trimmed Reads Q score", row=1, col=2)

    return combined

def main():
    parser = argparse.ArgumentParser(description="Generate quality plots per cycle.")
    parser.add_argument("--qa_file", required=True, help="Path to qa.QC.quality.matrix")
    parser.add_argument("--trim_file", required=True, help="Path to QC.quality.matrix")
    parser.add_argument("--qa_reads", type=int, required=True, help="Total reads in qa input")
    parser.add_argument("--trim_reads", type=int, required=True, help="Total reads in trimmed input")
    parser.add_argument("--qa_bases", type=int, required=True, help="Total bases in qa input")
    parser.add_argument("--trim_bases", type=int, required=True, help="Total bases in trimmed input")
    parser.add_argument("--trim5", type=int, default=0, help="5' trimming adjustment (default: 0)")
    parser.add_argument("--maxScore", type=int, default=41, help="Maximum quality score to consider (default: 41)")
    parser.add_argument("--out_dir", default=".", help="Directory to save HTML plots")

    args = parser.parse_args()

    # Boxplots
    fig1, fig1_anno = manual_quality_boxplot(args.qa_file, args.qa_reads, args.qa_bases, "Input Reads Position", "Quality score", 0)
    fig2, fig2_anno = manual_quality_boxplot(args.trim_file, args.trim_reads, args.trim_bases, "Trimmed Reads Position", "Quality score", args.trim5)
    combined_box = combine_boxplots(fig1, fig2, fig1_anno, fig2_anno)
    boxplot_out = os.path.join(args.out_dir, "quality_boxplot.html")
    combined_box.write_html(boxplot_out)

    # 3D plots
    fig3 = quality_3d_plot(args.qa_file, "Input Reads", "Q Score")
    fig4 = quality_3d_plot(args.trim_file, "Trimmed Reads", "Q Score")
    fig3_out = os.path.join(args.out_dir, "quality_3D_input.html")
    fig4_out = os.path.join(args.out_dir, "quality_3D_trimmed.html")
    fig3.write_html(fig3_out)
    fig4.write_html(fig4_out)

    # Histograms
    fig5, fig5_anno = quality_count_histogram(args.qa_file, args.maxScore, "Input Reads Q score", "Total (million)")
    fig6, fig6_anno = quality_count_histogram(args.trim_file, args.maxScore, "Trimmed Reads Q score", "")
    combined_hist = combine_quality_histograms(fig5, fig6, fig5_anno, fig6_anno)
    hist_out = os.path.join(args.out_dir, "quality_score_histogram.html")
    combined_hist.write_html(hist_out)

if __name__ == "__main__":
    main()