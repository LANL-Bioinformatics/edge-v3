import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput } from 'src/edge/common/util'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { FileInput } from 'src/edge/project/forms/FileInput'
import { RangeInput } from 'src/edge/project/forms/RangeInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { MultSelectInput } from 'src/edge/project/forms/MultSelectInput'
import { workflows } from '../defaults'

export const Taxonomy = (props) => {
  const workflowName = 'taxonomy'
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

  const setSelections = (inForm, name) => {
    form.readInputs[name].value = inForm.selections.map((item) => {
      return item.value
    })
    form.readInputs[name].display = inForm.selections.map((item) => {
      return item.label
    })
    if (validInputs.readInputs[name]) {
      validInputs.readInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setRangeInput = (inForm, name) => {
    form.readInputs[name].value = inForm.rangeInput
    setDoValidation(doValidation + 1)
  }

  const setSwitcher = (inForm, name) => {
    form.inputs[name].value = inForm.isTrue
    setDoValidation(doValidation + 1)
  }

  const setFileInput = (inForm, name) => {
    form.readInputs[name].value = inForm.fileInput
    form.readInputs[name].display = inForm.fileInput_display
    if (validInputs.readInputs[name]) {
      validInputs.readInputs[name].isValid = inForm.validForm
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
    // check input errors
    let errors = ''
    Object.keys(validInputs.readInputs).forEach((key) => {
      if (!validInputs.readInputs[key].isValid) {
        errors += validInputs.readInputs[key].error + '<br/>'
      }
    })

    if (errors === '') {
      //files for server to caculate total input size
      let inputFiles = []
      if (form.readInputs['custom_gottcha_genDB_b'].value) {
        inputFiles.push(form.readInputs['custom_gottcha_genDB_b'].value)
      }
      if (form.readInputs['custom_gottcha_speDB_b'].value) {
        inputFiles.push(form.readInputs['custom_gottcha_speDB_b'].value)
      }
      if (form.readInputs['custom_gottcha_strDB_b'].value) {
        inputFiles.push(form.readInputs['custom_gottcha_strDB_b'].value)
      }
      if (form.readInputs['custom_gottcha_genDB_v'].value) {
        inputFiles.push(form.readInputs['custom_gottcha_genDB_v'].value)
      }
      if (form.readInputs['custom_gottcha_speDB_v'].value) {
        inputFiles.push(form.readInputs['custom_gottcha_speDB_v'].value)
      }
      if (form.readInputs['custom_gottcha_strDB_v'].value) {
        inputFiles.push(form.readInputs['custom_gottcha_strDB_v'].value)
      }
      if (form.readInputs['custom_gottcha2_speDB_b'].value) {
        inputFiles.push(form.readInputs['custom_gottcha2_speDB_b'].value)
      }
      if (form.readInputs['custom_bwa_db'].value) {
        inputFiles.push(form.readInputs['custom_bwa_db'].value)
      }
      if (form.readInputs['custom_metaphlan_db'].value) {
        inputFiles.push(form.readInputs['custom_metaphlan_db'].value)
      }
      if (form.readInputs['custom_kraken_db'].value) {
        inputFiles.push(form.readInputs['custom_kraken_db'].value)
      }
      if (form.readInputs['custom_pangia_db'].value) {
        inputFiles.push(form.readInputs['custom_pangia_db'].value)
      }
      if (form.readInputs['custom_diamond_db'].value) {
        inputFiles.push(form.readInputs['custom_diamond_db'].value)
      }
      if (form.readInputs['custom_centrifuge_db'].value) {
        inputFiles.push(form.readInputs['custom_centrifuge_db'].value)
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
          <ol type="a">
            {props.source !== 'fasta' && (
              <>
                <li style={{ fontWeight: 'normal' }}>Read-based Taxonomy Classification</li>
                <br></br>
                <MultSelectInput
                  name={'enabledTools'}
                  text={workflows[workflowName].readInputs['enabledTools'].text}
                  tooltip={workflows[workflowName].readInputs['enabledTools'].tooltip}
                  options={workflows[workflowName].readInputs['enabledTools'].toolGroup}
                  value={workflows[workflowName].readInputs['enabledTools'].defaultSelections}
                  errMsg={'at least 1 tool required'}
                  placeholder={'Choose Classification Tools'}
                  setParams={setSelections}
                />
                <RangeInput
                  name={'splitTrimMinQ'}
                  setParams={setRangeInput}
                  text={workflows[workflowName].readInputs['splitTrimMinQ'].text}
                  tooltip={workflows[workflowName].readInputs['splitTrimMinQ'].tooltip}
                  tooltipClickable={true}
                  defaultValue={
                    workflows[workflowName].readInputs['splitTrimMinQ']['rangeInput'].defaultValue
                  }
                  min={workflows[workflowName].readInputs['splitTrimMinQ']['rangeInput'].min}
                  max={workflows[workflowName].readInputs['splitTrimMinQ']['rangeInput'].max}
                  step={workflows[workflowName].readInputs['splitTrimMinQ']['rangeInput'].step}
                />
                <br></br>
                <FileInput
                  name={'custom_gottcha_genDB_b'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_gottcha_genDB_b'].text}
                  tooltip={workflows[workflowName].readInputs['custom_gottcha_genDB_b'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_b']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_b']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_b']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_b']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_b']['fileInput']
                      .viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_b']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_b']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_gottcha_speDB_b'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_gottcha_speDB_b'].text}
                  tooltip={workflows[workflowName].readInputs['custom_gottcha_speDB_b'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_b']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_b']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_b']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_b']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_b']['fileInput']
                      .viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_b']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_b']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_gottcha_strDB_b'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_gottcha_strDB_b'].text}
                  tooltip={workflows[workflowName].readInputs['custom_gottcha_strDB_b'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_b']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_b']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_b']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_b']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_b']['fileInput']
                      .viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_b']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_b']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_gottcha_genDB_v'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_gottcha_genDB_v'].text}
                  tooltip={workflows[workflowName].readInputs['custom_gottcha_genDB_v'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_v']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_v']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_v']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_v']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_v']['fileInput']
                      .viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_v']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_gottcha_genDB_v']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_gottcha_speDB_v'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_gottcha_speDB_v'].text}
                  tooltip={workflows[workflowName].readInputs['custom_gottcha_speDB_v'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_v']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_v']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_v']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_v']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_v']['fileInput']
                      .viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_v']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_gottcha_speDB_v']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_gottcha_strDB_v'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_gottcha_strDB_v'].text}
                  tooltip={workflows[workflowName].readInputs['custom_gottcha_strDB_v'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_v']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_v']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_v']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_v']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_v']['fileInput']
                      .viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_v']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_gottcha_strDB_v']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_gottcha2_speDB_b'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_gottcha2_speDB_b'].text}
                  tooltip={workflows[workflowName].readInputs['custom_gottcha2_speDB_b'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_gottcha2_speDB_b']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_gottcha2_speDB_b']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_gottcha2_speDB_b']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_gottcha2_speDB_b']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_gottcha2_speDB_b']['fileInput']
                      .viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_gottcha2_speDB_b']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_gottcha2_speDB_b']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_bwa_db'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_bwa_db'].text}
                  tooltip={workflows[workflowName].readInputs['custom_bwa_db'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_bwa_db']['fileInput'].enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_bwa_db']['fileInput'].placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_bwa_db']['fileInput'].dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_bwa_db']['fileInput'].fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_bwa_db']['fileInput'].viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_bwa_db']['fileInput'].isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_bwa_db']['fileInput'].cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_metaphlan_db'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_metaphlan_db'].text}
                  tooltip={workflows[workflowName].readInputs['custom_metaphlan_db'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_metaphlan_db']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_metaphlan_db']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_metaphlan_db']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_metaphlan_db']['fileInput'].fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_metaphlan_db']['fileInput'].viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_metaphlan_db']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_metaphlan_db']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_kraken_db'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_kraken_db'].text}
                  tooltip={workflows[workflowName].readInputs['custom_kraken_db'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_kraken_db']['fileInput'].enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_kraken_db']['fileInput'].placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_kraken_db']['fileInput'].dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_kraken_db']['fileInput'].fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_kraken_db']['fileInput'].viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_kraken_db']['fileInput'].isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_kraken_db']['fileInput'].cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_pangia_db'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_pangia_db'].text}
                  tooltip={workflows[workflowName].readInputs['custom_pangia_db'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_pangia_db']['fileInput'].enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_pangia_db']['fileInput'].placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_pangia_db']['fileInput'].dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_pangia_db']['fileInput'].fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_pangia_db']['fileInput'].viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_pangia_db']['fileInput'].isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_pangia_db']['fileInput'].cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_diamond_db'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_diamond_db'].text}
                  tooltip={workflows[workflowName].readInputs['custom_diamond_db'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_diamond_db']['fileInput'].enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_diamond_db']['fileInput'].placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_diamond_db']['fileInput'].dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_diamond_db']['fileInput'].fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_diamond_db']['fileInput'].viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_diamond_db']['fileInput'].isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_diamond_db']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
                <FileInput
                  name={'custom_centrifuge_db'}
                  setParams={setFileInput}
                  isValidFileInput={isValidFileInput}
                  text={workflows[workflowName].readInputs['custom_centrifuge_db'].text}
                  tooltip={workflows[workflowName].readInputs['custom_centrifuge_db'].tooltip}
                  enableInput={
                    workflows[workflowName].readInputs['custom_centrifuge_db']['fileInput']
                      .enableInput
                  }
                  placeholder={
                    workflows[workflowName].readInputs['custom_centrifuge_db']['fileInput']
                      .placeholder
                  }
                  dataSources={
                    workflows[workflowName].readInputs['custom_centrifuge_db']['fileInput']
                      .dataSources
                  }
                  fileTypes={
                    workflows[workflowName].readInputs['custom_centrifuge_db']['fileInput']
                      .fileTypes
                  }
                  viewFile={
                    workflows[workflowName].readInputs['custom_centrifuge_db']['fileInput'].viewFile
                  }
                  isOptional={
                    workflows[workflowName].readInputs['custom_centrifuge_db']['fileInput']
                      .isOptional
                  }
                  cleanupInput={
                    workflows[workflowName].readInputs['custom_centrifuge_db']['fileInput']
                      .cleanupInput
                  }
                />
                <br></br>
              </>
            )}
            <li style={{ fontWeight: 'normal' }}>Contig-based Taxonomy Classification</li>
            <br></br>
            <Switcher
              id={'contigTax'}
              name={'contigTax'}
              setParams={setSwitcher}
              text={workflows[workflowName].inputs['contigTax'].text}
              tooltip={workflows[workflowName].inputs['contigTax'].tooltip}
              defaultValue={workflows[workflowName].inputs['contigTax']['switcher'].defaultValue}
              trueText={workflows[workflowName].inputs['contigTax']['switcher'].trueText}
              falseText={workflows[workflowName].inputs['contigTax']['switcher'].falseText}
              disableFalse={props.source === 'fasta' ? true : false}
            />
            <br></br>
          </ol>
        </CardBody>
      </Collapse>
    </Card>
  )
}
