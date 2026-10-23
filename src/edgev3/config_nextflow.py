import os
import sys
from pathlib import Path
import json
import jinja2
import pprint
import re
import argparse
import random
import string
from itertools import batched
import logging

import tomli

from src.edgev3.detect_fastx_platform import detect_platform

logging.basicConfig(filename='edgev3.log', format='%(asctime)s.%(msecs)03d %(levelname)s {%(module)s} [%(funcName)s] %(message)s',
                    datefmt='%Y-%m-%d,%H:%M:%S', level=logging.DEBUG)


def parse_args(args):
    parser = argparse.ArgumentParser(description="Create Nextflow config file for EDGEv3 Nextflow pipeline based on user input and config TOML file")
    parser.add_argument("--project-name", type=str, help="Project name chosen by user", default=None)
    parser.add_argument("--pipeline-options-file", type=Path, help="Path to config TOML file used to define pipeline parameters and modules to run")
    parser.add_argument("--paired", action="store_true", help="Indicates if the input files are paired-end")
    parser.add_argument("--input-files", type=str, help="Comma-separated list of paths to FASTQ or FASTA files "
    "(if paired-end, provide pairs as R1_path,R2_path; separate multiple pairs with a comma)")
    parser.add_argument('--sra-accessions', type=str, default=None, help='SRA Accession numbers')
    parser.add_argument('--platform', type=str, default=None, help='Explitly specify sequencing platform (e.g. illumina, nanopore, pacbio) instead of relying on detect_platform function to determine platform from input files')
    parser.add_argument("--projects-dir", type=Path, help="Path to directory for storing all project output directories", default=os.environ.get('PROJECTS_DIR'))
    parser.add_argument("--nextflow-out-dir", type=Path, help="Path to output directory for Nextflow intermediate files", default=os.environ.get('NEXTFLOW_OUT_DIR'))
    parser.add_argument("--refdata-dir", type=Path, help="Path to reference data directory", default=os.environ.get('REFDATA_DIR'))
    parser.add_argument("--opaver-web-dir", type=Path, help="Path to OPAVER web directory", default=os.environ.get('OPAVER_WEB_DIR'))
    parser.add_argument("--template-file", type=Path, help="Path to template file used to render Nextflow config file", default=os.environ.get('TEMPLATE_FILE'))
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    parser.add_argument("--apptainer-cache-dir", type=Path, help="Path to directory for storing Apptainer cache files", default=os.environ.get('APPTAINER_CACHEDIR'))
    return parser.parse_args(args)


def main():
    args = parse_args(sys.argv[1:])

    conf_tomli_file = args.pipeline_options_file
    projects_dir = args.projects_dir
    project_name = args.project_name
    nextflowOutDir = args.nextflow_out_dir
    refdata_dir = args.refdata_dir
    opaver_web_dir = args.opaver_web_dir
    template_file = args.template_file

    if args.input_files and args.sra_accessions:
        logging.info(f"Input FASTQ files provided: {args.input_files}")
        sys.exit("Cannot provide both FASTQ files and SRA accessions as input. Please choose one input type and try again.")

    if not(args.input_files or args.sra_accessions):
        logging.info("No input files provided.")
        sys.exit("No input files provided. Please provide either FASTQ files or SRA accessions as input and try again.")

    if args.sra_accessions and not args.platform:
        logging.info(f"Input SRA accessions provided: {args.sra_accessions}")
        sys.exit("When providing SRA accessions as input, the sequencing platform must also be specified using the --platform argument. Please provide the platform and try again.")

    render_nextflow_config(projects_dir, conf_tomli_file, project_name, 
                           nextflowOutDir, refdata_dir, 
                           opaver_web_dir, template_file, apptainer_cache_dir=args.apptainer_cache_dir,
                           paired=None if args.paired is None else args.paired, 
                           input_files=None if args.input_files is None else args.input_files.split(','),
                           sra_accessions=None if args.sra_accessions is None else args.sra_accessions.split(','),
                           platform=args.platform
                           )
    logging.info("Nextflow config file created successfully.")


