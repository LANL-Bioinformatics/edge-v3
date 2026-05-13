from typing import Any, LiteralString
import pytest
import tempfile
import shutil
import os
import json
from pathlib import Path
from unittest.mock import MagicMock, patch
import config_nextflow
import importlib

@pytest.fixture
def tmp_project_dir(tmp_path: Path):
    d = tmp_path / "projects"
    d.mkdir()
    return d

@pytest.fixture
def utils_js_content():
    # Minimal mockup of utils.js for regex parsing
    return """
const workflowList = {
    runFaQCs: {
    outdir: 'output/ReadsQC',
    },
    taxonomy: {
        outdir: 'output/Taxonomy',
    },
}
const somethingElse = 1;
if (projectConf.pipeline) {
      let worflowParams = {
        runFaQCs: false,
        taxonomy: false,
        qcOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.runFaQCs.outdir)}`,
        taxonomyOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.taxonomy.outdir)}`,
        
      }
      projectConf.pipeline.forEach(workflow => {
        worflowParams[workflow.name] = true
        worflowParams = { ...worflowParams, ...workflow.input }
      })
      params = { ...params, ...worflowParams }
    }
  }
"""

@pytest.fixture
def utils_js_file(tmp_path: Path, utils_js_content: LiteralString):
    f = tmp_path / "utils.js"
    f.write_text(utils_js_content)
    return f

@pytest.fixture
def conf_json(tmp_path: Path):
    conf = {
        "rawReads": {"inputFiles": ["file1.fastq", "file2.fastq"], 'paired': False},
        "pipeline": [
            {"name": "runFaQCs", "input": {}},
            {"name": "taxonomy", "input": {"enabledTools": ["tool1", "tool2"]}},
        ]
    }
    f = tmp_path / "conf.json"
    f.write_text(json.dumps(conf))
    return f

@pytest.fixture
def template_file(tmp_path: Path):
    f = tmp_path / "template.txt"
    f.write_text("{{ project }} {{ sraOutdir }} {{ taxonomyOutdir }}")
    return f

def test_get_workflow_list(utils_js_content: Any):
    result = config_nextflow.get_workflow_list(utils_js_content)
    assert "runFaQCs" in result[0]
    assert "taxonomy" in result[1]
    assert "ReadsQC" in result[0][1]
    assert "Taxonomy" in result[1][1]

def test_create_workflow_output_dict(utils_js_file: Any, tmp_project_dir: Any):
    project_code = "test"
    workflow_list = [("runFaQCs", "        outdir: 'output/ReadsQC',\n    "), ("taxonomy", "        outdir: 'output/Taxonomy',\n    ")]
    result = config_nextflow.create_workflow_output_paths_dict(workflow_list, tmp_project_dir, project_code)
    assert "runFaQCs" in result.keys()
    assert "taxonomy" in result.keys()
    assert result["runFaQCs"].endswith("output/ReadsQC")
    assert result["taxonomy"].endswith("output/Taxonomy")

def test_create_workflow_params_dict(utils_js_file: Any):
    result = config_nextflow.create_workflow_params_dict(utils_js_file.read_text())
    assert result["runFaQCs"] == "qcOutdir"
    assert result["taxonomy"] == "taxonomyOutdir"
    assert result["contigs"] == "contigsOutdir"
    assert result["report"] == "reportOutdir"

def test_create_output_directory_dict(utils_js_file: Any, tmp_project_dir: Any):
    os.chdir('/Users/mflynn/Devel/edge-v3/workflows/Nextflow/scripts')
    project_code = "test"
    result = config_nextflow.create_output_directory_dict(
        tmp_project_dir, project_code
    )
    assert "sraOutdir" in result.keys()
    assert "taxonomyOutdir" in result.keys()
    assert "contigsOutdir" in result.keys()
    assert "reportOutdir" in result.keys()  
    assert result["sraOutdir"].endswith("sra2fastq")
    assert result["taxonomyOutdir"].endswith("Taxonomy")

def test_create_workflow_output_paths_dict(utils_js_content: Any):
    workflow_list = config_nextflow.get_workflow_list(utils_js_content)
    workflow_output_dict = config_nextflow.create_workflow_output_paths_dict(workflow_list, Path("/projects/test"), "test")
    assert workflow_output_dict["runFaQCs"].endswith("output/ReadsQC")
    assert workflow_output_dict["taxonomy"].endswith("output/Taxonomy") 

def test_get_module_run_input_dict():
    conf_dict = {
        "pipeline": [
            {"name": "sra2fastq"},
            {"name": "taxonomy"},
        ]
    }
    result = config_nextflow.get_module_run_input_dict(conf_dict)
    assert result == {"sra2fastq": True, "taxonomy": True}

