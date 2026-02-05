import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput } from 'src/edge/common/util'
import { HtmlText } from 'src/edge/common/HtmlText'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { FastqInput } from 'src/edge/project/forms/FastqInput'
import { SRAAccessionInput } from 'src/edge/project/forms/SRAAccessionInput'
import { FileInputArray } from 'src/edge/project/forms/FileInputArray'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { inputRawReads } from '../defaults'

export const InputRawReads = (props) => {
  const [collapseParms, setCollapseParms] = useState(false)
  const [form] = useState({ ...inputRawReads })
  const [validInputs] = useState({ ...inputRawReads.validInputs })
  const [doValidation, setDoValidation] = useState(0)
  const [reset, setReset] = useState(0)

  const toggleParms = () => {
    setCollapseParms(!collapseParms)
  }

  const setOption = (inForm, name) => {
    form.inputs[name].value = inForm.option
    form.inputs[name].display = inForm.display ? inForm.display : inForm.option
    setReset(reset + 1)
    setDoValidation(doValidation + 1)
  }

  const setFastqInput = (inForm, name) => {
    form.validForm = inForm.validForm
    form.inputs['seqPlatform'].value = inForm.platform
    form.inputs['seqPlatform'].display = inForm.platform_display
    form.inputs['paired'].value = inForm.paired
    form.inputs[name].value = inForm.fileInput
    form.inputs[name].display = inForm.fileInput_display
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setFileInput = (inForm, name) => {
    form.validForm = inForm.validForm
    form.inputs[name].value = inForm.fileInput
    form.inputs[name].display = inForm.fileInput_display
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setSRAccessionInput = (inForm, name) => {
    form.validForm = inForm.validForm
    form.inputs[name].value = inForm.accessions
    form.inputs[name].display = inForm.accessions_display
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  useEffect(() => {
    if (props.source) {
      form.inputs['source'].value = props.source
      form.inputs['source'].display = props.sourceDisplay
    }
  }, [props.source]) // eslint-disable-line react-hooks/exhaustive-deps

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

  //trigger validation method when input changes
  useEffect(() => {
    // check input errors
    let errors = ''
    Object.keys(validInputs).forEach((key) => {
      if (!validInputs[key].isValid) {
        errors += validInputs[key].error + '<br/>'
      }
    })

    if (errors === '') {
      //files for server to caculate total input size
      let inputFiles = []
      if (form.inputs['source'].value === 'fastq' && form.inputs['paired'].value) {
        form.inputs['inputFiles'].value.forEach((item) => {
          inputFiles.push(item.f1)
          inputFiles.push(item.f2)
        })
      } else {
        inputFiles = form.inputs['inputFiles'].value
      }
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
        id={'inputRawReads'}
        isValid={props.isValid}
        errMessage={props.errMessage}
      />
      <Collapse isOpen={!collapseParms} id={'collapseParameters-' + props.name}>
        <CardBody>
          {props.note && (
            <>
              <span className="text-muted edge-text-size-small">
                <HtmlText text={props.note} />
                <br></br>
                <br></br>
              </span>
            </>
          )}
          {props.sourceOptionsOn && (
            <>
              <OptionSelector
                id={'source'}
                name={'source'}
                setParams={setOption}
                options={
                  props.sourceOptions ? props.sourceOptions : inputRawReads.inputs['source'].options
                }
                text={inputRawReads.inputs['source'].text}
                tooltip={props.tooltip ? props.tooltip : inputRawReads.inputs['source'].tooltip}
                defaultValue={inputRawReads.inputs['source'].value}
                display={inputRawReads.inputs['source'].display}
              />
              <br></br>
            </>
          )}
          {form.inputs['source'].value === 'fastq' && (
            <>
              <FastqInput
                name={'inputFiles'}
                setParams={setFastqInput}
                isValidFileInput={
                  props.fastqSettings?.isValidFileInput
                    ? props.fastqSettings?.isValidFileInput
                    : isValidFileInput
                }
                note={props.fastqSettings?.note}
                text={props.fastqSettings?.text ? props.fastqSettings?.text : null}
                tooltip={props.fastqSettings?.tooltip ? props.fastqSettings?.tooltip : null}
                enableInput={
                  props.fastqSettings?.enableInput
                    ? props.fastqSettings?.enableInput
                    : inputRawReads.fastqInput.enableInput
                }
                placeholder={
                  props.fastqSettings?.placeholder
                    ? props.fastqSettings?.placeholder
                    : inputRawReads.fastqInput.placeholder
                }
                dataSources={
                  props.fastqSettings?.dataSources
                    ? props.fastqSettings?.dataSources
                    : inputRawReads.fastqInput.dataSources
                }
                fileTypes={
                  props.fastqSettings?.fileTypes
                    ? props.fastqSettings?.fileTypes
                    : inputRawReads.fastqInput.fileTypes
                }
                projectTypes={
                  props.fastqSettings?.projectTypes ? props.fastqSettings?.projectTypes : null
                }
                projectScope={
                  props.fastqSettings?.projectTypes
                    ? props.fastqSettings?.projectTypes
                    : inputRawReads.fastqInput.projectTypes
                }
                viewFile={
                  props.fastqSettings?.viewFile
                    ? props.fastqSettings?.viewFile
                    : inputRawReads.fastqInput.viewFile
                }
                isOptional={
                  props.fastqSettings?.isOptional
                    ? props.fastqSettings?.isOptional
                    : inputRawReads.fastqInput.isOptional
                }
                cleanupInput={
                  props.fastqSettings?.cleanupInput
                    ? props.fastqSettings?.cleanupInput
                    : inputRawReads.fastqInput.cleanupInput
                }
                maxInput={
                  props.fastqSettings?.maxInput
                    ? props.fastqSettings?.maxInput
                    : inputRawReads.fastqInput.maxInput
                }
                seqPlatformOptions={inputRawReads.inputs['seqPlatform'].options}
                seqPlatformText={inputRawReads.inputs['seqPlatform'].text}
                seqPlatformTooltip={inputRawReads.inputs['seqPlatform'].tooltip}
                seqPlatformDefaultValue={inputRawReads.inputs['seqPlatform'].value}
                seqPlatformDisplay={inputRawReads.inputs['seqPlatform'].display}
                pairedText={inputRawReads.inputs['paired'].text}
              />
              <br></br>
            </>
          )}
          {form.inputs['source'].value === 'fasta' && (
            <>
              <FileInputArray
                setParams={setFileInput}
                name={'inputFiles'}
                isValidFileInput={
                  props.fastaSettings?.isValidFileInput
                    ? props.fastaSettings?.isValidFileInput
                    : isValidFileInput
                }
                note={props.fastaSettings?.note}
                text={
                  props.fastaSettings?.text
                    ? props.fastaSettings?.text
                    : inputRawReads.fastaInput.text
                }
                tooltip={
                  props.fastaSettings?.tooltip
                    ? props.fastaSettings?.tooltip
                    : inputRawReads.fastaInput.tooltip
                }
                enableInput={
                  props.fastaSettings?.enableInput
                    ? props.fastaSettings?.enableInput
                    : inputRawReads.fastaInput.enableInput
                }
                placeholder={
                  props.fastaSettings?.placeholder
                    ? props.fastaSettings?.placeholder
                    : inputRawReads.fastaInput.placeholder
                }
                dataSources={
                  props.fastaSettings?.dataSources
                    ? props.fastaSettings?.dataSources
                    : inputRawReads.fastaInput.dataSources
                }
                fileTypes={
                  props.fastaSettings?.fileTypes
                    ? props.fastaSettings?.fileTypes
                    : inputRawReads.fastaInput.fileTypes
                }
                projectTypes={
                  props.fastaSettings?.projectTypes ? props.fastaSettings?.projectTypes : null
                }
                projectScope={
                  props.fastaSettings?.projectTypes
                    ? props.fastaSettings?.projectTypes
                    : inputRawReads.fastaInput.projectTypes
                }
                viewFile={
                  props.fastaSettings?.viewFile
                    ? props.fastaSettings?.viewFile
                    : inputRawReads.fastaInput.viewFile
                }
                isOptional={
                  props.fastaSettings?.isOptional
                    ? props.fastaSettings?.isOptional
                    : inputRawReads.fastaInput.isOptional
                }
                cleanupInput={
                  props.fastaSettings?.cleanupInput
                    ? props.fastaSettings?.cleanupInput
                    : inputRawReads.fastaInput.cleanupInput
                }
                maxInput={
                  props.fastaSettings?.maxInput
                    ? props.fastaSettings?.maxInput
                    : inputRawReads.fastaInput.maxInput
                }
              />
            </>
          )}
          {form.inputs['source'].value === 'sra' && (
            <>
              <SRAAccessionInput
                name={'inputFiles'}
                setParams={setSRAccessionInput}
                reset={reset}
              />
              <HtmlText text={inputRawReads.sraInput.note} />
              <br></br>
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