def render_nextflow_config(projects_dir:Path, conf_tomli_file:Path, 
                           project_name:str, nextflowOutDir:Path, 
                           refdata_dir:Path, opaver_web_dir:Path, template_file: Path, apptainer_cache_dir: Path,
                           paired: bool, input_files=None, 
                           sra_accessions=None, platform=None) -> str:
    """
    Renders the Nextflow configuration file. 
    Uses the utils.js and conf.json files to create a dictionary with the necessary parameters and output 
    directories for the Nextflow config template. Then renders the template and writes the Nextflow 
    config file to the project directory.
    First, checks the format of the input files using the detect_platform function. 
    If the input files are in fastq format, adds them to the conf_dict for rendering the template. 
    """
    conf_dict = tomli.loads(conf_tomli_file.read_text(encoding="utf-8"))
    logging.debug(f"fastq_files input: {input_files}, paired input: {paired}")
    logging.debug(f"pipelines: {[p['name'] for p in conf_dict['pipeline']]}")
    if sra_accessions:
        conf_dict = set_sra_options(conf_dict, sra_accessions)
        project_code = get_sample_name(Path(sra_accessions[0]))
    else:
        project_code = get_sample_name(Path(input_files[0]))
        file_format, platform = get_sequencing_platform(input_files)
        if file_format in ['fasta', 'fa']:
            logging.info("Input files are in fasta format. Only the aimbots modules will be run.")
            conf_dict = set_fasta_files(conf_dict, input_files)
        elif file_format == 'fastq':
            conf_dict = set_fastq_files(conf_dict, input_files, paired)            

    logging.debug(f"Configuration dictionary for rendering template: {pprint.pformat(conf_dict['rawReads'])}")
    output_template_dict = create_output_directory_dict(projects_dir, project_code, file_format)
    if platform in ["Nanopore", "PacBio"]:
        logging.info(f"Input files are from long-read sequencing platform: {platform}. Setting long-read options for assembly and runFaQCs modules.")
        conf_dict = set_long_reads_options(conf_dict)
    logging.debug(f"Configuration dictionary for rendering template after setting long-read options: {pprint.pformat(conf_dict['pipeline'])}")  
    # create dict for input to modules template
    module_run_input_dict = get_module_run_input_dict(conf_dict, file_format)

    render_dict = create_render_dict(conf_dict, output_template_dict, module_run_input_dict, 
                                     nextflowOutDir, refdata_dir, opaver_web_dir, apptainer_cache_dir, 
                                     project_name, project_code, platform, file_format, sra_accessions)
    # Render nextflow config template with output directories
    environment = jinja2.Environment()
    template = environment.from_string(template_file.read_text())
    rendered_config = template.render(render_dict)
    path = projects_dir / project_code
    path.mkdir(parents=True, exist_ok=True)
    config_path = path / 'nextflow.config'
    config_path.write_text(rendered_config)

    logging.info(f"Nextflow config file created at: {config_path}")
    return project_code


def set_sra_options(conf_dict:dict, sra_accessions:list) -> dict:
    conf_dict['rawReads'] = {'source': 'sra', 'accessions': sra_accessions, 'inputFiles': []}
    return conf_dict


def get_sample_name(sample: Path) -> str:
    """Returns the sample name from the input file path, removing any extensions and adding a random string to ensure uniqueness."""
    num_iter = min(3, len(re.findall(r'\.', str(sample))))
    for idx in range(num_iter):
        sample = Path(Path(sample).stem)
    return str(sample) + '_' + ''.join(random.choices(string.ascii_letters + string.digits, k=8))


