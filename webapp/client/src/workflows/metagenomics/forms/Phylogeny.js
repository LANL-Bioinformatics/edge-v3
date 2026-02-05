/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput } from 'src/edge/common/util'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { FileInputArray } from 'src/edge/project/forms/FileInputArray'
import { SRAAccessionInput } from 'src/edge/project/forms/SRAAccessionInput'
import { IntegerInput } from 'src/edge/project/forms/IntegerInput'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { SelectInput } from 'src/edge/project/forms/SelectInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { AsyncSelectInput } from 'src/edge/project/forms/AsyncSelectInput'
import { workflows } from '../defaults'

export const Phylogeny = (props) => {
  const workflowName = 'phylogeny'
  const [collapseParms, setCollapseParms] = useState(false)
  const [form] = useState({ ...workflows[workflowName] })
  const [validInputs] = useState({ ...workflows[workflowName].validInputs })
  const [resetGenomeSelect, setResetGenomeSelect] = useState(0)
  const [phyloRefSelectRefOptions, setPhyloRefSelectRefOptions] = useState([
    { value: 'random', label: 'Random' },
  ])
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

  const setSelectInput = (inForm, name) => {
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    if (inForm.selection) {
      form.inputs[name].value = inForm.selection.value
      form.inputs[name].display = inForm.selection.label
    } else {
      form.inputs[name].value = null
      form.inputs[name].display = null
    }
    //reset genome select
    setResetGenomeSelect(resetGenomeSelect + 1)
    form.genomeInputs['snpGenomes'].value = []
    form.genomeInputs['snpGenomes'].display = []
    form.genomeInputs['snpRefGenome'].value = null
    form.genomeInputs['snpRefGenome'].display = null
    form.genomeInputs['snpGenomesFiles'].value = []
    form.genomeInputs['snpGenomesFiles'].display = []
    form.genomeInputs['phylAccessions'].value = []
    form.genomeInputs['phylAccessions'].display = null
    validInputs['snpGenomes'].isValid = true
    validInputs['snpGenomesFiles'].isValid = true
    validInputs['phylAccessions'].isValid = true
    setDoValidation(doValidation + 1)
  }

  const setRefSelectInput = (inForm, name) => {
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    if (inForm.selection) {
      form.genomeInputs[name].value = inForm.selection.value
      form.genomeInputs[name].display = inForm.selection.label
    } else {
      form.genomeInputs[name].value = null
      form.genomeInputs[name].display = null
    }
    setDoValidation(doValidation + 1)
  }

  const SetAsyncSelectInput = (inForm, name) => {
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    if (inForm.selections?.length > 0) {
      validInputs['snpDBname'].isValid = true
    } else {
      validInputs[name].isValid = true
      validInputs['snpDBname'].isValid = false
    }

    form.genomeInputs[name].value = inForm.selections.map((item) => {
      return item.value
    })
    form.genomeInputs[name].display = inForm.selections.map((item) => {
      return item.label
    })
    setPhyloRefSelectRefOptions([{ value: 'random', label: 'Random' }, ...inForm.selections])
    //reset ref genome selection
    form.genomeInputs['snpRefGenome'].value = workflows[workflowName].genomeInputs['snpRefGenome'].value
    form.genomeInputs['snpRefGenome'].display = workflows[workflowName].genomeInputs['snpRefGenome'].display
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
    form.genomeInputs[name].value = inForm.fileInput
    form.genomeInputs[name].display = inForm.fileInput_display
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setSRAccessionInput = (inForm, name) => {
    form.validForm = inForm.validForm
    form.genomeInputs[name].value = inForm.accessions
    form.genomeInputs[name].display = inForm.accessions_display
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
      form.files = form.genomeInputs['snpGenomesFiles'].value
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
          <OptionSelector
            name={'treeMaker'}
            setParams={setOption}
            text={workflows[workflowName].inputs['treeMaker'].text}
            tooltip={workflows[workflowName].inputs['treeMaker'].tooltip}
            options={workflows[workflowName].inputs['treeMaker'].options}
            defaultValue={form.inputs['treeMaker'].value}
            display={form.inputs['treeMaker'].display}
          />
          <br></br>
          <SelectInput
            name={'snpDBname'}
            text={workflows[workflowName].inputs['snpDBname'].text}
            options={workflows[workflowName].inputs['snpDBname'].options}
            setParams={setSelectInput}
            placeholder="Select a Pathogen..."
            isClearable={true}
          />
          <br></br>
          {!form.inputs['snpDBname'].value && (
            <>
              <center>Or</center>
              <br></br>

              <span className="text-muted edge-text-size-small">
                Select/Add Genomes or SRA Reads: The same species or at least within the same genus
                are recommended.
              </span>
              <br></br>
              <AsyncSelectInput
                name={'snpGenomes'}
                text={workflows[workflowName].genomeInputs['snpGenomes'].text}
                tooltip={workflows[workflowName].genomeInputs['snpGenomes'].tooltip}
                placeholder={
                  workflows[workflowName].genomeInputs['snpGenomes']['asyncSelectInput'].placeholder
                }
                isMulti={true}
                min={workflows[workflowName].genomeInputs['snpGenomes']['asyncSelectInput'].min}
                max={workflows[workflowName].genomeInputs['snpGenomes']['asyncSelectInput'].max}
                maxOptions={workflows[workflowName].genomeInputs['snpGenomes']['asyncSelectInput'].maxOptions}
                options={props.refGenomeOptions}
                setParams={SetAsyncSelectInput}
                showSelections={true}
                showSelectionsText={'genome(s) selected'}
              />
              <br></br>
              <SelectInput
                name={'snpRefGenome'}
                text={workflows[workflowName].genomeInputs['snpRefGenome'].text}
                defaultValue={phyloRefSelectRefOptions[0]}
                options={phyloRefSelectRefOptions}
                setParams={setRefSelectInput}
                isClearable={false}
                reset={resetGenomeSelect}
              />
              <br></br>
              <FileInputArray
                setParams={setFileInput}
                name={'snpGenomesFiles'}
                isValidFileInput={
                  props.isValidFileInput ? props.isValidFileInput : isValidFileInput
                }
                mainText={workflows[workflowName].genomeInputs['snpGenomesFiles'].text}
                note={workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].note}
                text={workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].text}
                tooltip={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].tooltip
                }
                enableInput={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].enableInput
                }
                placeholder={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].placeholder
                }
                dataSources={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].dataSources
                }
                fileTypes={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].fileTypes
                }
                projectTypes={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].projectTypes
                    ? workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray']
                      .projectTypes
                    : null
                }
                projectScope={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].projectTypes
                }
                viewFile={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].viewFile
                    ? workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].viewFile
                    : false
                }
                isOptional={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].isOptional
                }
                cleanupInput={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].cleanupInput
                }
                maxInput={
                  workflows[workflowName].genomeInputs['snpGenomesFiles']['fileInputArray'].maxInput
                }
                reset={resetGenomeSelect}
              />
              <br></br>
              <SRAAccessionInput
                name={'phylAccessions'}
                text={workflows[workflowName].genomeInputs['phylAccessions'].text}
                tooltip={workflows[workflowName].genomeInputs['phylAccessions'].tooltip}
                isOptional={workflows[workflowName].genomeInputs['phylAccessions']['sraInput'].isOptional}
                setParams={setSRAccessionInput}
                reset={resetGenomeSelect}
              />
              <br></br>
            </>
          )}
          <Switcher
            id={'phameBootstrap'}
            name={'phameBootstrap'}
            setParams={setSwitcher}
            text={workflows[workflowName].inputs['phameBootstrap'].text}
            tooltip={workflows[workflowName].inputs['phameBootstrap'].tooltip}
            defaultValue={workflows[workflowName].inputs['phameBootstrap']['switcher'].defaultValue}
            trueText={workflows[workflowName].inputs['phameBootstrap']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['phameBootstrap']['switcher'].falseText}
          />
          <br></br>
          <IntegerInput
            name={'phameBootstrapNum'}
            setParams={setIntegerInput}
            text={workflows[workflowName].inputs['phameBootstrapNum'].text}
            tooltip={workflows[workflowName].inputs['phameBootstrapNum'].tooltip}
            defaultValue={
              workflows[workflowName].inputs['phameBootstrapNum']['integerInput'].defaultValue
            }
            min={workflows[workflowName].inputs['phameBootstrapNum']['integerInput'].min}
            max={workflows[workflowName].inputs['phameBootstrapNum']['integerInput'].max}
          />
          <br></br>
        </CardBody>
      </Collapse>
    </Card>
  )
}
