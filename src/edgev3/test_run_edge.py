import os
from pathlib import Path
import jinja2
import logging
import argparse

from run_edge import run_nextflow_pipeline, query_job_status


logging.basicConfig(filename='test_edge.log',level=logging.INFO)


def run_tests(projects_dir, project_name, nextflowOutDir, refdata_dir, opaver_web_dir, template_file, apptainer_cache_dir):
    blast_types = ['blastn','megablast','ig_blast','plasmid','blastx','rpstblastn']
    databases = ['nt','18S_fungal_sequences','synthetic_plasmids','18S_fungal_sequences','nr_cluster_seq', 'Cdd']
    platforms = ['Illumina','Nanopore','PacBio']
    input_files = ['/panfs/biopan03/bio-aimbots/dap-edge-v3/workflows/test_data/Illumina/Ecoli_10x-int.fastq.gz',
    '/panfs/biopan03/bio-aimbots/dap-edge-v3/workflows/test_data/Nanopore/ERR14113935.fastq.gz',
    '/panfs/biopan03/bio-aimbots/dap-edge-v3/workflows/test_data/PacBio/ERR13326525.fastq.gz']


    blast_db_list = []
    for blast_type,db in zip(blast_types, databases):
        blast_db_list.append({'blast_method': blast_type, 'database_name': db})

    for blast_db in blast_db_list:
        json_template_file = Path('conf_aimbots.json.tmpl')
        environment = jinja2.Environment()
        template = environment.from_string(json_template_file.read_text())
        rendered_config = template.render(blast_db)
        prefix = '_'.join(list(blast_db.values()))
        test_dir = Path(projects_dir, project_name, f"test_{prefix}")
        os.makedirs(test_dir, exist_ok=True)
        conf_json_file = Path(test_dir, f"conf_{prefix}.json")
        conf_json_file.write_text(rendered_config)
        for platform, input_file in zip(platforms, input_files):
            # logging.info(f"Running test for {platform} with input file {input_file} and config {conf_json_file}")
            project_code = run_nextflow_pipeline(
                test_dir, conf_json_file, project_name, nextflowOutDir, refdata_dir, opaver_web_dir, template_file, apptainer_cache_dir, paired=False, input_files=[input_file], platform=platform)
            logging.info(f"project_code: {project_code}, blast_type: {blast_db['blast_method']}, database_name: {blast_db['database_name']}, platform: {platform}, input_file: {input_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Nextflow config JSON files for different BLAST database types")
    parser.add_argument("--projects-dir", type=Path, required=True, help="Path to the directory containing all project output directories")
    parser.add_argument("--project-name", type=str, required=True, help="Project name chosen by user")
    parser.add_argument("--nextflow-out-dir", type=Path, required=True, help="Path to the directory where Nextflow will store intermediate files")
    parser.add_argument("--refdata-dir", type=Path, required=True, help="Path to the directory containing reference data")
    parser.add_argument("--opaver-web-dir", type=Path, required=True, help="Path to the directory containing OPAVER web files")
    parser.add_argument("--template-file", type=Path, required=True, help="Path to the Jinja2 template file for generating Nextflow config JSON files")
    parser.add_argument("--apptainer-cache-dir", type=Path, required=True, help="Path to the directory where Apptainer will store cached images")
    args = parser.parse_args()  
    projects_dir = args.projects_dir
    project_name = args.project_name
    nextflowOutDir = args.nextflow_out_dir
    refdata_dir = args.refdata_dir
    opaver_web_dir = args.opaver_web_dir
    template_file = args.template_file
    apptainer_cache_dir = args.apptainer_cache_dir
    run_tests(projects_dir, project_name, nextflowOutDir, refdata_dir, opaver_web_dir, template_file, apptainer_cache_dir)