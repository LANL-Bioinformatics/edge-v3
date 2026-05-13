import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { workflows } from './defaults'

export const GeneFamily = (props) => {
  const workflowName = 'geneFamily'
  const [collapseParms, setCollapseParms] = useState(
    props.collapseParms !== undefined ? props.collapseParms : false,
  )
  const [form] = useState({ ...workflows[workflowName] })
  const [validInputs] = useState({ ...workflows[workflowName].validInputs })
  const [doValidation, setDoValidation] = useState(0)

  const toggleParms = () => {
    if (form.paramsOn) {
      setCollapseParms(!collapseParms)
    }
  }

  const setOnoff = (onoff) => {
    form.paramsOn = onoff
    setDoValidation(doValidation + 1)
  }

  const setSwitcher = (inForm, name) => {
    form.inputs[name].value = inForm.isTrue
    setDoValidation(doValidation + 1)
  }

  const setReadsOption = (inForm, name) => {
    form.readsInputs[name].value = inForm.option
    form.readsInputs[name].display = inForm.display
    setDoValidation(doValidation + 1)
  }

  const setContigsOption = (inForm, name) => {
    form.contigsInputs[name].value = inForm.option
    form.contigsInputs[name].display = inForm.display
    setDoValidation(doValidation + 1)
  }

  const setFileInput = (inForm, name) => {
    form.contigsInputs[name].value = inForm.fileInput
    form.contigsInputs[name].display = inForm.fileInput_display
    if (validInputs.contigsInputs[name]) {
      validInputs.contigsInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  useEffect(() => {
    if (props.allExpand > 0) {
      setCollapseParms(false)
    }
  }, [props.allExpand])

  useEffect(() => {
    if (props.allClosed > 0) {
      setCollapseParms(true)
    }
  }, [props.allClosed])

  useEffect(() => {
    if (props.source !== 'fasta') {
      form.inputs['readsGeneFamily'].value = true
      form.inputs['contigsGeneFamily'].value = false
    } else {
      form.inputs['readsGeneFamily'].value = false
      form.inputs['contigsGeneFamily'].value = true
    }
    setDoValidation(doValidation + 1)
  }, [props.source]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    form.paramsOn = props.paramsOn !== undefined ? props.paramsOn : true
    setDoValidation(doValidation + 1)
  }, [props.paramsOn]) // eslint-disable-line react-hooks/exhaustive-deps

  //trigger validation method when input changes
  useEffect(() => {
    // check input errors
    let errors = ''
    if (form.inputs['contigsGeneFamily'].value) {
      Object.keys(validInputs.contigsInputs).forEach((key) => {
        if (!validInputs.contigsInputs[key].isValid) {
          errors += validInputs.contigsInputs[key].error + '<br/>'
        }
      })
    }

    if (errors === '') {
      //files for server to caculate total input size
      let inputFiles = []
      form.files = inputFiles
      form.errMessage = null
      form.validForm = true
    } else {
      form.errMessage = errors
      form.validForm = false
    }
    //force updating parent's inputParams
    props.setParams(form, props.name)
  }, [doValidation]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="workflow-card">
      <Header
        toggle={true}
        toggleParms={toggleParms}
        title={props.title}
        collapseParms={collapseParms}
        id={workflowName + 'input'}
        isValid={form.paramsOn === true ? props.isValid : true}
        errMessage={props.errMessage}
        onoff={props.onoff}
        paramsOn={form.paramsOn}
        setOnoff={setOnoff}
        disabled={props.disabled !== undefined ? props.disabled : false}
      />
      <Collapse isOpen={!collapseParms && form.paramsOn} id={'collapseParameters-' + props.name}>
        <CardBody style={props.disabled ? { pointerEvents: 'none', opacity: '0.4' } : {}}>
          <span className="pt-3 text-muted edge-text-size-small">
            EDGE will use{' '}
            <a
              href="https://card.mcmaster.ca/analyze/rgi"
              target="_blank"
              rel="noopener noreferrer"
            >
              RGI (Resistance Gene Identifier)
            </a>{' '}
            to search reads for Antibiotic Resistance Genes from{' '}
            <a href="https://card.mcmaster.ca/" target="_blank" rel="noopener noreferrer">
              CARD
            </a>
            .
          </span>
          <ol type="a">
            <li style={{ fontWeight: 'normal' }} className="pt-3 text-muted edge-text-size-small">
              Read-based Gene Family Analysis
            </li>
            <br></br>
            <Switcher
              id={'readsGeneFamily'}
              name={'readsGeneFamily'}
              setParams={setSwitcher}
              text={workflows[workflowName].inputs['readsGeneFamily'].text}
              defaultValue={
                workflows[workflowName].inputs['readsGeneFamily']['switcher'].defaultValue
              }
              trueText={workflows[workflowName].inputs['readsGeneFamily']['switcher'].trueText}
              falseText={workflows[workflowName].inputs['readsGeneFamily']['switcher'].falseText}
              disableTrue={props.source === 'fasta'}
              disableFalse={props.source !== 'fasta'}
            />
            <br></br>
            {props.pairedReads && props.source === 'fastq' && (
              <>
                <OptionSelector
                  name={'virulenceFactorTool'}
                  setParams={setReadsOption}
                  text={workflows[workflowName].readsInputs['virulenceFactorTool'].text}
                  tooltip={workflows[workflowName].readsInputs['virulenceFactorTool'].tooltipReads}
                  options={workflows[workflowName].readsInputs['virulenceFactorTool'].options}
                  defaultValue={form.readsInputs['virulenceFactorTool'].value}
                  display={form.readsInputs['virulenceFactorTool'].display}
                  tooltipClickable={true}
                />
                <br></br>
              </>
            )}
            <li style={{ fontWeight: 'normal' }} className="pt-3 text-muted edge-text-size-small">
              Contig-based (CDS) Gene Family Analysis
            </li>
            <br></br>
            <Switcher
              id={'contigsGeneFamily'}
              name={'contigsGeneFamily'}
              setParams={setSwitcher}
              text={workflows[workflowName].inputs['contigsGeneFamily'].text}
              defaultValue={
                workflows[workflowName].inputs['contigsGeneFamily']['switcher'].defaultValue
              }
              trueText={workflows[workflowName].inputs['contigsGeneFamily']['switcher'].trueText}
              falseText={workflows[workflowName].inputs['contigsGeneFamily']['switcher'].falseText}
              // disableTrue={props.source !== 'fasta'}
              disableFalse={props.source === 'fasta'}
            />
            <br></br>
            {form.inputs['contigsGeneFamily'].value && (
              <>
                <OptionSelector
                  name={'virulenceFactorTool'}
                  setParams={setContigsOption}
                  text={workflows[workflowName].contigsInputs['virulenceFactorTool'].text}
                  tooltip={
                    workflows[workflowName].contigsInputs['virulenceFactorTool'].tooltipContigs
                  }
                  options={workflows[workflowName].contigsInputs['virulenceFactorTool'].options}
                  defaultValue={form.contigsInputs['virulenceFactorTool'].value}
                  display={form.contigsInputs['virulenceFactorTool'].display}
                  tooltipClickable={true}
                />
                <br></br>
              </>
            )}
            <br></br>
          </ol>
        </CardBody>
      </Collapse>
    </Card>
  )
}