def get_sequencing_platform(input_files) -> tuple:
    """
    Detects the sequencing platform from the input files using the detect_platform function.
    Exit if the input files are not all from the same platform or if the file format is not supported (not fastq or fasta).
    """
    file_formats = list(set([detect_platform(f)['file_format'] for f in input_files]))
    platforms = list(set([detect_platform(f)['platform'] for f in input_files]))
    logging.debug(f"Detected file formats: {file_formats}, detected platforms: {platforms}")
    if len(set(file_formats)) != 1 or len(set(platforms)) != 1:
        sys.exit('Not all of the input files are from the same sequencing platform or same file format. Please check the input files and try again.')
    if file_formats[0] not in ['fastq', 'fasta', 'fa']:
        sys.exit(f'Unsupported file format ({file_formats[0]}). Please provide input files in fastq or fasta format.')
    return list(set(file_formats))[0], list(set(platforms))[0]



def set_fastq_files(conf_dict:dict, input_files:list, paired:bool) -> dict:
    """
    Sets the input fastq files in the conf_dict for rendering the template. 
    If paired is True, expects input_files to be a list of paths in the format R1_path,R2_path 
    and converts to list of dicts with keys 'R1' and 'R2' for rendering the template.
    """
    conf_dict['rawReads'] = {}
    conf_dict['rawReads']['inputFiles'] = []
    conf_dict['rawReads']['paired'] = paired
    if not paired:
        conf_dict['rawReads']['inputFiles'] = input_files
    else:
        paired_fq = []
        for pair in batched(input_files, 2):
            paired_fq.append({'R1': pair[0], 'R2': pair[1]})
        conf_dict['rawReads']['inputFiles'] = paired_fq
    return conf_dict

def set_fasta_files(conf_dict:dict, input_files:list) -> dict:
    """
    Sets the input fasta files in the conf_dict for rendering the template. 
    """
    conf_dict['rawReads'] = {}
    conf_dict['rawReads']['inputFiles'] = []
    conf_dict['rawReads']['inputContigs'] = input_files[0]
    logging.debug(f"Configuration dictionary for rendering template: {pprint.pformat(conf_dict['rawReads'])}")
    return conf_dict

def create_output_directory_dict(projects_dir:Path, project_code:str, file_format:str) -> dict:
    """Create dict with output directories for pipeline_params template 
    {'contigsOutdir': '/path/to/projects_dir/project_code/',
    'reportOutdir': '/path/to/projects_dir/project_code/',
    'qcOutdir': '/path/to/projects_dir/project_code/output/ReadsQC/',
     etc.}
    """
    root_dir = get_project_root()
    utils_path = root_dir / 'webapp/server/workflow/util.js'
    # utils_path = Path('edge-v3/webapp/server/workflow/util.js')
    utils_js = utils_path.read_text()
    
    workflow_list = get_workflow_list(utils_js)

    workflow_output_dict = create_workflow_output_paths_dict(workflow_list, projects_dir, project_code)

    workflow_params_dict = create_workflow_params_dict(utils_js)
    # create dictionary with Jinja2 fields for workflows and the paths to the workflow outputs
    output_template_dict = {}
    for k,v in workflow_params_dict.items():
        output_template_dict.update({v: workflow_output_dict[k]})
    return output_template_dict


def get_project_root():
    return next(p for p in Path(__file__).resolve().parents if (p / '.github').exists())



def get_workflow_list(utils_js:str):
    """
    Get list of all workflows that could be run
    """
    wl_pattern = re.compile(r"const workflowList = {(.*?)}\n.*?const",re.M|re.S)
    workflows = wl_pattern.findall(utils_js)[0]
    ind_wf_pattern = re.compile(r"\s+(\w+): {\n(.*?)},\n",re.M|re.S)
    workflow_list = ind_wf_pattern.findall(workflows)
    return workflow_list


