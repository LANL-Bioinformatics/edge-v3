import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { IntegerInput } from 'src/edge/project/forms/IntegerInput'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { RangeInput } from 'src/edge/project/forms/RangeInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { workflows } from './defaults'

export const Binning = (props) => {
  const workflowName = 'binning'
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
    form.paramsOn = props.paramsOn !== undefined ? props.paramsOn : true
    setDoValidation(doValidation + 1)
  }, [props.paramsOn]) // eslint-disable-line react-hooks/exhaustive-deps

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
      <Collapse
        isOpen={!collapseParms && form.paramsOn && !props.disabled}
        id={'collapseParameters-' + props.name}
      >
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
