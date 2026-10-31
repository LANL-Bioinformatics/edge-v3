import pytest
from unittest.mock import patch, mock_open, MagicMock
from pathlib import Path
from workflows.Nextflow.scripts.config_nextflow import render_nextflow_config

# Python


@pytest.fixture
def mock_paths(tmp_path):
    # Create fake paths for all required files
    utils_path = tmp_path / "util.js"
    conf_json_file = tmp_path / "conf.json"
    projects_dir = tmp_path / "projects"
    output_dir = tmp_path / "output"
    template_file = tmp_path / "template.j2"
    nextflowOutDir = tmp_path / "nextflow_out"
    refdata_dir = tmp_path / "refdata"
    opaver_web_dir = tmp_path / "opaver"
    project_name = "TestProject"
    project_code = "PRJ001"
    # Create files
    utils_path.write_text("""
const workflowList = {
    sra2fastq: {
        outdir: 'sra2fastq_out'
    },
};
const somethingElse = 1;

      let worflowParams = {
        sraOutdir: projectsDir + '/' + projectCode + '/sra2fastq_out',
        contigsOutdir: projectsDir + '/' + projectCode,
        reportOutdir: projectsDir + '/' + projectCode
      }
      // projectConf
""")
    conf_json_file.write_text("""
{
    "rawReads": {"inputFiles": ["file1.fastq", "file2.fastq"]},
    "pipeline": [
        {"name": "sra2fastq", "input": {"enabledTools": ["tool1", "tool2"]}},
        {"name": "taxonomy", "input": {"enabledTools": ["toolA", "toolB"]}}
    ]
}
""")
    template_file.write_text("project={{ project }}\nnextflowOutDir={{ nextflowOutDir }}")
    output_dir.mkdir(exist_ok=True)
    return {
        "utils_path": utils_path,
        "conf_json_file": conf_json_file,
        "projects_dir": projects_dir,
        "output_dir": output_dir,
        "template_file": template_file,
        "nextflowOutDir": nextflowOutDir,
        "refdata_dir": refdata_dir,
        "opaver_web_dir": opaver_web_dir,
        "project_name": project_name,
        "project_code": project_code,
    }

@patch("workflows.Nextflow.scripts.config_nextflow.jinja2.Environment")
def test_render_nextflow_config_writes_file_and_prints(mock_jinja_env, mock_paths, capsys):
    # Setup mock jinja2 template
    mock_template = MagicMock()
    mock_template.render.return_value = "RENDERED_CONFIG"
    mock_env = MagicMock()
    mock_env.from_string.return_value = mock_template
    mock_jinja_env.return_value = mock_env

    # Call function
    render_nextflow_config(
        utils_path=mock_paths["utils_path"],
        projects_dir=mock_paths["projects_dir"],
        conf_json_file=mock_paths["conf_json_file"],
        output_dir=mock_paths["output_dir"],
        project_name=mock_paths["project_name"],
        project_code=mock_paths["project_code"],
        nextflowOutDir=mock_paths["nextflowOutDir"],
        refdata_dir=mock_paths["refdata_dir"],
        opaver_web_dir=mock_paths["opaver_web_dir"],
        template_file=mock_paths["template_file"],
    )

    # Check output file
    output_path = mock_paths["output_dir"] / "nextflow.config"
    assert output_path.exists()
    assert output_path.read_text() == "RENDERED_CONFIG"

    # Check print output
    captured = capsys.readouterr()
    assert f"Nextflow config file created at: {output_path}" in captured.out