def test_create_render_dict(tmp_path: Path):
    conf_dict = {
        "rawReads": {"inputFiles": ["f1", "f2"], "paired": False},
        "pipeline": [
            {"name": "taxonomy", "input": {"enabledTools": ["kraken", "kaiju"]}},
        ],
       
    }
    output_template_dict = {"sraOutdir": "out1"}
    module_run_input_dict = {"taxonomy": True}
    nextflowOutDir = tmp_path / "nfout" 
    refdata_dir = tmp_path / "ref"
    opaver_web_dir = tmp_path / "opaver"
    project_name = "proj"
    render_dict = config_nextflow.create_render_dict(
        conf_dict, output_template_dict, module_run_input_dict,
        nextflowOutDir, refdata_dir, opaver_web_dir, project_name, 'abc_123', 'Illumina'
    )
    assert render_dict["inputFastq"] == ["f1", "f2"]
    assert render_dict["refdata"] == refdata_dir
    assert render_dict["project"] == "proj"
    assert render_dict["seqPlatform"] == "Illumina"
    assert render_dict["keggViewerDir"] == opaver_web_dir
    assert render_dict["sraOutdir"] == "out1"
    assert render_dict["taxonomy"] == "true"
    assert render_dict["nextflowOutDir"] == nextflowOutDir / "abc_123"
    assert render_dict["enabledTools"] == "kraken,kaiju"

@patch("config_nextflow.random.choices")
@patch("config_nextflow.get_sequencing_platform")
def test_render_nextflow_config(mock_get_sequencing_platform, mock_random_choices, tmp_path: Path, utils_js_file: Any, conf_json: Any, template_file: Any):
    mock_random_choices.return_value = "AWLSpqke"
    mock_get_sequencing_platform.return_value = ("fastq", "Illumina")
    os.chdir('/Users/mflynn/Devel/edge-v3/workflows/Nextflow/scripts') 
    output_dir = tmp_path
    output_dir.mkdir(parents=True, exist_ok=True)
    projects_dir = tmp_path / "projects"
    projects_dir.mkdir()
    nextflowOutDir = tmp_path / "nfout"
    nextflowOutDir.mkdir()
    refdata_dir = tmp_path / "ref"
    refdata_dir.mkdir()
    opaver_web_dir = tmp_path / "opaver"
    opaver_web_dir.mkdir()
    project_name = "MyProject"
    project_code = "file1_AWLSpqke"
    nextflow_config_path = projects_dir / project_code / "nextflow.config"
    config_nextflow.render_nextflow_config(
        projects_dir, conf_json, project_name, nextflowOutDir, refdata_dir,
        opaver_web_dir, template_file
    )
    
    assert nextflow_config_path.exists()
    content = nextflow_config_path.read_text()
    assert "MyProject" in content
    assert "sra2fastq" in content or "Taxonomy" in content

@patch("config_nextflow.detect_platform")
def test_get_sequencing_platform(mock_get_sequencing_platform):
    mock_get_sequencing_platform.return_value = {"platform":"Illumina", "file_format": 'fastq'}
    conf_dict = {
        "inputFastq": ["f1", "f2"]
    }

    result = config_nextflow.get_sequencing_platform(conf_dict)
    assert result == ('fastq', "Illumina")

@patch("config_nextflow.detect_platform")
def test_get_sequencing_platform_diff_platforms(mock_get_sequencing_platform):
    mock_get_sequencing_platform.side_effect = [
        {"platform": "Illumina", "file_format": 'fastq'},
        {"platform": "Oxford Nanopore", "file_format": 'fastq'},
        {"platform": "Illumina", "file_format": 'fastq'},
        {"platform": "Oxford Nanopore", "file_format": 'fastq'}
    ]
    conf_dict = ["f1", "f2"]
   

    with pytest.raises(SystemExit) as excinfo:
        result = config_nextflow.get_sequencing_platform(conf_dict)
    assert excinfo.value.code == 'Not all of the input files are from the same sequencing platform or same file format. Please check the input files and try again.'
    
    mock_get_sequencing_platform.side_effect = [
        {"platform": "Unknown", "file_format": 'fasta'},
        {"platform": "Unknown", "file_format": 'fasta'},
    ]
    conf_dict = {
        "inputFastq": ["f1"]
    }
    
    file_format, platform = config_nextflow.get_sequencing_platform(conf_dict)

    assert file_format == 'fasta'
    assert platform == 'Unknown'

def test_get_input_fastq_files():
    conf_dict_single = {
        "rawReads": {"inputFiles": ["f1.fastq", "f2.fastq"], "paired": False}
    }
    conf_dict_paired = {
        "rawReads": {'source': 'fastq',
        'seqPlatform': 'Illumina',
        'paired': True,
        'inputFiles': [{'R1': 'Ecoli_10x.1.fastq',
                        'R2': 'Ecoli_10x.2.fastq'},
                       {'R1': '8YujqDBVLeq2z5xu.fastq.gz',
                        'R2': 'RgAJnxxwC7axTBx2.fastq.gz'}]
        }
    }
    result_single = config_nextflow.get_input_fastq_files(conf_dict_single)
    result_paired = config_nextflow.get_input_fastq_files(conf_dict_paired)
    assert result_single == {"inputFastq": ["f1.fastq", "f2.fastq"]}
    assert result_paired == {"inputFastq": ["Ecoli_10x.1.fastq", "8YujqDBVLeq2z5xu.fastq.gz"],
                             "inputFastq2": ["Ecoli_10x.2.fastq", "RgAJnxxwC7axTBx2.fastq.gz"]}
    
