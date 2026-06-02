import React, { useState, useEffect } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { StatsTable } from 'src/edge/common/Tables'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'

export const AntiSmash = (props) => {
  const [collapseCard, setCollapseCard] = useState(true)
  const url = config.APP.BASE_URI + '/projects/' + props.project.code + '/'
  const title = props.title || 'AntiSmash Result'

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
        title={title}
        collapseParms={collapseCard}
        aiSummary={{
          sectionKey: 'antiSmash',
          title,
          project: props.project,
          userType: props.userType,
        }}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          {props.result.antiSmashHtml && (
            <>
              <a
                className="edge-link"
                href={url + props.result.antiSmashHtml}
                target="_blank"
                rel="noreferrer"
              >
                [full window view]
              </a>
              <br></br>
              <div key={'metagenomics-antisMash-iframe'}>
                <iframe
                  src={url + props.result.antiSmashHtml}
                  className="edge-iframe"
                  title={'AntiSmash Result Viewer'}
                />
              </div>
              <br></br>
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
