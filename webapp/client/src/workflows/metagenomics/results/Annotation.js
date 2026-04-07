import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { PdfViewer } from 'src/edge/common/PdfViewer'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'

export const Annotation = (props) => {
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
        title={'Annotation Result'}
        collapseParms={collapseCard}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          <h5>Summary</h5>
          {props.result.stats && (
            <>
              <PdfViewer pdf={`${url}${props.result.stats}`} />
              <br></br>
              <br></br>
            </>
          )}
          <h5>Opaver Web Path</h5>
          <a
            className="edge-link edge-text-size-small"
            href={`${config.APP.BASE_URI}/${props.result.opaver_web}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            [full window view]
          </a>
          {props.result.opaver_web && (
            <>
              <embed
                key={`opaver-${props.project.code}`}
                src={`${config.APP.BASE_URI}/${props.result.opaver_web}`}
                className="edge-iframe"
                title={'OPAVER Web'}
              />
              <br></br>
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