def test_set_fastq_files():
    conf_dict = {
        "rawReads": {"inputFiles": ["f1.fastq", "f2.fastq"], "paired": False}
    }
    result = config_nextflow.set_fastq_files(conf_dict, input_files=["f1.fastq", "f2.fastq"], paired=False)
    assert result['rawReads']['inputFiles'] == ["f1.fastq", "f2.fastq"]

    conf_dict = config_nextflow.set_fastq_files(conf_dict, input_files=["f1.fastq", "f2.fastq"], paired=True)
    assert conf_dict['rawReads']['inputFiles'] == [{'R1': 'f1.fastq', 'R2': 'f2.fastq'}]

def test_set_long_reads_options():
    conf_dict = {
        'category': 'metagenomics',
        'workflow': {'name': 'metagenomics'},
        'rawReads': {'source': 'fastq',
                     'seqPlatform': 'Illumina',
                     'paired': False,
                     'inputFiles': ['/home/user/edge-v3/io/upload/files/8YujqDBVLeq2z5xu.fastq.gz']
                     },
        'pipeline': [{'name': 'runFaQCs', 'input': {}},
                     {'name': 'taxonomy', 'input': {'enabledTools': ['kraken', 'kaiju']}},
                     {'name': 'assembly', 'input': {'assembler': 'IDBA_UD',
                                                    'minContigSize': 200,
                                                    'aligner': 'bwa',
                                                    'aligner_options': None,
                                                    'extractUnmapped': False,
                                                    'idba_minK': 31,
                                                    'idba_maxK': 121,
                                                    'idba_step': 20}
                                                    }
                                                    ]
                                                    }
    result = config_nextflow.set_long_reads_options(conf_dict)

    assembler = [p for p in result['pipeline'] if p['name'] == 'assembly'][0]
    faqcs = [p for p in result['pipeline'] if p['name'] == 'runFaQCs'][0]
    assert assembler['input']['assembler'] == 'LRASM'
    assert faqcs['input']['trimQual'] == 7

@patch("config_nextflow.random.choices")
def test_get_sample_name(mock_random_choices):
    mock_random_choices.return_value = "AWLSpqke"
    input_files = ["Ecoli_10x.1.fastq", "8YujqDBVLeq2z5xu.fastq.gz", "Ecoli_10x.2.fastq.gz"]
    result = config_nextflow.get_sample_name(Path(input_files[0]), paired=True)
    assert result == "Ecoli_10x_AWLSpqke"

    result = config_nextflow.get_sample_name(Path(input_files[1]), paired=True)
    assert result == "8YujqDBVLeq2z5xu_AWLSpqke"

    result = config_nextflow.get_sample_name(Path(input_files[2]), paired=True)
    assert result == "Ecoli_10x_AWLSpqke"

@patch("config_nextflow.render_nextflow_config")
def DO_NOT_test_main(tmp_path: Path):
    projects_dir = tmp_path / "projects"
    projects_dir.mkdir()
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    nextflowOutDir = tmp_path / "nfout"
    nextflowOutDir.mkdir()
    refdata_dir = tmp_path / "ref"
    refdata_dir.mkdir()
    opaver_web_dir = tmp_path / "opaver"
    opaver_web_dir.mkdir()
    args = [
        "--conf-json-file", str(conf_json),
        "--projects-dir", str(projects_dir),
        "--project-code", "test",
        "--project-name", "MyProject",
        "--nextflow-out-dir", str(nextflowOutDir),
        "--refdata-dir", str(refdata_dir),
        "--opaver-web-dir", str(opaver_web_dir),
        "--template-file", str(template_file)
    ]
    monkeypatch.setattr("sys.argv", ["prog"] + args)
    with patch("builtins.print") as mock_print:
        importlib.reload(config_nextflow)
        mock_print.assert_called_with("Nextflow config file rendered and saved to: {}".format(projects_dir / "test" / "nextflow.config"))
def DO_NOT_test_main_invocation(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, utils_js_file: Any, conf_json: Any, template_file: Any):
    projects_dir = tmp_path / "projects"
    projects_dir.mkdir()
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    nextflowOutDir = tmp_path / "nfout"
    nextflowOutDir.mkdir()
    refdata_dir = tmp_path / "ref"
    refdata_dir.mkdir()
    opaver_web_dir = tmp_path / "opaver"
    opaver_web_dir.mkdir()
    args = [
        "--conf-json-file", str(conf_json),
        "--projects-dir", str(projects_dir),
        "--project-code", "test",
        "--project-name", "MyProject",
        "--nextflow-out-dir", str(nextflowOutDir),
        "--refdata-dir", str(refdata_dir),
        "--opaver-web-dir", str(opaver_web_dir),
        "--template-file", str(template_file)
    ]
    monkeypatch.setattr("sys.argv", ["prog"] + args)
    with patch("builtins.print") as mock_print:
        with patch("config_nextflow.render_nextflow_config") as mock_render:
            importlib.reload(config_nextflow)
            mock_render.assert_called_once()