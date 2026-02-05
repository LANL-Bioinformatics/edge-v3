import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput, isValidEvalue } from 'src/edge/common/util'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { FileInput } from 'src/edge/project/forms/FileInput'
import { IntegerInput } from 'src/edge/project/forms/IntegerInput'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { RangeInput } from 'src/edge/project/forms/RangeInput'
import { TextInput } from 'src/edge/project/forms/TextInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { workflows } from '../defaults'

export const Annotation = (props) => {
  const workflowName = 'annotation'
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
    form.annotateProgramInputs[form.inputs['annotateProgram'].value][name].value = inForm.rangeInput
    setDoValidation(doValidation + 1)
  }
  const setMainOption = (inForm, name) => {
    form.inputs[name].value = inForm.option
    form.inputs[name].display = inForm.display
    setDoValidation(doValidation + 1)
  }
  const setOption = (inForm, name) => {
    form.annotateProgramInputs[form.inputs['annotateProgram'].value][name].value = inForm.option
    form.annotateProgramInputs[form.inputs['annotateProgram'].value][name].display = inForm.display
      ? inForm.display
      : inForm.option
    setDoValidation(doValidation + 1)
  }

  const setMainIntegerInput = (inForm, name) => {
    //console.log(inForm, name)
    form.inputs[name].value = inForm.integerInput
    if (validInputs[form.inputs['annotateProgram'].value][name]) {
      validInputs[form.inputs['annotateProgram'].value][name].isValid = inForm.validForm
    }
    if (name === 'minContigSize') {
      //set all annotatePrograms
      Object.keys(validInputs).forEach((key) => {
        validInputs[key][name].isValid = inForm.validForm
      })
    }
    setDoValidation(doValidation + 1)
  }

  const setSwitcher = (inForm, name) => {
    form.annotateProgramInputs[form.inputs['annotateProgram'].value][name].value = inForm.isTrue
    setDoValidation(doValidation + 1)
  }

  const setFileInput = (inForm, name) => {
    form.annotateProgramInputs[form.inputs['annotateProgram'].value][name].value = inForm.fileInput
    form.annotateProgramInputs[form.inputs['annotateProgram'].value][name].display =
      inForm.fileInput_display
    if (validInputs[form.inputs['annotateProgram'].value][name]) {
      validInputs[form.inputs['annotateProgram'].value][name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }
  const setTextInput = (inForm, name) => {
    form.annotateProgramInputs[form.inputs['annotateProgram'].value][name].value = inForm.textInput
    if (validInputs[form.inputs['annotateProgram'].value][name]) {
      validInputs[form.inputs['annotateProgram'].value][name].isValid = inForm.validForm
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

  // set default gcode based on taxKingdom
  //archaea, bacteria, mitochondria, viruses, metagenome
  useEffect(() => {
    form.annotateProgramInputs.prokka.gcode.value =
      // eslint-disable-next-line prettier/prettier
      form.annotateProgramInputs.prokka.taxKingdom.gcodes[form.annotateProgramInputs.prokka.taxKingdom.value]
    setDoValidation(doValidation + 1)
  }, [form.annotateProgramInputs.prokka.taxKingdom.value])

  //trigger validation method when input changes
  useEffect(() => {
    // check input errors
    let errors = ''
    Object.keys(validInputs[form.inputs['annotateProgram'].value]).forEach((key) => {
      if (!validInputs[form.inputs['annotateProgram'].value][key].isValid) {
        errors += validInputs[form.inputs['annotateProgram'].value][key].error + '<br/>'
      }
    })

    if (errors === '') {
      //files for server to caculate total input size
      let inputFiles = []
      if (
        form.inputs['annotateProgram'].value === 'prokka' &&
        form.annotateProgramInputs[form.inputs['annotateProgram'].value]['customProtein'].value
      ) {
        inputFiles.push(
          form.annotateProgramInputs[form.inputs['annotateProgram'].value]['customProtein'].value,
        )
      }
      if (
        form.inputs['annotateProgram'].value === 'prokka' &&
        form.annotateProgramInputs[form.inputs['annotateProgram'].value]['customHMM'].value
      ) {
        inputFiles.push(
          form.annotateProgramInputs[form.inputs['annotateProgram'].value]['customHMM'].value,
        )
      }
      if (
        form.inputs['annotateProgram'].value === 'ratt' &&
        form.annotateProgramInputs[form.inputs['annotateProgram'].value]['sourceGBK'].value
      ) {
        inputFiles.push(
          form.annotateProgramInputs[form.inputs['annotateProgram'].value]['sourceGBK'].value,
        )
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
            name={'minContigSize'}
            setParams={setMainIntegerInput}
            text={workflows[workflowName].inputs['minContigSize'].text}
            tooltip={workflows[workflowName].inputs['minContigSize'].tooltip}
            defaultValue={
              workflows[workflowName].inputs['minContigSize']['integerInput'].defaultValue
            }
            min={workflows[workflowName].inputs['minContigSize']['integerInput'].min}
            max={workflows[workflowName].inputs['minContigSize']['integerInput'].max}
          />
          <br></br>
          <OptionSelector
            name={'annotateProgram'}
            setParams={setMainOption}
            text={workflows[workflowName].inputs['annotateProgram'].text}
            tooltip={workflows[workflowName].inputs['annotateProgram'].tooltip}
            options={workflows[workflowName].inputs['annotateProgram'].options}
            defaultValue={form.inputs['annotateProgram'].value}
            display={form.inputs['annotateProgram'].display}
          />
          <br></br>
          {form.inputs['annotateProgram'].value === 'prokka' && (
            <>
              <OptionSelector
                name={'taxKingdom'}
                setParams={setOption}
                text={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['taxKingdom'].text
                }
                tooltip={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['taxKingdom'].tooltip
                }
                options={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['taxKingdom'].options
                }
                defaultValue={
                  form.annotateProgramInputs[form.inputs['annotateProgram'].value]['taxKingdom']
                    .value
                }
                display={
                  form.annotateProgramInputs[form.inputs['annotateProgram'].value]['taxKingdom']
                    .display
                }
              />
              <br></br>
              <RangeInput
                name={'gcode'}
                setParams={setRangeInput}
                text={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['gcode'].text
                }
                defaultValue={form.annotateProgramInputs.prokka.gcode.value}
                min={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['gcode']['rangeInput'].min
                }
                max={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['gcode']['rangeInput'].max
                }
                step={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['gcode']['rangeInput'].step
                }
              />
              <br></br>
              <FileInput
                name={'customProtein'}
                setParams={setFileInput}
                isValidFileInput={isValidFileInput}
                text={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein'].text
                }
                tooltip={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein'].tooltip
                }
                enableInput={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein']['fileInput'].enableInput
                }
                placeholder={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein']['fileInput'].placeholder
                }
                dataSources={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein']['fileInput'].dataSources
                }
                fileTypes={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein']['fileInput'].fileTypes
                }
                viewFile={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein']['fileInput'].viewFile
                }
                isOptional={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein']['fileInput'].isOptional
                }
                cleanupInput={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customProtein']['fileInput'].cleanupInput
                }
              />
              <br></br>
              <FileInput
                name={'customHMM'}
                setParams={setFileInput}
                isValidFileInput={isValidFileInput}
                text={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM'].text
                }
                tooltip={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM'].tooltip
                }
                enableInput={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM']['fileInput'].enableInput
                }
                placeholder={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM']['fileInput'].placeholder
                }
                dataSources={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM']['fileInput'].dataSources
                }
                fileTypes={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM']['fileInput'].fileTypes
                }
                viewFile={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM']['fileInput'].viewFile
                }
                isOptional={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM']['fileInput'].isOptional
                }
                cleanupInput={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['customHMM']['fileInput'].cleanupInput
                }
              />
              <br></br>
              <TextInput
                name={'evalue'}
                setParams={setTextInput}
                text={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['evalue'].text
                }
                tooltip={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['evalue'].tooltip
                }
                defaultValue={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['evalue']['textInput'].defaultValue
                }
                placeholder={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['evalue']['textInput'].placeholder
                }
                isOptional={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['evalue']['textInput'].isOptional
                }
                errMessage={'Invalid evalue'}
                showErrorTooltip={true}
                isValidTextInput={isValidEvalue}
              />
              <br></br>
              <Switcher
                id={'keggView'}
                name={'keggView'}
                setParams={setSwitcher}
                text={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['keggView'].text
                }
                tooltip={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['keggView'].tooltip
                }
                defaultValue={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['keggView']['switcher'].defaultValue
                }
                trueText={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['keggView']['switcher'].trueText
                }
                falseText={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['keggView']['switcher'].falseText
                }
              />
              <br></br>
            </>
          )}
          {form.inputs['annotateProgram'].value === 'ratt' && (
            <>
              <FileInput
                name={'sourceGBK'}
                setParams={setFileInput}
                isValidFileInput={isValidFileInput}
                text={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK'].text
                }
                tooltip={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK'].tooltip
                }
                enableInput={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK']['fileInput'].enableInput
                }
                placeholder={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK']['fileInput'].placeholder
                }
                dataSources={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK']['fileInput'].dataSources
                }
                fileTypes={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK']['fileInput'].fileTypes
                }
                viewFile={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK']['fileInput'].viewFile
                }
                isOptional={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK']['fileInput'].isOptional
                }
                cleanupInput={
                  workflows[workflowName].annotateProgramInputs[
                    form.inputs['annotateProgram'].value
                  ]['sourceGBK']['fileInput'].cleanupInput
                }
              />
              <br></br>
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
