import React, { useState, useEffect } from 'react'
import { MyTooltip } from '../../common/MyTooltip'
import { defaults, capitalizeFirstLetter } from '../../common/util'
import { Switcher } from './Switcher'
import { FileInputArray } from './FileInputArray'
import { PairedFileInputArray } from './PairedFileInputArray'
import { components } from './defaults'
import { OptionSelector } from './OptionSelector'

export const FastqInput = (props) => {
  const componentName = 'fastqInput'
  const [form, setState] = useState({
    ...components[componentName].init,
    platform: props.seqPlatformDefaultValue,
  })
  const [doValidation, setDoValidation] = useState(0)

  const setNewState2 = (name, value) => {
    setState({
      ...form,
      [name]: value,
    })
    setDoValidation(doValidation + 1)
  }
  const setSwitcher = (inForm, name) => {
    setNewState2(name, inForm.isTrue)
  }
  const setPlatform = (inForm, name) => {
    if (inForm.option.toLowerCase() !== 'illumina') {
      form.paired = false
    } else if (props.isPaired != null) {
      form.paired = props.isPaired
    }
    form['platform'] = inForm.option
    form['platform_display'] = inForm.display ? inForm.display : inForm.option
    setDoValidation(doValidation + 1)
  }
  const setFileInput = (inForm, name) => {
    form.validForm = inForm.validForm
    if (inForm.validForm) {
      setState({
        ...form,
        fileInput: inForm.fileInput,
        fileInput_display: inForm.fileInput_display,
      })
    } else {
      setState({
        ...form,
        fileInput: [],
        fileInput_display: [],
      })
    }
    setDoValidation(doValidation + 1)
  }

  useEffect(() => {
    //set paired
    if (props.isPaired != null && form.platform.toLowerCase() === 'illumina') {
      setNewState2('paired', props.isPaired)
    }
  }, [props.isPaired]) // eslint-disable-line react-hooks/exhaustive-deps

  //trigger validation method when input changes
  useEffect(() => {
    //force updating parent's inputParams
    props.setParams(form, props.name)
  }, [doValidation]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {props.text && (
        <MyTooltip
          id={`fileInputTooltip-${props.name}`}
          tooltip={props.tooltip}
          text={props.text}
          place={props.tooltipPlace ? props.tooltipPlace : defaults.tooltipPlace}
          color={props.tooltipColor ? props.tooltipColor : defaults.tooltipColor}
          showTooltip={props.showTooltip ? props.showTooltip : defaults.showTooltip}
        />
      )}
      {props.seqPlatformOptions && (
        <>
          <OptionSelector
            id={'platform'}
            name={'platform'}
            setParams={setPlatform}
            text={props.seqPlatformText}
            options={props.seqPlatformOptions}
            defaultValue={props.seqPlatformDefaultValue}
            tooltip={props.seqPlatformTooltip}
          />
          <br></br>
        </>
      )}
      {!props.disableSwitcher && form.platform.toLowerCase() === 'illumina' && (
        <>
          <Switcher
            id={'paired'}
            name={'paired'}
            setParams={setSwitcher}
            text={
              props.pairedText ? props.pairedText : components[componentName].params['paired'].text
            }
            defaultValue={components[componentName].params['paired'].defaultValue}
            trueText={components[componentName].params['paired'].trueText}
            falseText={components[componentName].params['paired'].falseText}
          />
          <br></br>
        </>
      )}

      {!form.paired && (
        <>
          <FileInputArray
            setParams={setFileInput}
            name={'fastq'}
            text={`${capitalizeFirstLetter(form.platform)} ${components[componentName].params['fastq'].text}`}
            enableInput={props.enableInput}
            placeholder={props.placeholder}
            isValidFileInput={props.isValidFileInput}
            dataSources={props.dataSources}
            fileTypes={props.fileTypes}
            projectTypes={props.projectTypes}
            projectScope={props.projectScope}
            viewFile={props.viewFile}
            isOptional={props.isOptional}
            cleanupInput={props.cleanupInput}
            maxInput={props.maxInput}
          />
        </>
      )}
      {form.paired && (
        <>
          <PairedFileInputArray
            setParams={setFileInput}
            name={'fastq'}
            text={`${capitalizeFirstLetter(form.platform)} ${components[componentName].params['fastq'].text}`}
            enableInput={props.enableInput}
            placeholder={props.placeholder}
            isValidFileInput={props.isValidFileInput}
            dataSources={props.dataSources}
            fileTypes={props.fileTypes}
            projectTypes={props.projectTypes}
            projectScope={props.projectScope}
            viewFile={props.viewFile}
            isOptional={props.isOptional}
            cleanupInput={props.cleanupInput}
            maxInput={props.maxInput}
          />
        </>
      )}
    </>
  )
}
