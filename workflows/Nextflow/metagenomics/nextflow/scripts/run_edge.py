#!/usr/bin/env python3
from subprocess import run
import argparse
from pathlib import Path
import os

from config_nextflow import render_nextflow_config
from nf_functions import start_job, status_check_job

def run_nextflow_pipeline(projects_dir:Path, conf_json_file:Path, project_name:str, 
                          nextflowOutDir:Path, refdata_dir:Path, opaver_web_dir:Path, template_file: Path, 
                          paired:bool=None, fastq_files:str=None, project_code:str=None) -> None:
    """
    Renders the Nextflow config file and runs the Nextflow pipeline.
    """
    if project_code is None:
        project_code = render_nextflow_config(projects_dir, conf_json_file, project_name, nextflowOutDir,
                           refdata_dir, opaver_web_dir, template_file, paired, fastq_files)
    
    root_dir = Path.cwd().parent.parent.parent.parent.parent
    main_nf_path = str(root_dir / 'workflows/Nextflow/metagenomics/nextflow/main.nf')
    start_job(job_name=project_code, project_path=main_nf_path, run_dir=projects_dir / project_code, temp_dir=nextflowOutDir / project_code)

def query_job_status(projects_dir:Path, project_code:str) -> str:
    """
    Queries the status of a Nextflow job by checking the existence of the `nextflow.log` file in the project directory.

    Parameters
    ----------
    projects_dir : Path
        Path to the directory containing all project output directories.
    project_code : str
        Project code for the Nextflow job, which corresponds to the name of the project output directory.

    Returns
    -------
    str
        Status of the Nextflow job, which can be "running", "completed", or "not found".
    """
    status = status_check_job(project_code, projects_dir)
    return status


def main():
    parser = argparse.ArgumentParser(description="run EDGE Nextflow pipeline")
    parser.add_argument("--project-name", type=str, help="Project name chosen by user")    
    parser.add_argument("--project-code", type=str, default=None, help="Project code for an existing Nextflow config file (if not provided, a new one will be rendered from the template and config JSON file)")
    parser.add_argument("--conf-json-file", type=Path, help="Path to config JSON file used to define pipeline parameters and modules to run")
    parser.add_argument("--paired", action="store_true", help="Indicates if the input files are paired-end")
    parser.add_argument("--fastq-files", type=str, help="Comma-separated list of paths to FASTQ files containing raw reads to be processed "
    "(if paired-end, provide pairs as R1_path,R2_path; separate multiple pairs with a comma)")
    parser.add_argument("--projects-dir", type=Path, help="Path to directory for storing all project output directories", default=os.environ.get('PROJECTS_DIR'))
    parser.add_argument("--nextflow-out-dir", type=Path, help="Path to output directory for Nextflow intermediate files", default=os.environ.get('NEXTFLOW_OUT_DIR'))
    parser.add_argument("--refdata-dir", type=Path, help="Path to reference data directory", default=os.environ.get('REFDATA_DIR'))
    parser.add_argument("--opaver-web-dir", type=Path, help="Path to OPAVER web directory", default=os.environ.get('OPAVER_WEB_DIR'))
    parser.add_argument("--template-file", type=Path, help="Path to template file used to render Nextflow config file", default=os.environ.get('TEMPLATE_FILE'))


    args = parser.parse_args()

    conf_json_file = args.conf_json_file
    projects_dir = args.projects_dir
    project_name = args.project_name
    nextflowOutDir = args.nextflow_out_dir
    refdata_dir = args.refdata_dir
    opaver_web_dir = args.opaver_web_dir
    template_file = args.template_file

    
    run_nextflow_pipeline(projects_dir, conf_json_file, project_name, nextflowOutDir,
                               refdata_dir, opaver_web_dir, template_file, 
                               paired=None if args.paired is None else args.paired, 
                               fastq_files=None if args.fastq_files is None else args.fastq_files.split(','), 
                               project_code=args.project_code)

if __name__ == "__main__":
       main()
