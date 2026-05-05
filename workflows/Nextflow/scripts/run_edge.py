from subprocess import run
import argparse
from pathlib import Path
import os

from config_nextflow import render_nextflow_config

def run_nextflow_pipeline(projects_dir:Path, conf_json_file:Path, project_name:str, 
                          nextflowOutDir:Path, refdata_dir:Path, opaver_web_dir:Path, template_file: Path, 
                          paired=None, fastq_files=None) -> None:
    """
    Renders the Nextflow config file and runs the Nextflow pipeline.
    """
    project_code = render_nextflow_config(projects_dir, conf_json_file, project_name, nextflowOutDir,
                           refdata_dir, opaver_web_dir, template_file, paired, fastq_files)
    config_path = projects_dir / project_code / 'nextflow.config'
    call_nextflow_run(config_path)


def call_nextflow_run(config_path:Path) -> None:
    """
    Calls the Nextflow pipeline with the provided config file path.
    """
    root_dir = Path.cwd().parent.parent.parent
    main_nf_path = str(root_dir / 'workflows/Nextflow/metagenomics/nextflow/main.nf')
    run(["nextflow", "-C", str(config_path), "run", main_nf_path], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="run EDGE Nextflow pipeline")
    parser.add_argument("--project-name", type=str, help="Project name chosen by user")
    parser.add_argument("--fastq-file", type=str, help="Path to FASTQ file containing raw reads to be processed")
    parser.add_argument("--conf-json-file", type=Path, help="Path to config JSON file used to define pipeline parameters and modules to run")
    parser.add_argument("--paired", action="store_true", help="Indicates if the input files are paired-end")
    parser.add_argument("--fastq-files", type=str, help="Comma-separated list of paths to FASTQ files containing raw reads to be processed "
    "(if paired-end, provide pairs as R1_path,R2_path; separate multiple pairs with a comma)")
    parser.add_argument("--projects-dir", type=Path, help="Path to directory for storing all project output directories", default=os.environ.get('PROJECTS_DIR'))
    parser.add_argument("--nextflow-out-dir", type=Path, help="Path to output directory for Nextflow intermediate files", default=os.environ.get('NEXTFLOW_OUT_DIR'))
    parser.add_argument("--refdata-dir", type=Path, help="Path to reference data directory", default=os.environ.get('REFDATA_DIR'))
    parser.add_argument("--opaver-web-dir", type=Path, help="Path to OPAVER web directory", default=os.environ.get('OPAVER_WEB_DIR'))
    parser.add_argument("--template-file", type=Path, help="Path to template file used to render Nextflow config file", default=os.environ.get('TEMPLATE_FILE'))
    parser.add_argument("--nextflow-config-file", type=Path, help="Path to Nextflow config file (if not provided, it will be rendered from the template and config JSON file)")

    args = parser.parse_args()

    conf_json_file = args.conf_json_file
    projects_dir = args.projects_dir
    project_name = args.project_name
    nextflowOutDir = args.nextflow_out_dir
    refdata_dir = args.refdata_dir
    opaver_web_dir = args.opaver_web_dir
    template_file = args.template_file

    if args.nextflow_config_file:
        # If a Nextflow config file is provided, use it directly
        call_nextflow_run(args.nextflow_config_file)
    else:
        run_nextflow_pipeline(projects_dir, conf_json_file, project_name, nextflowOutDir,
                               refdata_dir, opaver_web_dir, template_file, 
                               paired=None if args.paired is None else args.paired, 
                               fastq_files=None if args.fastq_files is None else args.fastq_files.split(','))