def create_workflow_output_paths_dict(workflow_list, projects_dir, project_code):
    """
    Create dictionary of workflows and paths to workflow output paths
    """
    workflow_output_dict = {}
    for workflow in workflow_list:
        field_list = workflow[1].split('\n')[:-1]
        field_list = [f.strip().strip(',') for f in field_list]
        workflow_output_dict.update({workflow[0]: str(projects_dir / project_code / field_list[0].split(':')[1].strip().strip("'"))})
    
    workflow_output_dict.update({'contigs':str(projects_dir / project_code), 'report': str(projects_dir / project_code)})
    return workflow_output_dict


def create_workflow_params_dict(utils_js):
    """
    Create dictionary of workflows and fields in Jinja2 template
    """
    wlp_pattern = re.compile(r"      let worflowParams = {(.*?)}\n.*?projectConf",re.M|re.S)
    workflow_params = wlp_pattern.findall(utils_js)[0]
    
    workflow_params_dict = {'contigs':'contigsOutdir', 'report':'reportOutdir', 'sra2fastq':'sraOutdir'}
    for row in workflow_params.split('\n'):
        if row.strip() and row.split(':')[1] != ' false,':
            if row.strip().split(':')[0] not in ['contigsOutdir', 'reportOutdir'] :
                workflow_params_dict.update({row.strip().split(':')[1].split('/')[-1].split('.')[2]:row.strip().split(':')[0]})
    return workflow_params_dict


def set_long_reads_options(conf_dict:dict) -> dict:
    long_reads_assembler_input = {
        "assembler": "LRASM",
        "minContigSize": 200,
        "aligner": "minimap2",
        "aligner_options": "",
        "extractUnmapped": False,
        "Lrasm_algorithm": "flye",
        "Lrasm_ec": False,
        "Lrasm_preset": "nanopore",
        "Lrasm_numConsensus": 3
        }
    long_reads_faqcs_input = {
        "trimQual": 7,
        "trim5end": 0,
        "trim3end": 0,
        "trimAdapter": False,
        "trimRate": 0.2,
        "trimPolyA": False,
        "artifactFile": None,
        "minLen": 50,
        "avgQual": 0,
        "numN": 2,
        "filtLC": 0.85,
        "filtPhiX": False
    }

    [p for p in conf_dict['pipeline'] if p['name'] == 'assembly'][0]['input'] = long_reads_assembler_input
    [p for p in conf_dict['pipeline'] if p['name'] == 'runFaQCs'][0]['input'] =  long_reads_faqcs_input
    logging.debug([p for p in conf_dict['pipeline'] if p['name'] == 'runFaQCs'][0]['input'])
    return conf_dict


def get_module_run_input_dict(conf_dict:dict, file_format:str) -> dict:
    """
    Creates a dictionary with modules that will be run. remove sra2fastq, runFaQCs, and assembly modules if input files are in fasta format.
    """
    if file_format == 'fasta':
        conf_dict['pipeline'] = [pipeline for pipeline in conf_dict['pipeline'] if pipeline['name'] not in ['sra2fastq', 'runFaQCs', 'assembly']]
    module_list = [True] * len(conf_dict['pipeline'])
    pipeline_list = [p['name'] for p in conf_dict['pipeline']]
    module_run_input_dict = dict(zip(pipeline_list, module_list))
    return module_run_input_dict


