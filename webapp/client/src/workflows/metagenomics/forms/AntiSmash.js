import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse, Row, Col } from 'reactstrap'
import { Header } from 'src/edge/project/forms/SectionHeader'
import { OptionSelector } from 'src/edge/project/forms/OptionSelector'
import { Switcher } from 'src/edge/project/forms/Switcher'
import { workflows } from '../defaults'

export const AntiSmash = (props) => {
  const workflowName = 'antiSmash'
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

  const setSwitcher = (inForm, name) => {
    form.inputs[name].value = inForm.isTrue
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
            name={'smaTaxon'}
            setParams={setOption}
            text={workflows[workflowName].inputs['smaTaxon'].text}
            tooltip={workflows[workflowName].inputs['smaTaxon'].tooltip}
            options={workflows[workflowName].inputs['smaTaxon'].options}
            defaultValue={form.inputs['smaTaxon'].value}
            display={form.inputs['smaTaxon'].display}
          />
          <br></br>
          <Row>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'knownclusterblast'}
                name={'knownclusterblast'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['knownclusterblast'].text}
                tooltip={workflows[workflowName].inputs['knownclusterblast'].tooltip}
                defaultValue={
                  workflows[workflowName].inputs['knownclusterblast']['switcher'].defaultValue
                }
                trueText={workflows[workflowName].inputs['knownclusterblast']['switcher'].trueText}
                falseText={
                  workflows[workflowName].inputs['knownclusterblast']['switcher'].falseText
                }
              />
            </Col>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'subclusterblast'}
                name={'subclusterblast'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['subclusterblast'].text}
                tooltip={workflows[workflowName].inputs['subclusterblast'].tooltip}
                defaultValue={
                  workflows[workflowName].inputs['subclusterblast']['switcher'].defaultValue
                }
                trueText={workflows[workflowName].inputs['subclusterblast']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['subclusterblast']['switcher'].falseText}
              />
            </Col>
          </Row>
          <br></br>
          <Row>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'clusterblast'}
                name={'clusterblast'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['clusterblast'].text}
                tooltip={workflows[workflowName].inputs['clusterblast'].tooltip}
                defaultValue={
                  workflows[workflowName].inputs['clusterblast']['switcher'].defaultValue
                }
                trueText={workflows[workflowName].inputs['clusterblast']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['clusterblast']['switcher'].falseText}
              />
            </Col>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'mibig'}
                name={'mibig'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['mibig'].text}
                tooltip={workflows[workflowName].inputs['mibig'].tooltip}
                defaultValue={workflows[workflowName].inputs['mibig']['switcher'].defaultValue}
                trueText={workflows[workflowName].inputs['mibig']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['mibig']['switcher'].falseText}
              />
            </Col>
          </Row>
          <br></br>
          <Row>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'fullhmm'}
                name={'fullhmm'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['fullhmm'].text}
                tooltip={workflows[workflowName].inputs['fullhmm'].tooltip}
                defaultValue={workflows[workflowName].inputs['fullhmm']['switcher'].defaultValue}
                trueText={workflows[workflowName].inputs['fullhmm']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['fullhmm']['switcher'].falseText}
              />
            </Col>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'pfam2go'}
                name={'pfam2go'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['pfam2go'].text}
                tooltip={workflows[workflowName].inputs['pfam2go'].tooltip}
                defaultValue={workflows[workflowName].inputs['pfam2go']['switcher'].defaultValue}
                trueText={workflows[workflowName].inputs['pfam2go']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['pfam2go']['switcher'].falseText}
              />
            </Col>
          </Row>
          <br></br>
          <Row>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'asf'}
                name={'asf'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['asf'].text}
                tooltip={workflows[workflowName].inputs['asf'].tooltip}
                defaultValue={workflows[workflowName].inputs['asf']['switcher'].defaultValue}
                trueText={workflows[workflowName].inputs['asf']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['asf']['switcher'].falseText}
              />
            </Col>
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'rre'}
                name={'rre'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['rre'].text}
                tooltip={workflows[workflowName].inputs['rre'].tooltip}
                defaultValue={workflows[workflowName].inputs['rre']['switcher'].defaultValue}
                trueText={workflows[workflowName].inputs['rre']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['rre']['switcher'].falseText}
              />
            </Col>
          </Row>
          <br></br>
          <Row>
            {form.inputs['smaTaxon'].value === 'fungi' && (
              <>
                <Col md="6">
                  <Switcher
                    colMd1={'6'}
                    colMd2={'6'}
                    id={'cassis'}
                    name={'cassis'}
                    setParams={setSwitcher}
                    text={workflows[workflowName].inputs['cassis'].text}
                    tooltip={workflows[workflowName].inputs['cassis'].tooltip}
                    defaultValue={workflows[workflowName].inputs['cassis']['switcher'].defaultValue}
                    trueText={workflows[workflowName].inputs['cassis']['switcher'].trueText}
                    falseText={workflows[workflowName].inputs['cassis']['switcher'].falseText}
                  />
                </Col>
              </>
            )}
            <Col md="6">
              <Switcher
                colMd1={'6'}
                colMd2={'6'}
                id={'tigrfam'}
                name={'tigrfam'}
                setParams={setSwitcher}
                text={workflows[workflowName].inputs['tigrfam'].text}
                tooltip={workflows[workflowName].inputs['tigrfam'].tooltip}
                defaultValue={workflows[workflowName].inputs['tigrfam']['switcher'].defaultValue}
                trueText={workflows[workflowName].inputs['tigrfam']['switcher'].trueText}
                falseText={workflows[workflowName].inputs['tigrfam']['switcher'].falseText}
              />
            </Col>
          </Row>
        </CardBody>
      </Collapse>
    </Card>
  )
}
