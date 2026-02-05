#!/usr/bin/env python3
import sys

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Phylogenetic Tree</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://unpkg.com/@phylocanvas/phylocanvas.gl@latest/dist/bundle.min.js"></script>
  <style>
    html, body {{
      height: 100%;
      margin: 0;
      padding: 0;
    }}
    #tree-container {{
      width: 100%;
      height: 80vh;
    }}
    .btn-group {{
      margin-top: 1em;
    }}
  </style>
</head>
<body>
  <div class="container-fluid mt-3">
    <h3></h3>

    <!-- Tab Navigation -->
    <ul class="nav nav-tabs" id="treeTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="radial-tab" data-bs-toggle="tab" data-bs-target="#tree-tab" type="button" role="tab">Radial</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="rectangular-tab" data-bs-toggle="tab" data-bs-target="#tree-tab" type="button" role="tab">Rectangular</button>
      </li>
    </ul>

    <!-- Control Buttons -->
    <div class="btn-group" role="group">
      <button class="btn btn-primary" id="zoom-in">Zoom In</button>
      <button class="btn btn-primary" id="zoom-out">Zoom Out</button>
      <button class="btn btn-secondary" id="reset-view">Reset</button>
      <button class="btn btn-success" id="export-svg">Export SVG</button>
      <button class="btn btn-success" id="export-png">Export PNG</button>
    </div>

    <!-- Tree Display Area -->
    <div class="tab-content mt-2">
      <div class="tab-pane fade show active" id="tree-tab" role="tabpanel">
        <div id="tree-container"></div>
      </div>
    </div>
  </div>

  <script>
    const newick = `{newick}`;
    let tree;

    document.addEventListener("DOMContentLoaded", () => {{
      // Create the tree once
      tree = new phylocanvas.PhylocanvasGL(
        document.getElementById("tree-container"),
        {{
          showLabels: true,
          showLeafLabels: true,
          type: phylocanvas.TreeTypes.Radial,
          interactive: true,
          source: newick,
        }},
        [phylocanvas.plugins.scalebar]
      );

      // Tree layout switching
      document.getElementById("radial-tab").addEventListener("click", () => {{
        tree.setTreeType(phylocanvas.TreeTypes.Radial);
      }});
      document.getElementById("rectangular-tab").addEventListener("click", () => {{
        tree.setTreeType(phylocanvas.TreeTypes.Rectangular);
      }});

      // Export buttons
      document.getElementById("export-svg").addEventListener("click", () => {{
        const svg = tree.exportSVG();
        const blob = new Blob([svg], {{ type: 'image/svg+xml' }});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tree.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }});

      document.getElementById("export-png").addEventListener("click", async () => {{
        const png = await tree.exportPNG();
        const link = document.createElement('a');
        link.href = png;
        link.download = 'tree.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }});
      let currentZoom = 0;

      document.getElementById("zoom-in").addEventListener("click", () => {{
        const maxZoom = tree.getMaxZoom();
        if (currentZoom < maxZoom) {{
          currentZoom += 0.1;
          tree.setProps({{ zoom: Math.min(currentZoom, maxZoom) }});
        }}
      }});

      document.getElementById("zoom-out").addEventListener("click", () => {{
        const minZoom = tree.getMinZoom();
        if (currentZoom > minZoom) {{
          currentZoom -= 0.1;
          tree.setProps({{ zoom: Math.max(currentZoom, minZoom) }});
        }}
      }});

      document.getElementById("reset-view").addEventListener("click", () => {{
        currentZoom = 0;
        tree.setProps({{ zoom: 0 }});
      }});
    }});
  </script>
</body>
</html>
"""

def main():
    if len(sys.argv) != 3:
        print("Usage: python phylocanvas_tree_with_controls.py <input_file.nwk> <output_file.html>")
        return

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file, 'r') as f:
        newick_data = f.read().strip().replace("`", "\\`").replace("\n", "")

    html_content = HTML_TEMPLATE.format(newick=newick_data)

    with open(output_file, 'w') as f:
        f.write(html_content)

    print(f"✅ Tree viewer with controls saved to: {output_file}")

if __name__ == "__main__":
    main()
                                                                        