def create_render_dict(conf_dict:dict, output_template_dict:dict, module_run_input_dict:dict, 
                       nextflowOutDir:Path, refdata_dir:Path, opaver_web_dir:Path, apptainer_cache_dir:Path,
                       project_name: str, project_code: str, platform: str, file_format: str, sra_accessions=None) -> dict:
    """
    Creates a dictionary for rendering the Nextflow config template.
    """

    if sra_accessions:
        render_dict = {'inputFastq':[], 'inputFastq2':[], 'accessions': sra_accessions, 'source': 'sra'}
    elif file_format in ['fasta', 'fa']:
        render_dict = {'inputFasta': conf_dict['rawReads']['inputContigs']}
    else:
        render_dict = get_input_fastq_files(conf_dict)

    render_dict['refdata'] = refdata_dir
    render_dict['project'] = project_name if project_name else project_code
    render_dict['seqPlatform'] = platform
    render_dict['keggViewerDir'] = opaver_web_dir
    render_dict['cacheDir'] = apptainer_cache_dir
    render_dict.update(output_template_dict)
    render_dict.update(module_run_input_dict)
    render_dict.update({'nextflowOutDir':nextflowOutDir / project_code})
    for pipeline in conf_dict['pipeline']:
        logging.debug(f"Processing pipeline: {pipeline['name']}, input: {pipeline['input']}")
        if pipeline['name'] == 'taxonomy':
            pipeline['input']['enabledTools'] = ','.join(pipeline['input']['enabledTools'])
        elif pipeline['name'] == 'aimbots':
            render_dict.update(get_aimbots_options(pipeline['input'], refdata_dir))
            conf_dict['pipeline'].remove(pipeline)
            # pipeline['input'].pop('Blast Database(s)')

        render_dict.update(pipeline['input'])
    # convert boolean values to lowercase strings for jinja2 rendering
    render_dict = {k: (str(v).lower() if isinstance(v, bool) else v) for k, v in render_dict.items()}
    render_dict = {k: ("" if v is None else v) for k, v in render_dict.items()}
    return render_dict


def get_input_fastq_files(conf_dict:dict) -> dict:
    """
    Gets the input fastq files from the conf_dict and returns them as a dict list.
    """
    if not conf_dict['rawReads']['paired']:
        return {'inputFastq': conf_dict['rawReads']['inputFiles']}
    else:
        fq1, fq2 = [], []
        for pair in conf_dict['rawReads']['inputFiles']:
            fq1.append(pair['R1'])
            fq2.append(pair['R2'])
        return {'inputFastq': fq1, 'inputFastq2': fq2}
    

def get_aimbots_options(aimbots_input, refdata_dir):
    """
    Creates a dictionary with the aimbots options for rendering the Nextflow config template
    """
    db_choices = ['blastx', 'plasmid']
    db_dirs = ['uniprot', 'synthetic_plasmids']
    db_dict = dict(zip(db_choices, db_dirs))

    aimblots_blast_dict = {}
    for idx, db in enumerate(aimbots_input['Blast Database(s)']):
        db_name = f'db{idx+1}'
        blast_name = f'blast_type{idx+1}'
        aimblots_blast_dict.update(
            {blast_name: db['Blast Method'], 
             db_name: refdata_dir / 'aimbots_dbs' / db['Database']})
        if db['Second Pass Database'] not in ["none", None, "None"]:
            aimblots_blast_dict.update(
                {f'second_pass{idx+1}': refdata_dir / 'aimbots_dbs' / db['Second Pass Database']})
        if db['Evalue']:
            aimblots_blast_dict.update({f'evalue{idx+1}': db['Evalue']})
        if db['Minimum Identity']:
            aimblots_blast_dict.update({f'identity{idx+1}': db['Minimum Identity']})
        if db['Minimum % Coverage']:
            aimblots_blast_dict.update({f'coverage{idx+1}': db['Minimum % Coverage']})
        if db['Number of Matches']:
            aimblots_blast_dict.update({f'num_matches{idx+1}': db['Number of Matches']})
    aimbots_conf_map = {'CDD_num_matches':'Rpstblastn Matches', 'gap_extend':'Gap Extend Cost', 'gap_open':'Gap Open Cost', 'taxid':'Species Taxid', 
                        'negative_taxid':'Species Taxid Exclude', 'taxidlist_path':'Species Taxid File'}
    aimbots_options_dict = {}
    for k,v in aimbots_conf_map.items():
        aimbots_options_dict[k] = aimbots_input['Global Blast Options'][v]
    aimbots_options_dict.update(aimblots_blast_dict)
    return aimbots_options_dict

    

if __name__ == "__main__":
    main()

    