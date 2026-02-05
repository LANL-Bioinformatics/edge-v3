
import subprocess
import os
import re

from typing import Optional
from subprocess import DEVNULL

"""
Functions to interact with Nextflow pipeline runs. These functions, so far, have been written for local execution. 
"""

def clean_job(job_name: str, run_dir: str):
    r"""
    Cleans a Nextflow job. This removes temporary files produced during job execution, as well as
    the job's associated log file and cache directory. Attempting to resume a job after cleaning it
    will rerun the job from the start.

    Parameters
    ----------
    job_name : str
        The name of the Nextflow job to clean.
    run_dir: str
        The directory where the nextflow job was launched.
        This is the directory containing the Nextflow cache needed to clean `job_name`.
     

    Returns
    -------
    dict
        A dictionary with the following key-value pairs: (
            key: `job_name`
            value: A dictionary with the following key-value pairs: ()
                key: "status"
                value: "deleted"
            )
        )

    """
    #needs environment to find nextflow executable
    subprocess.run(["nextflow", "clean", f"{job_name}", "-f"], 
                   cwd=run_dir, 
                   env=os.environ.copy(),
                   stdout=DEVNULL)
    #`nextflow clean` would usually delete the associated .nextflow.log file, but using custom log file names
    #requires us to remove it manually
    try:
        os.remove(os.path.join(run_dir, f"{job_name}.log"))
    except OSError:
        pass

    return {job_name: {"status": "deleted"}}

def status_check_job(job_name: str, run_dir: str):
    r"""
    Checks the status of a given Nextflow job. 

    Parameters
    ----------
    job_name : str
        The name of the Nextflow job to check.
    run_dir: str
        The directory where the Nextflow job was launched.
        This is the directory containing the cache needed to check the status of `job_name`.

    Returns
    -------
    dict
        A dictionary with the following key-value pairs: (
            key: `job_name`
            value: a dictionary with the following key-value pairs: (
                key: "status"
                value: one of "not found", "in queue", "running", "failed", "error", or "complete".
                )
            )

    """

    log = ""
    try:
        with open(os.path.join(run_dir, f"{job_name}.log"), 'rt') as logfile:
            status = "in queue"
            log = logfile.read()
    except:
        return {job_name: {"status": "not found"}}



    if re.search(r"nextflow\.Session - Session start", log):
        status = "running"

    complete_match = re.search(r"Workflow completed > WorkflowStats\[succeededCount=(\d+); failedCount=(\d+)", log)
    submitted_tasks = re.findall(r"Submitted process", log)
    if complete_match:
        succeeded = complete_match.group(1)
        if int(succeeded) < len(submitted_tasks): #at least one process failed and was not retried
            status = "failed"
        else:
            status = "complete"

    if re.search(r"Operation aborted", log) or re.search(r"Script compilation error",log):
        status = "error"
    return {job_name: {"status": status}}
    

def rerun_job(job_name: str, project_path: str, run_dir: str, temp_dir: Optional[str] = None):
    r"""
    Resumes a partially complete or failed Nextflow job.

    Parameters
    ----------
    job_name : str
        The name of the Nextflow job to rerun.

    project_path : str
        The path to the Nextflow pipeline file to rerun.

    run_dir : str
        The directory where the Nextflow job was launched.
        This is the directory containing the Nextflow cache needed to resume `job_name`.

    temp_dir : str
        The directory where Nextflow stores intermediate files.
        Needed to resume `job_name` correctly.
        By default, this is the launch directory.


    Returns
    -------
    dict
        A dictionary with the following key-value pairs: (
            key: `job_name`
            value: A dictionary with the following key-value pairs: (
                key: "status"
                value: "started"
                key: "project_path"
                value: `project_path`
                key: "run_dir"
                value: `run_dir`
                key: "temp_dir"
                value: `temp_dir`
                )
            )
    """

    if temp_dir is None:
        temp_dir = run_dir
    log = subprocess.run(["nextflow", "log"], env=os.environ.copy(), cwd=run_dir, capture_output=True)
    output = log.stdout.decode('ascii').split('\n')
    session = ""
    for line in output:
        if f"{job_name}" in line:
            session = line.split('\t')[5]
    subprocess.Popen(["nextflow",
                        "-C", os.path.join(run_dir, "nextflow.config"),
                        "-log", os.path.join(run_dir, f"{job_name}.log"), 
                        "run", project_path,
                        "-work-dir", os.path.join(temp_dir, 'work') ,
                        "-resume", session,
                        "-ansi-log", "false"], 
                        env=os.environ.copy(), 
                        cwd=run_dir,
                        start_new_session=True,
                        stdout=DEVNULL,
                        stderr=DEVNULL)

    return {job_name: {"status": "started", "project_path" : project_path,"run_dir": run_dir, "temp_dir": temp_dir}}
    
def start_job(job_name: str, project_path: str, run_dir: str=os.getcwd(), temp_dir: Optional[str] = None):
    r"""
    Starts a nextflow pipeline from the current directory, running the project found at `project_path`.

    Parameters
    ----------
    job_name : str
        Names the job with a shorthand identifier. Must be unique.
    project_path : str
        Path to the Nextflow project being run (e.g., 'main.nf')
    run_dir : str
        Desired location to launch the Nextflow job from. By default, this is the current directory.
    temp_dir : str
        Desired location of the work directory for the pipeline, used to store intermediate files.
        By default, this is the launch directory (`run_dir`).


    Returns
    -------
    dict
    A dictionary with the following key-value pairs: (
        key: `job_name`
        value: A dictionary with the following key-value pairs: (
            key: "status"
            value: "started"
            key: "project_path"
            value: `project_path`
            key: "run_dir"
            value: `run_dir`
            key: "work_dir"
            value: `work_dir`
        )
    )

    """
    if temp_dir is None:
        temp_dir = run_dir

    subprocess.Popen(["nextflow",
                      "-C", os.path.join(run_dir, "nextflow.config"),
                      "-log", os.path.join(run_dir, f"{job_name}.log"),
                      "run", project_path, 
                      "-name", job_name,
                      "-work-dir", os.path.join(temp_dir, 'work'),
                      "-ansi-log", "false"],
                      env = os.environ.copy(), 
                      cwd = run_dir,
                      start_new_session= True,
                      stdout=DEVNULL,
                      stderr = DEVNULL
                      )
    return {job_name: {"status": "started", "project_path" : project_path, "run_dir": run_dir, "temp_dir": temp_dir}}