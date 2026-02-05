/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput } from 'src/edge/common/util'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { FileInputArray } from 'src/edge/project/forms/FileInputArray'
import { IntegerInput } from 'src/edge/project/forms/IntegerInput'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { AsyncSelectInput } from 'src/edge/project/forms/AsyncSelectInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { TextInput } from 'src/edge/project/forms/TextInput'
import { RangeInput } from 'src/edge/project/forms/RangeInput'
import { workflows } from '../defaults'

export const RefBased = (props) => {
  const workflowName = 'refBased'
  const [collapseParms, setCollapseParms] = useState(false)
  const [form] = useState({ ...workflows[workflowName] })
  const [validInputs] = useState({ ...workflows[workflowName].validInputs })
  const [resetGenomeSelect, setResetGenomeSelect] = useState(0)
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

  const checkGenomeValidInputs = () => {
    if (form.inputs['selectGenomes'].value.length === 0 && form.inputs['referenceGenomes'].value.length === 0) {
      validInputs['selectGenomes'].isValid = false
    } else {
      validInputs['selectGenomes'].isValid = true
    }
  }

  const SetAsyncSelectInput = (inForm, name) => {
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }

    form.inputs[name].value = inForm.selections.map((item) => {
      return item.value
    })
    form.inputs[name].display = inForm.selections.map((item) => {
      return item.label
    })
    checkGenomeValidInputs()
    setDoValidation(doValidation + 1)
  }

  const setRangeInput = (inForm, name) => {
    form.inputs[name].value = inForm.rangeInput
    setDoValidation(doValidation + 1)
  }

  const setSwitcher = (inForm, name) => {
    form.inputs[name].value = inForm.isTrue
    if (name === 'r2gGetConsensus') {
      //reset validInputs
      validInputs['r2gConsensusMaxCov'].isValid = true
    }
    setDoValidation(doValidation + 1)
  }

  const setFileInput = (inForm, name) => {
    form.inputs[name].value = inForm.fileInput
    form.inputs[name].display = inForm.fileInput_display
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    checkGenomeValidInputs()
    setDoValidation(doValidation + 1)
  }

  const setTextInput = (inForm, name) => {
    form.inputs[name].value = inForm.textInput
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setVariantCallRangeInput = (inForm, name) => {
    form.r2gVariantCallInputs[name].value = inForm.rangeInput
    setDoValidation(doValidation + 1)
  }

  const setVariantCallOption = (inForm, name) => {
    form.r2gVariantCallInputs[name].value = inForm.option
    form.r2gVariantCallInputs[name].display = inForm.display
    setDoValidation(doValidation + 1)
  }

  const setGetConsensusRangeInput = (inForm, name) => {
    form.r2gGetConsensusInputs[name].value = inForm.rangeInput
    setDoValidation(doValidation + 1)
  }
  const setGetConsensusSwitcher = (inForm, name) => {
    form.r2gGetConsensusInputs[name].value = inForm.isTrue
    setDoValidation(doValidation + 1)
  }

  const setGetConsensusIntegerInput = (inForm, name) => {
    form.r2gGetConsensusInputs[name].value = inForm.integerInput
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
      form.files = form.inputs['referenceGenomes'].value
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
          <span className="text-muted edge-text-size-small">
            Given one or multiple reference genome FASTA files, EDGE will turn on the analysis of the reads/contigs mapping to reference and JBrowse reference track generation. Given a reference genome genbank file, EDGE will also turn on variant analysis.
          </span>
          <br></br>
          <AsyncSelectInput
            name={'selectGenomes'}
            text={workflows[workflowName].inputs['selectGenomes'].text}
            tooltip={workflows[workflowName].inputs['selectGenomes'].tooltip}
            placeholder={
              workflows[workflowName].inputs['selectGenomes']['asyncSelectInput'].placeholder
            }
            isMulti={true}
            min={workflows[workflowName].inputs['selectGenomes']['asyncSelectInput'].min}
            max={workflows[workflowName].inputs['selectGenomes']['asyncSelectInput'].max}
            maxOptions={workflows[workflowName].inputs['selectGenomes']['asyncSelectInput'].maxOptions}
            options={props.refGenomeOptions}
            setParams={SetAsyncSelectInput}
            showSelections={true}
            showSelectionsText={'genome(s) selected'}
          />
          <br></br>
          <center>And/Or</center>
          <br></br>
          <FileInputArray
            setParams={setFileInput}
            name={'referenceGenomes'}
            isValidFileInput={
              props.isValidFileInput ? props.isValidFileInput : isValidFileInput
            }
            mainText={workflows[workflowName].inputs['referenceGenomes'].text}
            note={workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].note}
            text={workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].text}
            tooltip={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].tooltip
            }
            enableInput={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].enableInput
            }
            placeholder={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].placeholder
            }
            dataSources={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].dataSources
            }
            fileTypes={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].fileTypes
            }
            projectTypes={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].projectTypes
                ? workflows[workflowName].inputs['referenceGenomes']['fileInputArray']
                  .projectTypes
                : null
            }
            projectScope={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].projectTypes
            }
            viewFile={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].viewFile
                ? workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].viewFile
                : false
            }
            isOptional={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].isOptional
            }
            cleanupInput={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].cleanupInput
            }
            maxInput={
              workflows[workflowName].inputs['referenceGenomes']['fileInputArray'].maxInput
            }
            reset={resetGenomeSelect}
          />
          <br></br>
          <OptionSelector
            name={'r2gAligner'}
            setParams={setOption}
            text={workflows[workflowName].inputs['r2gAligner'].text}
            tooltip={workflows[workflowName].inputs['r2gAligner'].tooltip}
            options={workflows[workflowName].inputs['r2gAligner'].options}
            defaultValue={form.inputs['r2gAligner'].value}
          />
          <br></br>
          <TextInput
            name={'r2gAlignerOptions'}
            setParams={setTextInput}
            text={workflows[workflowName].inputs['r2gAlignerOptions'].text}
            tooltip={workflows[workflowName].inputs['r2gAlignerOptions'].tooltip}
            tooltipClickable={true}
            defaultValue={
              workflows[workflowName].inputs['r2gAlignerOptions']['textInput'].defaultValue
            }
            placeholder={workflows[workflowName].inputs['r2gAlignerOptions']['textInput'].placeholder}
            isOptional={workflows[workflowName].inputs['r2gAlignerOptions']['textInput'].isOptional}
          />
          <br></br>
          <RangeInput
            name={'r2gMinMapQual'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['r2gMinMapQual'].text}
            tooltip={workflows[workflowName].inputs['r2gMinMapQual'].tooltip}
            defaultValue={workflows[workflowName].inputs['r2gMinMapQual']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['r2gMinMapQual']['rangeInput'].min}
            max={workflows[workflowName].inputs['r2gMinMapQual']['rangeInput'].max}
            step={workflows[workflowName].inputs['r2gMinMapQual']['rangeInput'].step}
          />
          <br></br>
          <RangeInput
            name={'r2gMaxClip'}
            setParams={setRangeInput}
            text={workflows[workflowName].inputs['r2gMaxClip'].text}
            tooltip={workflows[workflowName].inputs['r2gMaxClip'].tooltip}
            defaultValue={workflows[workflowName].inputs['r2gMaxClip']['rangeInput'].defaultValue}
            min={workflows[workflowName].inputs['r2gMaxClip']['rangeInput'].min}
            max={workflows[workflowName].inputs['r2gMaxClip']['rangeInput'].max}
            step={workflows[workflowName].inputs['r2gMaxClip']['rangeInput'].step}
          />
          <br></br>
          <Switcher
            id={'r2gVariantCall'}
            name={'r2gVariantCall'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['r2gVariantCall'].text}
            tooltip={workflows[workflowName].inputs['r2gVariantCall'].tooltip}
            tooltipClickable={true}
            defaultValue={workflows[workflowName].inputs['r2gVariantCall']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['r2gVariantCall']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['r2gVariantCall']['switcher'].falseText}
          />
          <br></br>
          {form.inputs['r2gVariantCall'].value &&
            <>
              <RangeInput
                name={'r2gVariantCallMinQual'}
                setParams={setVariantCallRangeInput}
                text={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallMinQual'].text}
                tooltip={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallMinQual'].tooltip}
                defaultValue={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallMinQual']['rangeInput'].defaultValue}
                min={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallMinQual']['rangeInput'].min}
                max={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallMinQual']['rangeInput'].max}
                step={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallMinQual']['rangeInput'].step}
              />
              <br></br>
              <OptionSelector
                name={'r2gVariantCallPloidy'}
                setParams={setVariantCallOption}
                text={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallPloidy'].text}
                tooltip={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallPloidy'].tooltip}
                options={workflows[workflowName].r2gVariantCallInputs['r2gVariantCallPloidy'].options}
                defaultValue={form.r2gVariantCallInputs['r2gVariantCallPloidy'].value}
                display={form.r2gVariantCallInputs['r2gVariantCallPloidy'].display}
              />
              <br></br>
            </>}
          <Switcher
            id={'r2gMapUnmapped'}
            name={'r2gMapUnmapped'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['r2gMapUnmapped'].text}
            tooltip={workflows[workflowName].inputs['r2gMapUnmapped'].tooltip}
            tooltipClickable={true}
            defaultValue={workflows[workflowName].inputs['r2gMapUnmapped']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['r2gMapUnmapped']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['r2gMapUnmapped']['switcher'].falseText}
          />
          <br></br>
          <Switcher
            id={'r2gExtractMapped'}
            name={'r2gExtractMapped'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['r2gExtractMapped'].text}
            tooltip={workflows[workflowName].inputs['r2gExtractMapped'].tooltip}
            tooltipClickable={true}
            defaultValue={workflows[workflowName].inputs['r2gExtractMapped']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['r2gExtractMapped']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['r2gExtractMapped']['switcher'].falseText}
          />
          <br></br>
          <Switcher
            id={'r2gExtractUnmapped'}
            name={'r2gExtractUnmapped'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['r2gExtractUnmapped'].text}
            tooltip={workflows[workflowName].inputs['r2gExtractUnmapped'].tooltip}
            tooltipClickable={true}
            defaultValue={workflows[workflowName].inputs['r2gExtractUnmapped']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['r2gExtractUnmapped']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['r2gExtractUnmapped']['switcher'].falseText}
          />
          <br></br>
          <Switcher
            id={'r2gGetConsensus'}
            name={'r2gGetConsensus'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['r2gGetConsensus'].text}
            tooltip={workflows[workflowName].inputs['r2gGetConsensus'].tooltip}
            tooltipClickable={true}
            defaultValue={workflows[workflowName].inputs['r2gGetConsensus']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['r2gGetConsensus']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['r2gGetConsensus']['switcher'].falseText}
          />
          <br></br>
          {form.inputs['r2gGetConsensus'].value &&
            <>
              <RangeInput
                name={'r2gConsensusMinMapQual'}
                setParams={setGetConsensusRangeInput}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinMapQual'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinMapQual'].tooltip}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinMapQual']['rangeInput'].defaultValue}
                min={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinMapQual']['rangeInput'].min}
                max={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinMapQual']['rangeInput'].max}
                step={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinMapQual']['rangeInput'].step}
              />
              <br></br>
              <RangeInput
                name={'r2gConsensusMinCov'}
                setParams={setGetConsensusRangeInput}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinCov'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinCov'].tooltip}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinCov']['rangeInput'].defaultValue}
                min={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinCov']['rangeInput'].min}
                max={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinCov']['rangeInput'].max}
                step={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinCov']['rangeInput'].step}
              />
              <br></br>
              <IntegerInput
                name={'r2gConsensusMaxCov'}
                setParams={setGetConsensusIntegerInput}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMaxCov'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMaxCov'].tooltip}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMaxCov']['integerInput'].defaultValue}
                min={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMaxCov']['integerInput'].min}
                max={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMaxCov']['integerInput'].max}
              />
              <br></br>
              <RangeInput
                name={'r2gConsensusAltProp'}
                setParams={setGetConsensusRangeInput}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltProp'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltProp'].tooltip}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltProp']['rangeInput'].defaultValue}
                min={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltProp']['rangeInput'].min}
                max={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltProp']['rangeInput'].max}
                step={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltProp']['rangeInput'].step}
              />
              <br></br>
              <RangeInput
                name={'r2gConsensusAltIndelProp'}
                setParams={setGetConsensusRangeInput}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltIndelProp'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltIndelProp'].tooltip}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltIndelProp']['rangeInput'].defaultValue}
                min={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltIndelProp']['rangeInput'].min}
                max={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltIndelProp']['rangeInput'].max}
                step={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusAltIndelProp']['rangeInput'].step}
              />
              <br></br>
              <RangeInput
                name={'r2gConsensusMinBaseQual'}
                setParams={setGetConsensusRangeInput}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinBaseQual'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinBaseQual'].tooltip}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinBaseQual']['rangeInput'].defaultValue}
                min={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinBaseQual']['rangeInput'].min}
                max={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinBaseQual']['rangeInput'].max}
                step={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusMinBaseQual']['rangeInput'].step}
              />
              <br></br>
              <Switcher
                id={'r2gConsensusDisableBAQ'}
                name={'r2gConsensusDisableBAQ'}
                setParams={setGetConsensusSwitcher}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusDisableBAQ'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusDisableBAQ'].tooltip}
                tooltipClickable={true}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusDisableBAQ']['switcher'].defaultValue}
                trueText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusDisableBAQ']['switcher'].trueText}
                falseText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusDisableBAQ']['switcher'].falseText}
              />
              <br></br>
              <Switcher
                id={'r2gConsensusPCRdedup'}
                name={'r2gConsensusPCRdedup'}
                setParams={setGetConsensusSwitcher}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusPCRdedup'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusPCRdedup'].tooltip}
                tooltipClickable={true}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusPCRdedup']['switcher'].defaultValue}
                trueText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusPCRdedup']['switcher'].trueText}
                falseText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusPCRdedup']['switcher'].falseText}
              />
              <br></br>
              <Switcher
                id={'r2gConsensusHomopolymerFilt'}
                name={'r2gConsensusHomopolymerFilt'}
                setParams={setGetConsensusSwitcher}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusHomopolymerFilt'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusHomopolymerFilt'].tooltip}
                tooltipClickable={true}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusHomopolymerFilt']['switcher'].defaultValue}
                trueText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusHomopolymerFilt']['switcher'].trueText}
                falseText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusHomopolymerFilt']['switcher'].falseText}
              />
              <br></br>
              <Switcher
                id={'r2gConsensusStrandBiasFilt'}
                name={'r2gConsensusStrandBiasFilt'}
                setParams={setGetConsensusSwitcher}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusStrandBiasFilt'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusStrandBiasFilt'].tooltip}
                tooltipClickable={true}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusStrandBiasFilt']['switcher'].defaultValue}
                trueText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusStrandBiasFilt']['switcher'].trueText}
                falseText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusStrandBiasFilt']['switcher'].falseText}
              />
              <br></br>
              <Switcher
                id={'r2gConsensusVarlogOpt'}
                name={'r2gConsensusVarlogOpt'}
                setParams={setGetConsensusSwitcher}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusVarlogOpt'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusVarlogOpt'].tooltip}
                tooltipClickable={true}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusVarlogOpt']['switcher'].defaultValue}
                trueText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusVarlogOpt']['switcher'].trueText}
                falseText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusVarlogOpt']['switcher'].falseText}
              />
              <br></br>
              <Switcher
                id={'r2gConsensusCompOpt'}
                name={'r2gConsensusCompOpt'}
                setParams={setGetConsensusSwitcher}
                text={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusCompOpt'].text}
                tooltip={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusCompOpt'].tooltip}
                tooltipClickable={true}
                defaultValue={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusCompOpt']['switcher'].defaultValue}
                trueText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusCompOpt']['switcher'].trueText}
                falseText={workflows[workflowName].r2gGetConsensusInputs['r2gConsensusCompOpt']['switcher'].falseText}
              />
              <br></br>
            </>}
        </CardBody>
      </Collapse>
    </Card>
  )
}
