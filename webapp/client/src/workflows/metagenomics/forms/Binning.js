import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput } from 'src/edge/common/util'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { FileInput } from 'src/edge/project/forms/FileInput'
import { IntegerInput } from 'src/edge/project/forms/IntegerInput'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { RangeInput } from 'src/edge/project/forms/RangeInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { workflows } from '../defaults'

export const Binning = (props) => {
  const workflowName = 'binning'
  const [collapseParms, setCollapseParms] = useState(false)
  const [form] = useState({ ...workflows[workflowName] })
  const [validInputs] = useState({ ...workflows[workflowName].validInputs })
  const [doValidation, setDoValidation] = useState(0)

  const toggleParms = () => {
    setCollapseParms(!collapseParms)
  }

  const setOnoff = (onoff) => {
    if (onoff) {
      setCollapseParms(false)
    } else {
      setCollapseParms(true)
    }
    form.paramsOn = onoff
    setDoValidation(doValidation + 1)
  }

  const setOption = (inForm, name) => {
    form.inputs[name].value = inForm.option
    form.inputs[name].display = inForm.display
    setDoValidation(doValidation + 1)
  }

  const setRangeInput = (inForm, name) => {
    form.inputs[name].value = inForm.rangeInput
    setDoValidation(doValidation + 1)
  }

  const setIntegerInput = (inForm, name) => {
    form.inputs[name].value = inForm.integerInput
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setSwitcher = (inForm, name) => {
    form.inputs[name].value = inForm.isTrue
    setDoValidation(doValidation + 1)
  }

  const setFileInput = (inForm, name) => {
    form.inputs[name].value = inForm.fileInput
    form.inputs[name].display = inForm.fileInput_display
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  useEffect(() => {
    form.paramsOn = props.paramsOn ? props.paramsOn : true
  }, [props.paramsOn]) // eslint-disable-line react-hooks/exhaustive-deps

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
      if (form.inputs['binningAbundFile'].value) {
        inputFiles.push(form.inputs['binningAbundFile'].value)
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
        id={workflowName + 'input'}
        isValid={props.isValid}
        errMessage={props.errMessage}
        onoff={props.onoff}
        paramsOn={form.paramsOn}
        setOnoff={setOnoff}
      />
      <Collapse isOpen={!collapseParms && form.paramsOn} id={'collapseParameters-' + props.name}>
        <CardBody style={props.disabled ? { pointerEvents: 'none', opacity: '0.4' } : {}}>
          <IntegerInput
            name={'binningMinLength'}
            setParams={setIntegerInput}
            text={workflows[workflowName].inputs['binningMinLength'].text}
            tooltip={workflows[workflowName].inputs['binningMinLength'].tooltip}
            defaultValue={
              workflows[workflowName].inputs['binningMinLength']['integerInput'].defaultValue
            }
            min={workflows[workflowName].inputs['binningMinLength']['integerInput'].min}
            max={workflows[workflowName].inputs['binningMinLength']['integerInput'].max}
          />
          <br></br>
          <RangeInput
            name={'binningMaxItr'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['binningMaxItr'].text}
            tooltip={workflows[workflowName].inputs['binningMaxItr'].tooltip}
            defaultValue={
              workflows[workflowName].inputs['binningMaxItr']['rangeInput'].defaultValue
            }
            min={workflows[workflowName].inputs['binningMaxItr']['rangeInput'].min}
            max={workflows[workflowName].inputs['binningMaxItr']['rangeInput'].max}
            step={workflows[workflowName].inputs['binningMaxItr']['rangeInput'].step}
          />
          <br></br>
          <RangeInput
            name={'binningProb'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['binningProb'].text}
            tooltip={workflows[workflowName].inputs['binningProb'].tooltip}
            defaultValue={workflows[workflowName].inputs['binningProb']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['binningProb']['rangeInput'].min}
            max={workflows[workflowName].inputs['binningProb']['rangeInput'].max}
            step={workflows[workflowName].inputs['binningProb']['rangeInput'].step}
          />
          <br></br>
          <OptionSelector
            name={'binningMarkerSet'}
            setParams={setOption}
            text={workflows[workflowName].inputs['binningMarkerSet'].text}
            tooltip={workflows[workflowName].inputs['binningMarkerSet'].tooltip}
            options={workflows[workflowName].inputs['binningMarkerSet'].options}
            defaultValue={form.inputs['binningMarkerSet'].value}
            display={form.inputs['binningMarkerSet'].display}
          />
          <br></br>
          <FileInput
            name={'binningAbundFile'}
            setParams={setFileInput}
            isValidFileInput={isValidFileInput}
            text={workflows[workflowName].inputs['binningAbundFile'].text}
            tooltip={workflows[workflowName].inputs['binningAbundFile'].tooltip}
            enableInput={
              workflows[workflowName].inputs['binningAbundFile']['fileInput'].enableInput
            }
            placeholder={
              workflows[workflowName].inputs['binningAbundFile']['fileInput'].placeholder
            }
            dataSources={
              workflows[workflowName].inputs['binningAbundFile']['fileInput'].dataSources
            }
            fileTypes={workflows[workflowName].inputs['binningAbundFile']['fileInput'].fileTypes}
            viewFile={workflows[workflowName].inputs['binningAbundFile']['fileInput'].viewFile}
            isOptional={workflows[workflowName].inputs['binningAbundFile']['fileInput'].isOptional}
            cleanupInput={
              workflows[workflowName].inputs['binningAbundFile']['fileInput'].cleanupInput
            }
          />
          <br></br>
          <Switcher
            id={'doCheckM'}
            name={'doCheckM'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['doCheckM'].text}
            tooltip={workflows[workflowName].inputs['doCheckM'].tooltip}
            defaultValue={workflows[workflowName].inputs['doCheckM']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['doCheckM']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['doCheckM']['switcher'].falseText}
          />
          <br></br>
        </CardBody>
      </Collapse>
    </Card>
  )
}
