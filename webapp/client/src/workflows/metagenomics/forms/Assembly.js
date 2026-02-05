import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { isValidFileInput } from 'src/edge/common/util'
import { HtmlText } from 'src/edge/common/HtmlText'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { IntegerInput } from 'src/edge/project/forms/IntegerInput'
import { RangeInput } from 'src/edge/project/forms/RangeInput'
import { SelectInput } from 'src/edge/project/forms/SelectInput'
import { FileInput } from 'src/edge/project/forms/FileInput'
import { TextInput } from 'src/edge/project/forms/TextInput'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { workflows } from '../defaults'

export const Assembly = (props) => {
  const workflowName = 'assembly'
  const [collapseParms, setCollapseParms] = useState(false)
  const [form, setState] = useState({ ...workflows[workflowName] })
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
    form.assemblerInputs[form.inputs['assembler'].value][name].value = inForm.rangeInput
    setDoValidation(doValidation + 1)
  }

  const setMainOption = (inForm, name) => {
    form.inputs[name].value = inForm.option
    form.inputs[name].display = inForm.display
    setDoValidation(doValidation + 1)
  }

  const setOption = (inForm, name) => {
    form.assemblerInputs[form.inputs['assembler'].value][name].value = inForm.option
    form.assemblerInputs[form.inputs['assembler'].value][name].display = inForm.display
      ? inForm.display
      : inForm.option
    setDoValidation(doValidation + 1)
  }

  const setSelect = (inForm, name) => {
    form.assemblerInputs[form.inputs['assembler'].value][name].value = inForm.selection.value
    form.assemblerInputs[form.inputs['assembler'].value][name].display = inForm.selection.label
    setDoValidation(doValidation + 1)
  }

  const setMainIntegerInput = (inForm, name) => {
    //console.log(inForm, name)
    form.inputs[name].value = inForm.integerInput
    if (validInputs[form.inputs['assembler'].value][name]) {
      validInputs[form.inputs['assembler'].value][name].isValid = inForm.validForm
    }
    if (name === 'minContigSize') {
      //set all assemblers
      Object.keys(validInputs).forEach((key) => {
        validInputs[key][name].isValid = inForm.validForm
      })
    }
    setDoValidation(doValidation + 1)
  }

  const setIntegerInput = (inForm, name) => {
    //console.log(inForm, name)
    form.assemblerInputs[form.inputs['assembler'].value][name].value = inForm.integerInput
    if (validInputs[form.inputs['assembler'].value][name]) {
      validInputs[form.inputs['assembler'].value][name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setMainSwitcher = (inForm, name) => {
    form.inputs[name].value = inForm.isTrue
    setDoValidation(doValidation + 1)
  }

  const setSwitcher = (inForm, name) => {
    form.assemblerInputs[form.inputs['assembler'].value][name].value = inForm.isTrue
    setDoValidation(doValidation + 1)
  }

  const setFileInput = (inForm, name) => {
    form.assemblerInputs[form.inputs['assembler'].value][name].value = inForm.fileInput
    form.assemblerInputs[form.inputs['assembler'].value][name].display = inForm.fileInput_display
    if (validInputs[form.inputs['assembler'].value][name]) {
      validInputs[form.inputs['assembler'].value][name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  const setMainTextInput = (inForm, name) => {
    form.inputs[name].value = inForm.textInput
    if (validInputs[name]) {
      validInputs[name].isValid = inForm.validForm
    }
    setDoValidation(doValidation + 1)
  }

  useEffect(() => {
    if (form.inputs['assembler'].value === 'LRASM') {
      //set aligner to Minimap2
      form.inputs['aligner'].value = 'minimap2'
    } else {
      form.inputs['aligner'].value = 'bwa'
    }
    setDoValidation(doValidation + 1)
  }, [form.inputs['assembler'].value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (props.seqPlatform === 'Illumina') {
      form.inputs['assembler'].value = 'IDBA_UD'
      form.inputs['aligner'].value = 'bwa'
      form.inputs['aligner']['options'][0]['disabled'] = false
    } else if (props.seqPlatform === 'Nanopore') {
      form.inputs['assembler'].value = 'LRASM'
      form.assemblerInputs[form.inputs['assembler'].value]['Lrasm_preset'].value = 'nanopore'
      form.inputs['aligner']['options'][0]['disabled'] = true
    } else if (props.seqPlatform === 'PacBio') {
      form.inputs['assembler'].value = 'LRASM'
      form.assemblerInputs[form.inputs['assembler'].value]['Lrasm_preset'].value = 'pacbio'
      form.inputs['aligner']['options'][0]['disabled'] = true
    }
    setDoValidation(doValidation + 1)
  }, [props.seqPlatform]) // eslint-disable-line react-hooks/exhaustive-deps

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
    Object.keys(validInputs[form.inputs['assembler'].value]).forEach((key) => {
      if (!validInputs[form.inputs['assembler'].value][key].isValid) {
        errors += validInputs[form.inputs['assembler'].value][key].error + '<br/>'
      }
    })

    if (errors === '') {
      //files for server to caculate total input size
      let inputFiles = []
      if (
        form.inputs['assembler'].value === 'SPAdes' &&
        form.assemblerInputs[form.inputs['assembler'].value]['spades_pacbio'].value
      ) {
        inputFiles.push(form.assemblerInputs[form.inputs['assembler'].value]['spades_pacbio'].value)
      }
      if (
        form.inputs['assembler'].value === 'SPAdes' &&
        form.assemblerInputs[form.inputs['assembler'].value]['spades_nanopore'].value
      ) {
        inputFiles.push(
          form.assemblerInputs[form.inputs['assembler'].value]['spades_nanopore'].value,
        )
      }
      if (
        form.inputs['assembler'].value === 'UniCycler' &&
        form.assemblerInputs[form.inputs['assembler'].value]['Unicycler_longreads'].value
      ) {
        inputFiles.push(
          form.assemblerInputs[form.inputs['assembler'].value]['Unicycler_longreads'].value,
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
      <Collapse isOpen={!collapseParms} id={'collapseParameters-' + props.name}>
        <CardBody>
          <OptionSelector
            name={'assembler'}
            setParams={setMainOption}
            text={workflows[workflowName].inputs['assembler'].text}
            tooltip={workflows[workflowName].inputs['assembler'].tooltip}
            options={workflows[workflowName].inputs['assembler'].options}
            defaultValue={form.inputs['assembler'].value}
          />
          <br></br>
          {workflows[workflowName].inputs['assembler']['notes'][form.inputs['assembler'].value] && (
            <>
              <span className="text-muted edge-text-size-small">
                <HtmlText
                  text={
                    // eslint-disable-next-line prettier/prettier
                    workflows[workflowName].inputs['assembler']['notes'][form.inputs['assembler'].value
                    ]
                  }
                />
              </span>
              <br></br>
              <br></br>
            </>
          )}
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
            name={'aligner'}
            setParams={setMainOption}
            text={workflows[workflowName].inputs['aligner'].text}
            tooltip={workflows[workflowName].inputs['aligner'].tooltip}
            options={workflows[workflowName].inputs['aligner'].options}
            defaultValue={form.inputs['aligner'].value}
          />
          <br></br>
          <TextInput
            name={'aligner_options'}
            setParams={setMainTextInput}
            text={workflows[workflowName].inputs['aligner_options'].text}
            tooltip={workflows[workflowName].inputs['aligner_options'].tooltip}
            tooltipClickable={true}
            defaultValue={
              workflows[workflowName].inputs['aligner_options']['textInput'].defaultValue
            }
            placeholder={workflows[workflowName].inputs['aligner_options']['textInput'].placeholder}
            isOptional={workflows[workflowName].inputs['aligner_options']['textInput'].isOptional}
          />
          <br></br>
          <Switcher
            id={'extractUnmapped'}
            name={'extractUnmapped'}
            setParams={setMainSwitcher}
            text={workflows[workflowName].inputs['extractUnmapped'].text}
            defaultValue={
              workflows[workflowName].inputs['extractUnmapped']['switcher'].defaultValue
            }
            trueText={workflows[workflowName].inputs['extractUnmapped']['switcher'].trueText}
            falseText={workflows[workflowName].inputs['extractUnmapped']['switcher'].falseText}
          />
          <br></br>
          {form.inputs['assembler'].value === 'IDBA_UD' && (
            <>
              <RangeInput
                name={'idba_minK'}
                setParams={setRangeInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_minK'
                  ].text
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_minK'
                  ]['rangeInput'].defaultValue
                }
                min={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_minK'
                  ]['rangeInput'].min
                }
                max={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_minK'
                  ]['rangeInput'].max
                }
                step={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_minK'
                  ]['rangeInput'].step
                }
              />
              <br></br>
              <RangeInput
                name={'idba_maxK'}
                setParams={setRangeInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_maxK'
                  ].text
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_maxK'
                  ]['rangeInput'].defaultValue
                }
                min={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_maxK'
                  ]['rangeInput'].min
                }
                max={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_maxK'
                  ]['rangeInput'].max
                }
                step={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_maxK'
                  ]['rangeInput'].step
                }
              />
              <br></br>
              <RangeInput
                name={'idba_step'}
                setParams={setRangeInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_step'
                  ].text
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_step'
                  ]['rangeInput'].defaultValue
                }
                min={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_step'
                  ]['rangeInput'].min
                }
                max={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_step'
                  ]['rangeInput'].max
                }
                step={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'idba_step'
                  ]['rangeInput'].step
                }
              />
              <br></br>
            </>
          )}
          {form.inputs['assembler'].value === 'SPAdes' && (
            <>
              <SelectInput
                name={'spades_algorithm'}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_algorithm'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_algorithm'
                  ].tooltip
                }
                options={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_algorithm'
                  ].options
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_algorithm'
                  ].options[0]
                }
                isClearable={false}
                setParams={setSelect}
              />
              <br></br>
              <FileInput
                name={'spades_pacbio'}
                setParams={setFileInput}
                isValidFileInput={isValidFileInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ].tooltip
                }
                enableInput={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ]['fileInput'].enableInput
                }
                placeholder={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ]['fileInput'].placeholder
                }
                dataSources={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ]['fileInput'].dataSources
                }
                fileTypes={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ]['fileInput'].fileTypes
                }
                viewFile={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ]['fileInput'].viewFile
                }
                isOptional={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ]['fileInput'].isOptional
                }
                cleanupInput={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_pacbio'
                  ]['fileInput'].cleanupInput
                }
              />
              <br></br>
              <FileInput
                name={'spades_nanopore'}
                setParams={setFileInput}
                isValidFileInput={isValidFileInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ].tooltip
                }
                enableInput={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ]['fileInput'].enableInput
                }
                placeholder={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ]['fileInput'].placeholder
                }
                dataSources={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ]['fileInput'].dataSources
                }
                fileTypes={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ]['fileInput'].fileTypes
                }
                viewFile={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ]['fileInput'].viewFile
                }
                isOptional={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ]['fileInput'].isOptional
                }
                cleanupInput={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'spades_nanopore'
                  ]['fileInput'].cleanupInput
                }
              />
              <br></br>
            </>
          )}
          {form.inputs['assembler'].value === 'MEGAHIT' && (
            <>
              <SelectInput
                name={'megahit_preset'}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'megahit_preset'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'megahit_preset'
                  ].tooltip
                }
                options={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'megahit_preset'
                  ].options
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'megahit_preset'
                  ].options[0]
                }
                isClearable={false}
                setParams={setSelect}
              />
              <br></br>
            </>
          )}
          {form.inputs['assembler'].value === 'UniCycler' && (
            <>
              <OptionSelector
                name={'Unicycler_bridgingMode'}
                setParams={setOption}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_bridgingMode'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_bridgingMode'
                  ].tooltip
                }
                options={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_bridgingMode'
                  ].options
                }
                defaultValue={
                  form.assemblerInputs[form.inputs['assembler'].value]['Unicycler_bridgingMode']
                    .value
                }
              />
              <br></br>
              <FileInput
                name={'Unicycler_longreads'}
                setParams={setFileInput}
                isValidFileInput={isValidFileInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ].tooltip
                }
                enableInput={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ]['fileInput'].enableInput
                }
                placeholder={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ]['fileInput'].placeholder
                }
                dataSources={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ]['fileInput'].dataSources
                }
                fileTypes={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ]['fileInput'].fileTypes
                }
                viewFile={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ]['fileInput'].viewFile
                }
                isOptional={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ]['fileInput'].isOptional
                }
                cleanupInput={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_longreads'
                  ]['fileInput'].cleanupInput
                }
              />
              <br></br>
              <IntegerInput
                name={'Unicycler_minLongReads'}
                setParams={setIntegerInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_minLongReads'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_minLongReads'
                  ].tooltip
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_minLongReads'
                  ]['integerInput'].defaultValue
                }
                min={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_minLongReads'
                  ]['integerInput'].min
                }
                max={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Unicycler_minLongReads'
                  ]['integerInput'].max
                }
              />
              <br></br>
            </>
          )}
          {form.inputs['assembler'].value === 'LRASM' && (
            <>
              <OptionSelector
                name={'Lrasm_algorithm'}
                setParams={setOption}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_algorithm'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_algorithm'
                  ].tooltip
                }
                tooltipClickable={true}
                options={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_algorithm'
                  ].options
                }
                defaultValue={
                  form.assemblerInputs[form.inputs['assembler'].value]['Lrasm_algorithm'].value
                }
              />
              <br></br>
              <Switcher
                id={'Lrasm_ec'}
                name={'Lrasm_ec'}
                setParams={setSwitcher}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_ec'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_ec'
                  ].tooltip
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_ec'
                  ]['switcher'].defaultValue
                }
                trueText={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_ec'
                  ]['switcher'].trueText
                }
                falseText={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_ec'
                  ]['switcher'].falseText
                }
              />
              <br></br>
              <OptionSelector
                name={'Lrasm_preset'}
                setParams={setOption}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_preset'
                  ].text
                }
                tooltip={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_preset'
                  ].tooltip
                }
                options={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_preset'
                  ].options
                }
                defaultValue={
                  form.assemblerInputs[form.inputs['assembler'].value]['Lrasm_preset'].value
                }
              />
              <br></br>
              <RangeInput
                name={'Lrasm_numConsensus'}
                setParams={setRangeInput}
                text={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_numConsensus'
                  ].text
                }
                defaultValue={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_numConsensus'
                  ]['rangeInput'].defaultValue
                }
                min={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_numConsensus'
                  ]['rangeInput'].min
                }
                max={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_numConsensus'
                  ]['rangeInput'].max
                }
                step={
                  workflows[workflowName].assemblerInputs[form.inputs['assembler'].value][
                    'Lrasm_numConsensus'
                  ]['rangeInput'].step
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
