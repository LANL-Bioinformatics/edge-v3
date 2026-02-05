import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { StatsTable } from 'src/edge/common/Tables'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'

export const RunFaQCs = (props) => {
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
        title={'ReadsQC Result'}
        collapseParms={collapseCard}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          {props.result.stats && (
            <>
              <StatsTable data={props.result.stats} headers={[]} />
            </>
          )}
          {props.result.report && (
            <>
              <a href={`${url}${props.result.report}`} target="_blank" rel="noreferrer">
                [Detailed QC Report]
              </a>
              <div key={'readsQC-summary'}>
                <embed
                  key={'readsQC-summary-report'}
                  src={`${url}${props.result.summaryPlots}`}
                  className="edge-iframe"
                  title={'qc summary'}
                />
              </div>
              <br></br>
              <br></br>
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
