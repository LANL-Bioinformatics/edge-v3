import os
from pathlib import Path
import json
import jinja2
import pprint
import re
import argparse
import random
import string

def create_output_directory_dict(projects_dir:Path, project_code:str) -> dict:
    """Create dict with output directories for pipeline_params template 
    {'contigsOutdir': '/path/to/projects_dir/project_code/',
    'reportOutdir': '/path/to/projects_dir/project_code/',
    'qcOutdir': '/path/to/projects_dir/project_code/output/ReadsQC/',
     etc.}
    """
    root_dir = Path.cwd().parent.parent.parent
    utils_path = root_dir / 'webapp/server/workflow/util.js'
    # utils_path = Path('edge-v3/webapp/server/workflow/util.js')
    cwd = os.getcwd()
    utils_js = utils_path.read_text()
    
    workflow_list = get_workflow_list(utils_js)

    workflow_output_dict = create_workflow_output_paths_dict(workflow_list, projects_dir, project_code)

    workflow_params_dict = create_workflow_params_dict(utils_js)
    # create dictionary with Jinja2 fields for workflows and the paths to the workflow outputs
    output_template_dict = {}
    for k,v in workflow_params_dict.items():
        output_template_dict.update({v: workflow_output_dict[k]})
    return output_template_dict


def get_workflow_list(utils_js:str):
    """
    Get list of all workflows that could be run
    """
    wl_pattern = re.compile(r"const workflowList = {(.*?)}\n.*?const",re.M|re.S)
    workflows = wl_pattern.findall(utils_js)[0]
    ind_wf_pattern = re.compile("\s+(\w+): {\n(.*?)},\n",re.M|re.S)
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


def get_module_run_input_dict(conf_dict:dict) -> dict:
    """
    Creates a dictionary with modules that will be run.
    """
    pipeline_list = [p['name'] for p in conf_dict['pipeline']]
    module_list = [True] * len(pipeline_list)
    module_run_input_dict = dict(zip(pipeline_list, module_list))
    return module_run_input_dict


def create_render_dict(conf_dict:dict, output_template_dict:dict, module_run_input_dict:dict, 
                       nextflowOutDir:Path, refdata_dir:Path, opaver_web_dir:Path, project_name) -> dict:
    """
    Creates a dictionary for rendering the Nextflow config template.
    """
    render_dict = {'inputFastq':[conf_dict['rawReads']['inputFiles']]}
    render_dict['refdata'] = refdata_dir
    render_dict['project'] = project_name
    render_dict['fastqSource'] = "Illumina"
    render_dict['keggViewerDir'] = opaver_web_dir
    render_dict.update(output_template_dict)
    render_dict.update(module_run_input_dict)
    render_dict.update({'nextflowOutDir':str(nextflowOutDir)})
    for pipeline in conf_dict['pipeline']:
        if pipeline['name'] == 'taxonomy':
            pipeline['input']['enabledTools'] = ','.join(pipeline['input']['enabledTools'])
    render_dict.update(pipeline['input'])
    # convert boolean values to lowercase strings for jinja2 rendering
    render_dict = {k: (str(v).lower() if isinstance(v, bool) else v) for k, v in render_dict.items()}
    return render_dict


def render_nextflow_config(projects_dir:Path, conf_json_file:Path, 
                           project_name:str, nextflowOutDir:Path, 
                           refdata_dir:Path, opaver_web_dir:Path, template_file: Path) -> None:
    """
    Renders the Nextflow configuration file. 
    Uses the utils.js and conf.json files to create a dictionary with the necessary parameters and output 
    directories for the Nextflow config template. Then renders the template and writes the Nextflow 
    config file to the project directory.
    """
    project_code = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    conf_dict = json.loads(conf_json_file.read_text())
    output_template_dict = create_output_directory_dict(projects_dir, project_code)

    # create dict for input to modules template
    module_run_input_dict = get_module_run_input_dict(conf_dict)

    render_dict = create_render_dict(conf_dict, output_template_dict, module_run_input_dict, 
                                     nextflowOutDir, refdata_dir, opaver_web_dir, project_name)
    # Render nextflow config template with output directories
    environment = jinja2.Environment()
    template = environment.from_string(template_file.read_text())
    rendered_config = template.render(render_dict)
    path = projects_dir / project_code
    path.mkdir(parents=True, exist_ok=True)
    config_path = path / 'nextflow.config'
    config_path.write_text(rendered_config)

    print(f"Nextflow config file created at: {config_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Render Nextflow config")
    parser.add_argument("--project-name", type=str, help="Project name chosen by user")
    parser.add_argument("--conf-json-file", type=Path, help="Path to config JSON file used to define pipeline parameters and modules to run")
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

    render_nextflow_config(projects_dir, conf_json_file, project_name, 
                           nextflowOutDir, refdata_dir, 
                           opaver_web_dir, template_file)
    