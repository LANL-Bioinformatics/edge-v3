import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { StatsTable } from 'src/edge/common/Tables'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'

export const Assembly = (props) => {
  const [collapseCard, setCollapseCard] = useState(true)
  const url = config.APP.BASE_URI + '/projects/' + props.project.code + '/'

  useEffect(() => {
    if (props.allExpand > 0) {
      setCollapseCard(false)
    }
  }, [props.allExpand])

  useEffect(() => {
    if (props.allClosed > 0) {
      setCollapseCard(true)
    }
  }, [props.allClosed])

  return (
    <Card className="workflow-result-card">
      <Header
        toggle={true}
        toggleParms={() => {
          setCollapseCard(!collapseCard)
        }}
        title={'Assembly Result'}
        collapseParms={collapseCard}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          {props.result.report && (
            <>
              <a href={url + props.result.report} target="_blank" rel="noreferrer">
                [Assembly Report]
              </a>
              <br></br>
              <br></br>
            </>
          )}
          {props.result.stats && (
            <>
              <StatsTable data={props.result.stats[0]} headers={[]} />
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
