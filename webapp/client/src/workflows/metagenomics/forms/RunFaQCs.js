import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput } from 'src/edge/common/util'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { RangeInput } from 'src/edge/project/forms/RangeInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { FileInput } from 'src/edge/project/forms/FileInput'
import { IntegerInput } from 'src/edge/project/forms/IntegerInput'
import { workflows } from '../defaults'

export const RunFaQCs = (props) => {
  const workflowName = 'runFaQCs'
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
      if (form.inputs['artifactFile'].value) {
        inputFiles.push(form.inputs['artifactFile'].value)
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
          <RangeInput
            name={'trimQual'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['trimQual'].text}
            tooltip={workflows[workflowName].inputs['trimQual'].tooltip}
            defaultValue={workflows[workflowName].inputs['trimQual']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['trimQual']['rangeInput'].min}
            max={workflows[workflowName].inputs['trimQual']['rangeInput'].max}
            step={workflows[workflowName].inputs['trimQual']['rangeInput'].step}
          />
          <br></br>
          <RangeInput
            name={'trim5end'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['trim5end'].text}
            tooltip={workflows[workflowName].inputs['trim5end'].tooltip}
            defaultValue={workflows[workflowName].inputs['trim5end']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['trim5end']['rangeInput'].min}
            max={workflows[workflowName].inputs['trim5end']['rangeInput'].max}
            step={workflows[workflowName].inputs['trim5end']['rangeInput'].step}
          />
          <br></br>
          <RangeInput
            name={'trim3end'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['trim3end'].text}
            tooltip={workflows[workflowName].inputs['trim3end'].tooltip}
            defaultValue={workflows[workflowName].inputs['trim3end']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['trim3end']['rangeInput'].min}
            max={workflows[workflowName].inputs['trim3end']['rangeInput'].max}
            step={workflows[workflowName].inputs['trim3end']['rangeInput'].step}
          />
          <br></br>
          <Switcher
            id={'trimAdapter'}
            name={'trimAdapter'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['trimAdapter'].text}
            tooltip={workflows[workflowName].inputs['trimAdapter'].tooltip}
            defaultValue={workflows[workflowName].inputs['trimAdapter']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['trimAdapter']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['trimAdapter']['switcher'].falseText}
          />
          <br></br>
          <RangeInput
            name={'trimRate'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['trimRate'].text}
            tooltip={workflows[workflowName].inputs['trimRate'].tooltip}
            defaultValue={workflows[workflowName].inputs['trimRate']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['trimRate']['rangeInput'].min}
            max={workflows[workflowName].inputs['trimRate']['rangeInput'].max}
            step={workflows[workflowName].inputs['trimRate']['rangeInput'].step}
          />
          <br></br>
          <Switcher
            id={'trimPolyA'}
            name={'trimPolyA'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['trimPolyA'].text}
            tooltip={workflows[workflowName].inputs['trimPolyA'].tooltip}
            defaultValue={workflows[workflowName].inputs['trimPolyA']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['trimPolyA']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['trimPolyA']['switcher'].falseText}
          />
          <br></br>
          <FileInput
            name={'artifactFile'}
            setParams={setFileInput}
            isValidFileInput={isValidFileInput}
            text={workflows[workflowName].inputs['artifactFile'].text}
            tooltip={workflows[workflowName].inputs['artifactFile'].tooltip}
            enableInput={workflows[workflowName].inputs['artifactFile']['fileInput'].enableInput}
            placeholder={workflows[workflowName].inputs['artifactFile']['fileInput'].placeholder}
            dataSources={workflows[workflowName].inputs['artifactFile']['fileInput'].dataSources}
            fileTypes={workflows[workflowName].inputs['artifactFile']['fileInput'].fileTypes}
            viewFile={workflows[workflowName].inputs['artifactFile']['fileInput'].viewFile}
            isOptional={workflows[workflowName].inputs['artifactFile']['fileInput'].isOptional}
            cleanupInput={workflows[workflowName].inputs['artifactFile']['fileInput'].cleanupInput}
          />
          <br></br>
          <IntegerInput
            name={'minLen'}
            setParams={setIntegerInput}
            text={workflows[workflowName].inputs['minLen'].text}
            tooltip={workflows[workflowName].inputs['minLen'].tooltip}
            defaultValue={workflows[workflowName].inputs['minLen']['integerInput'].defaultValue}
            min={workflows[workflowName].inputs['minLen']['integerInput'].min}
            max={workflows[workflowName].inputs['minLen']['integerInput'].max}
          />
          <br></br>
          <RangeInput
            name={'avgQual'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['avgQual'].text}
            tooltip={workflows[workflowName].inputs['avgQual'].tooltip}
            defaultValue={workflows[workflowName].inputs['avgQual']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['avgQual']['rangeInput'].min}
            max={workflows[workflowName].inputs['avgQual']['rangeInput'].max}
            step={workflows[workflowName].inputs['avgQual']['rangeInput'].step}
          />
          <br></br>
          <RangeInput
            name={'numN'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['numN'].text}
            tooltip={workflows[workflowName].inputs['numN'].tooltip}
            defaultValue={workflows[workflowName].inputs['numN']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['numN']['rangeInput'].min}
            max={workflows[workflowName].inputs['numN']['rangeInput'].max}
            step={workflows[workflowName].inputs['numN']['rangeInput'].step}
          />
          <br></br>
          <RangeInput
            name={'filtLC'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['filtLC'].text}
            tooltip={workflows[workflowName].inputs['filtLC'].tooltip}
            defaultValue={workflows[workflowName].inputs['filtLC']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['filtLC']['rangeInput'].min}
            max={workflows[workflowName].inputs['filtLC']['rangeInput'].max}
            step={workflows[workflowName].inputs['filtLC']['rangeInput'].step}
          />
          <br></br>
          <Switcher
            id={'filtPhiX'}
            name={'filtPhiX'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['filtPhiX'].text}
            tooltip={workflows[workflowName].inputs['filtPhiX'].tooltip}
            defaultValue={workflows[workflowName].inputs['filtPhiX']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['filtPhiX']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['filtPhiX']['switcher'].falseText}
          />
          <br></br>
        </CardBody>
      </Collapse>
    </Card>
  )
}
