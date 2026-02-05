import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'

export const Phylogeny = (props) => {
  const [collapseCard, setCollapseCard] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)
  const [iframeKey2, setIframeKey2] = useState(0)
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
          setIframeKey(iframeKey + 1) // Force re-render of iframes when toggling
          setIframeKey2(iframeKey2 + 1) // Force re-render of iframes when toggling
        }}
        title={'Phylogeny Analysis Result'}
        collapseParms={collapseCard}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          {props.result.treeAllHtml && (
            <>
              <b>SNPphyloTree All</b>
              <br></br>
              <a href={`${url}${props.result.treeAllHtml}`} target="_blank" rel="noreferrer">
                [Full Window View]
              </a>
              <iframe
                key={iframeKey}
                src={`${url}${props.result.treeAllHtml}`}
                className="edge-iframe"
              />
              <br></br>
              <br></br>
            </>
          )}
          {props.result.treeAllHtml && (
            <>
              <b>SNPphyloTree CDS</b>
              <br></br>
              <a href={`${url}${props.result.treeCdsHtml}`} target="_blank" rel="noreferrer">
                [Full Window View]
              </a>
              <iframe
                key={iframeKey2}
                src={`${url}${props.result.treeCdsHtml}`}
                className="edge-iframe"
              />
              <br></br>
              <br></br>
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
