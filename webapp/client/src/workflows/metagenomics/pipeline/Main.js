import React, { useState, useEffect } from 'react'
import { Button, Form } from 'reactstrap'
import { useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { workflowList } from 'src/util'
import { postData, getData, notify, apis, isValidFileInput } from 'src/edge/common/util'
import { LoaderDialog, MessageDialog } from 'src/edge/common/Dialogs'
import { HtmlText } from 'src/edge/common/HtmlText'
import { Project } from 'src/edge/project/forms/Project'
import { InputRawReads } from 'src/edge/project/forms/InputRawReads'
import { components } from 'src/edge/project/forms/defaults'
import { RunFaQCs } from '../forms/RunFaQCs'
import { Assembly } from '../forms/Assembly'
import { Annotation } from '../forms/Annotation'
import { Binning } from './forms/Binning'
import { AntiSmash } from '../forms/AntiSmash'
import { Taxonomy } from '../forms/Taxonomy'
import { Phylogeny } from '../forms/Phylogeny'
import { RefBased } from '../forms/RefBased'
import { GeneFamily } from '../forms/GeneFamily'
import { workflows } from './forms/defaults'

const Main = (props) => {
  const pipeline = 'metagenomics'
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [requestSubmit, setRequestSubmit] = useState(false)
  const [projectParams, setProjectParams] = useState()
  const [rawDataParams, setRawDataParams] = useState({ ...components.inputRawReads })
  const [selectedWorkflows, setSelectedWorkflows] = useState({ ...workflows })
  const [refGenomeOptions, setRefGenomeOptions] = useState(null)
  const [doValidation, setDoValidation] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [sysMsg, setSysMsg] = useState()
  const [allExpand, setAllExpand] = useState(0)
  const [allClosed, setAllClosed] = useState(0)
  const [reloadBinning, setReloadBinning] = useState(0)
  //disable the expand | close
  const disableExpandClose = false

  const updateBinning = () => {
    if (!selectedWorkflows['assembly'].paramsOn || selectedWorkflows['assembly'].disabled) {
      selectedWorkflows['binning'].disabled = true
      selectedWorkflows['binning'].paramsOn = false
    } else {
      selectedWorkflows['binning'].disabled = false
    }
    setReloadBinning(reloadBinning + 1)
  }

  //callback function for child component
  const setProject = (params) => {
    //console.log('main project:', params)
    setProjectParams(params)
    setDoValidation(doValidation + 1)
  }
  //callback function for child component
  const setRawData = (params) => {
    //console.log('rawData:', params)
    setRawDataParams(params)
    setDoValidation(doValidation + 1)
  }
  const setWorkflowParams = (params, workflowName) => {
    //console.log(workflowName, params)
    setSelectedWorkflows({ ...selectedWorkflows, [workflowName]: params })
    setDoValidation(doValidation + 1)
  }

  //submit button clicked
  const onSubmit = () => {
    setSubmitting(true)
    let formData = {}
    formData.category = workflowList[pipeline].category
    formData.workflow = { name: pipeline }
    // set project info
    formData.project = {
      name: projectParams.projectName,
      desc: projectParams.projectDesc,
      type: pipeline,
    }
    if (rawDataParams.inputs.source.value === 'sra') {
      formData.rawReads = {
        source: rawDataParams.inputs.source.value,
        accessions: rawDataParams.inputs.inputFiles.value,
      }
      rawDataParams.files = []
    } else if (rawDataParams.inputs.source.value === 'fasta') {
      formData.rawReads = {
        source: rawDataParams.inputs.source.value,
        inputFasta: rawDataParams.inputs.inputFiles.value[0],
      }
    } else {
      formData.rawReads = {
        source: rawDataParams.inputs.source.value,
        seqPlatform: rawDataParams.inputs.seqPlatform.value,
        paired: rawDataParams.inputs.paired.value,
        inputFiles: rawDataParams.inputs.inputFiles.value,
      }
    }

    // set workflow input display
    let inputDisplay = { 'Raw Reads': {} }
    if (rawDataParams.inputs.source.value === 'sra') {
      const pairedDisplay = rawDataParams.inputs['paired'].value ? 'Yes' : 'No'
      inputDisplay['Raw Reads'][rawDataParams.inputs['source'].text] =
        rawDataParams.inputs['source'].display
      inputDisplay['Raw Reads']['SRA Accession(s)'] = rawDataParams.inputs['inputFiles'].display
      inputDisplay['Raw Reads'][rawDataParams.inputs['seqPlatform'].text] =
        rawDataParams.inputs['seqPlatform'].display
      inputDisplay['Raw Reads'][rawDataParams.inputs['paired'].text] = pairedDisplay
    } else if (rawDataParams.inputs.source.value === 'fasta') {
      inputDisplay['Raw Reads'][rawDataParams.inputs['source'].text] =
        rawDataParams.inputs['source'].display
      inputDisplay['Raw Reads']['Contig/Fasta File'] = rawDataParams.inputs['inputFiles'].display[0]
    } else {
      Object.keys(rawDataParams.inputs).forEach((key) => {
        if (rawDataParams.inputs[key].display) {
          inputDisplay['Raw Reads'][rawDataParams.inputs[key].text] =
            rawDataParams.inputs[key].display
        } else {
          inputDisplay['Raw Reads'][rawDataParams.inputs[key].text] =
            rawDataParams.inputs[key].value
        }
      })
    }

    //add selected assembler inputs to main inputs
    if (selectedWorkflows['assembly'].paramsOn) {
      selectedWorkflows['assembly'].inputs = {
        ...selectedWorkflows['assembly'].inputs,
        // eslint-disable-next-line prettier/prettier
        ...selectedWorkflows['assembly'].assemblerInputs[selectedWorkflows['assembly'].inputs['assembler'].value]
      }
    }
    //add selected annotateProgram inputs to main inputs
    if (selectedWorkflows['annotation'].paramsOn) {
      selectedWorkflows['annotation'].inputs = {
        ...selectedWorkflows['annotation'].inputs,
        // eslint-disable-next-line prettier/prettier
        ...selectedWorkflows['annotation'].annotateProgramInputs[selectedWorkflows['annotation'].inputs['annotateProgram'].value]
      }
    }
    //add readInputs to main inputs
    if (rawDataParams.inputs.source.value !== 'fasta' && selectedWorkflows['taxonomy'].paramsOn) {
      selectedWorkflows['taxonomy'].inputs = {
        ...selectedWorkflows['taxonomy'].inputs,
        // eslint-disable-next-line prettier/prettier
        ...selectedWorkflows['taxonomy'].readInputs
      }
    }
    //add genome inputs to main inputs
    if (
      selectedWorkflows['phylogeny'].paramsOn &&
      !selectedWorkflows['phylogeny'].inputs['snpDBname'].value
    ) {
      selectedWorkflows['phylogeny'].inputs = {
        ...selectedWorkflows['phylogeny'].inputs,
        // eslint-disable-next-line prettier/prettier
        ...selectedWorkflows['phylogeny'].genomeInputs
      }
    }
    //add optional inputs to main inputs
    if (selectedWorkflows['refBased'].paramsOn) {
      selectedWorkflows['refBased'].inputs = {
        ...selectedWorkflows['refBased'].inputs,
        // eslint-disable-next-line prettier/prettier
        ...(selectedWorkflows['refBased'].inputs['r2gVariantCall'].value ? selectedWorkflows['refBased'].r2gVariantCallInputs : {}),
        ...(selectedWorkflows['refBased'].inputs['r2gGetConsensus'].value
          ? selectedWorkflows['refBased'].r2gGetConsensusInputs
          : {}),
      }
    }
    //add optional inputs to main inputs
    if (selectedWorkflows['geneFamily'].paramsOn) {
      if (selectedWorkflows['geneFamily'].inputs['readsGeneFamily'].value) {
        selectedWorkflows['geneFamily'].inputs = {
          ...selectedWorkflows['geneFamily'].inputs,
          // eslint-disable-next-line prettier/prettier
          ...selectedWorkflows['geneFamily'].readsInputs
        }
      } else {
        selectedWorkflows['geneFamily'].inputs = {
          ...selectedWorkflows['geneFamily'].inputs,
          // eslint-disable-next-line prettier/prettier
          ...selectedWorkflows['geneFamily'].contigsInputs
        }
      }
    }

    let inputFiles = []
    // set workflow inputs
    let myWorkflows = []
    Object.keys(selectedWorkflows).forEach((workflow) => {
      if (selectedWorkflows[workflow].paramsOn) {
        // set workflow inputs
        let myWorkflow = { name: workflow, input: {} }
        inputDisplay[[workflowList[workflow].label]] = {}
        inputFiles = [...inputFiles, ...selectedWorkflows[workflow].files]
        Object.keys(selectedWorkflows[workflow].inputs).forEach((key) => {
          myWorkflow.input[key] = selectedWorkflows[workflow].inputs[key].value
          if (selectedWorkflows[workflow].inputs[key].display) {
            inputDisplay[[workflowList[workflow].label]][
              selectedWorkflows[workflow].inputs[key].text
            ] = selectedWorkflows[workflow].inputs[key].display
          } else {
            inputDisplay[[workflowList[workflow].label]][
              selectedWorkflows[workflow].inputs[key].text
            ] = selectedWorkflows[workflow].inputs[key].value
          }
        })
        myWorkflows.push(myWorkflow)
      }
    })

    // set form data
    formData.pipeline = myWorkflows
    formData.inputDisplay = inputDisplay

    // files used for caculating total input size on server side
    formData.files = [...rawDataParams.files, ...inputFiles]

    // submit to server via api
    postData(apis.userProjects, formData)
      .then((data) => {
        setSubmitting(false)
        notify('success', 'Your pipeline request was submitted successfully!', 2000)
        setTimeout(() => navigate('/user/projects'), 2000)
      })
      .catch((error) => {
        setSubmitting(false)
        alert(error)
      })
  }

  const closeMsgModal = () => {
    setOpenDialog(false)
  }

  useEffect(() => {
    //disable readsQC
    if (rawDataParams.inputs.source.value === 'fasta') {
      selectedWorkflows['runFaQCs'].disabled = true
      selectedWorkflows['assembly'].disabled = true
      selectedWorkflows['runFaQCs'].paramsOn = false
      selectedWorkflows['assembly'].paramsOn = false
    } else {
      selectedWorkflows['runFaQCs'].disabled = false
      selectedWorkflows['assembly'].disabled = false
      selectedWorkflows['runFaQCs'].paramsOn = true
      selectedWorkflows['assembly'].paramsOn = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawDataParams.inputs.source.value])

  useEffect(() => {
    updateBinning()
    setRequestSubmit(true)

    if (projectParams && !projectParams.validForm) {
      setRequestSubmit(false)
    }
    if (rawDataParams && !rawDataParams.validForm) {
      setRequestSubmit(false)
    }

    Object.keys(selectedWorkflows).forEach((workflow) => {
      if (
        selectedWorkflows[workflow].paramsOn &&
        !selectedWorkflows[workflow].disabled &&
        !selectedWorkflows[workflow].validForm
      ) {
        setRequestSubmit(false)
      }
    })
  }, [doValidation]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function loadRefList() {
      getData('/api/workflow/data/reflist')
        .then((data) => {
          return data.reflist.reduce(function (options, ref) {
            options.push({ value: ref, label: ref.replaceAll('_', ' ') })
            return options
          }, [])
        })
        .then((options) => {
          setRefGenomeOptions(options)
        })
        .catch((error) => {
          alert(error)
        })
    }

    if (!refGenomeOptions) {
      loadRefList()
    }
    setDoValidation(doValidation + 1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let url = apis.userInfo
    getData(url)
      .then((data) => {
        if (data.info.allowNewRuns) {
          setDisabled(false)
        } else {
          setSysMsg(data.info.message)
          setDisabled(true)
          setOpenDialog(true)
        }
      })
      .catch((err) => {
        alert(err)
      })
  }, [props])

  return (
    <div
      className="animated fadeIn"
      style={disabled ? { pointerEvents: 'none', opacity: '0.4' } : {}}
    >
      <MessageDialog
        className="modal-lg modal-danger"
        title="System Message"
        isOpen={openDialog}
        html={true}
        message={'<div><b>' + sysMsg + '</b></div>'}
        handleClickClose={closeMsgModal}
      />
      <span className="pt-3 text-muted edge-text-size-small">
        Metagenomics | Run Multiple Workflows{' '}
      </span>
      <ToastContainer />
      <LoaderDialog loading={submitting === true} text="Submitting..." />
      <Form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <div className="clearfix">
          <h4 className="pt-3">Run Multiple Workflows</h4>
          <hr />
          <Project setParams={setProject} />
          <br></br>
          <InputRawReads
            setParams={setRawData}
            isValidFileInput={isValidFileInput}
            sourceOptionsOn={true}
            title={'Input Raw Reads'}
            isValid={rawDataParams ? rawDataParams.validForm : true}
            errMessage={rawDataParams ? rawDataParams.errMessage : null}
          />
          <br></br>
          Choose Processes / Analyses
          <br></br>
          {workflowList[pipeline]?.info && (
            <span className="pt-3 text-muted edge-text-size-small">
              <HtmlText text={workflowList[pipeline].info} />
            </span>
          )}
          <br></br>
          <br></br>
          {!disableExpandClose && (
            <>
              <span className="float-end edge-text-size-small">
                <Button
                  style={{ fontSize: 12, paddingBottom: '5px' }}
                  size="sm"
                  className="btn-pill"
                  color="ghost-primary"
                  onClick={() => setAllExpand(allExpand + 1)}
                >
                  expand
                </Button>
                &nbsp; | &nbsp;
                <Button
                  style={{ fontSize: 12, paddingBottom: '5px' }}
                  size="sm"
                  className="btn-pill"
                  color="ghost-primary"
                  onClick={() => setAllClosed(allClosed + 1)}
                >
                  close
                </Button>
                &nbsp; all sections &nbsp;
              </span>
              <br></br>
              <br></br>
            </>
          )}
          <RunFaQCs
            name={'runFaQCs'}
            title={workflowList['runFaQCs'].label}
            setParams={setWorkflowParams}
            isValid={selectedWorkflows['runFaQCs'] ? selectedWorkflows['runFaQCs'].validForm : true}
            errMessage={
              selectedWorkflows['runFaQCs'] ? selectedWorkflows['runFaQCs'].errMessage : null
            }
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={true}
            disabled={
              selectedWorkflows['runFaQCs'] ? selectedWorkflows['runFaQCs'].disabled : false
            }
            seqPlatform={rawDataParams?.inputs.seqPlatform.value}
          />
          <Assembly
            name={'assembly'}
            title={workflowList['assembly'].label}
            setParams={setWorkflowParams}
            isValid={selectedWorkflows['assembly'] ? selectedWorkflows['assembly'].validForm : true}
            errMessage={
              selectedWorkflows['assembly'] ? selectedWorkflows['assembly'].errMessage : null
            }
            seqPlatform={rawDataParams?.inputs.seqPlatform.value}
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={true}
            disabled={
              selectedWorkflows['assembly'] ? selectedWorkflows['assembly'].disabled : false
            }
          />
          <Annotation
            name={'annotation'}
            title={workflowList['annotation'].label}
            setParams={setWorkflowParams}
            isValid={
              selectedWorkflows['annotation'] ? selectedWorkflows['annotation'].validForm : true
            }
            errMessage={
              selectedWorkflows['annotation'] ? selectedWorkflows['annotation'].errMessage : null
            }
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={true}
            disabled={
              selectedWorkflows['annotation'] ? selectedWorkflows['annotation'].disabled : false
            }
          />
          <Binning
            name={'binning'}
            title={workflowList['binning'].label}
            setParams={setWorkflowParams}
            isValid={selectedWorkflows['binning'] ? selectedWorkflows['binning'].validForm : true}
            errMessage={
              selectedWorkflows['binning'] ? selectedWorkflows['binning'].errMessage : null
            }
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={true}
            disabled={selectedWorkflows['binning'] ? selectedWorkflows['binning'].disabled : false}
            reload={reloadBinning}
          />
          <AntiSmash
            name={'antiSmash'}
            title={workflowList['antiSmash'].label}
            setParams={setWorkflowParams}
            isValid={
              selectedWorkflows['antiSmash'] ? selectedWorkflows['antiSmash'].validForm : true
            }
            errMessage={
              selectedWorkflows['antiSmash'] ? selectedWorkflows['antiSmash'].errMessage : null
            }
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={true}
            disabled={
              selectedWorkflows['antiSmash'] ? selectedWorkflows['antiSmash'].disabled : false
            }
          />
          <Taxonomy
            name={'taxonomy'}
            title={workflowList['taxonomy'].label}
            setParams={setWorkflowParams}
            isValid={selectedWorkflows['taxonomy'] ? selectedWorkflows['taxonomy'].validForm : true}
            errMessage={
              selectedWorkflows['taxonomy'] ? selectedWorkflows['taxonomy'].errMessage : null
            }
            source={rawDataParams?.inputs.source.value}
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={true}
            disabled={
              selectedWorkflows['taxonomy'] ? selectedWorkflows['taxonomy'].disabled : false
            }
          />
          <Phylogeny
            name={'phylogeny'}
            title={workflowList['phylogeny'].label}
            setParams={setWorkflowParams}
            isValid={
              selectedWorkflows['phylogeny'] ? selectedWorkflows['phylogeny'].validForm : true
            }
            errMessage={
              selectedWorkflows['phylogeny'] ? selectedWorkflows['phylogeny'].errMessage : null
            }
            source={rawDataParams?.inputs.source.value}
            refGenomeOptions={refGenomeOptions}
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={false}
            disabled={
              selectedWorkflows['phylogeny'] ? selectedWorkflows['phylogeny'].disabled : false
            }
          />
          <RefBased
            name={'refBased'}
            title={workflowList['refBased'].label}
            setParams={setWorkflowParams}
            isValid={selectedWorkflows['refBased'] ? selectedWorkflows['refBased'].validForm : true}
            errMessage={
              selectedWorkflows['refBased'] ? selectedWorkflows['refBased'].errMessage : null
            }
            source={rawDataParams?.inputs.source.value}
            refGenomeOptions={refGenomeOptions}
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={false}
            disabled={
              selectedWorkflows['refBased'] ? selectedWorkflows['refBased'].disabled : false
            }
          />
          <GeneFamily
            name={'geneFamily'}
            title={workflowList['geneFamily'].label}
            setParams={setWorkflowParams}
            isValid={
              selectedWorkflows['geneFamily'] ? selectedWorkflows['geneFamily'].validForm : true
            }
            errMessage={
              selectedWorkflows['geneFamily'] ? selectedWorkflows['geneFamily'].errMessage : null
            }
            source={rawDataParams?.inputs.source.value}
            pairedReads={rawDataParams?.inputs.paired.value}
            allExpand={allExpand}
            allClosed={allClosed}
            onoff={true}
            collapseParms={true}
            paramsOn={false}
            disabled={
              selectedWorkflows['geneFamily'] ? selectedWorkflows['geneFamily'].disabled : false
            }
          />
          <br></br>
        </div>
        <div className="edge-center">
          <Button color="primary" onClick={(e) => onSubmit()} disabled={!requestSubmit}>
            Submit
          </Button>{' '}
        </div>
        <br></br>
        <br></br>
      </Form>
    </div>
  )
}

export default Main
