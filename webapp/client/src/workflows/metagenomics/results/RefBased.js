import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardBody, Collapse, Row, Col } from 'reactstrap'
import { MaterialReactTable } from 'material-react-table'
import { ThemeProvider } from '@mui/material'
import { theme } from 'src/edge/um/common/tableUtil'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'

export const RefBased = (props) => {
  const [collapseCard, setCollapseCard] = useState(true)
  const url = config.APP.BASE_URI + '/projects/' + props.project.code + '/'
  const summaryData = props.result.summary
  const [coveragePlots, setCoveragePlots] = useState([])
  const snpsData = props.result.snps
  const indelsData = props.result.indels

  //create columns from data
  const summaryColumns = useMemo(
    () =>
      summaryData.length
        ? Object.keys(summaryData[0]).map((columnId) => ({
            header: columnId,
            accessorKey: columnId,
            id: columnId,
            Cell: ({ cell }) =>
              columnId === 'Ref' && cell.getValue() ? (
                <a
                  className="edge-link"
                  href={`https://www.ncbi.nlm.nih.gov/nuccore/${cell.getValue()}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {cell.getValue()}
                </a>
              ) : (
                cell.getValue()
              ),
          }))
        : [],
    [summaryData],
  )
  const snpsColumns = useMemo(
    () =>
      snpsData?.length
        ? Object.keys(snpsData[0]).map((columnId) => ({
            header: columnId,
            accessorKey: columnId,
            id: columnId,
          }))
        : [],
    [snpsData],
  )
  const indelsColumns = useMemo(
    () =>
      indelsData?.length
        ? Object.keys(indelsData[0]).map((columnId) => ({
            header: columnId,
            accessorKey: columnId,
            id: columnId,
          }))
        : [],
    [indelsData],
  )

  useEffect(() => {
    if (props.result.coveragePlots) {
      setCoveragePlots(
        props.result.coveragePlots.map((plot) => {
          // extract the plot id from the plot path, assuming the path is like 'output/RefBased/readsToRef_NZ_CP009685.1_base_coverage.png'
          // or 'output/RefBased/readsToRef_NZ_CP009685.1_coverage_histogram.png'
          const pngFilename = plot.split('/').slice(-1)[0]
          var plotId = ''
          if (pngFilename.startsWith('readsToRef_') && pngFilename.endsWith('_base_coverage.png')) {
            plotId = `${pngFilename.replace('readsToRef_', '').replace('_base_coverage.png', '')} Cov`
          } else if (
            pngFilename.startsWith('readsToRef_') &&
            pngFilename.endsWith('_coverage_histogram.png')
          ) {
            plotId = `${pngFilename.replace('readsToRef_', '').replace('_coverage_histogram.png', '')} Fold`
          }

          return { plotId: plotId, plotPath: `${url}${plot}` }
        }),
      )
    }
  }, [props.result.coveragePlots, url])

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
        title={'Reference-Based Analysis Result'}
        collapseParms={collapseCard}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          {props.result.summary && (
            <>
              <span className="edge-text-size-large edge-text-bold">Summary</span>
              <br></br>
              <br></br>
              <ThemeProvider theme={theme}>
                <MaterialReactTable
                  columns={summaryColumns}
                  data={summaryData}
                  enableFullScreenToggle={false}
                  initialState={{ density: 'compact' }}
                />
              </ThemeProvider>
              <br></br>
              <br></br>
            </>
          )}
          {coveragePlots.length > 0 && (
            <>
              <span className="edge-text-size-large edge-text-bold">
                Reference Genome Coverage Plots
              </span>
              <br></br>
              <br></br>
              <Row key="coveragePlots">
                {coveragePlots.map((plot, id) => (
                  <Col key={plot.plotId} xs="12" md="3" lg="3">
                    <span className="pt-3 edge-text-size-small">{`${plot.plotId}`}</span>
                    <br></br>
                    <span key={id} title="Click to view the image in full screen">
                      <a
                        className="edge-link edge-text-size-small"
                        href={plot.plotPath}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          key={`plot-${plot.plotId}`}
                          src={plot.plotPath}
                          style={{ width: '100%', height: 'auto' }}
                        />
                      </a>
                    </span>
                    <br></br>
                    <br></br>
                  </Col>
                ))}
              </Row>
              <br></br>
            </>
          )}
          {props.result.snps && (
            <>
              <span className="edge-text-size-large edge-text-bold">SNPs</span>
              <br></br>
              <br></br>
              <ThemeProvider theme={theme}>
                <MaterialReactTable
                  key={'snps-table'}
                  columns={snpsColumns}
                  data={snpsData}
                  enableFullScreenToggle={false}
                  initialState={{
                    density: 'compact',
                    pagination: {
                      pageSize: 5, // Set initial rows per page to 5
                      pageIndex: 0, // Start on the first page
                      paginationDisplayMode: 'pages',
                    },
                  }}
                />
              </ThemeProvider>
              <br></br>
              <br></br>
            </>
          )}
          {props.result.indels && (
            <>
              <span className="edge-text-size-large edge-text-bold">Indels</span>
              <br></br>
              <br></br>
              <ThemeProvider theme={theme}>
                <MaterialReactTable
                  key={'indels-table'}
                  columns={indelsColumns}
                  data={indelsData}
                  enableFullScreenToggle={false}
                  initialState={{
                    density: 'compact',
                    pagination: {
                      pageSize: 5, // Set initial rows per page to 5
                      pageIndex: 0, // Start on the first page
                      paginationDisplayMode: 'pages',
                    },
                  }}
                />
              </ThemeProvider>
              <br></br>
              <br></br>
            </>
          )}
          {props.result.jbrowse && (
            <>
              <span className="edge-text-size-large edge-text-bold">Genome Context</span>{' '}
              <a
                href={`${config.APP.BASE_URI}/${props.result.jbrowse}`}
                target="_blank"
                rel="noreferrer"
                className="edge-link"
              >
                [full]
              </a>
              <br></br>
              <div key={'refBased-jbrowse'}>
                <iframe
                  key={'refBased-jbrowse-iframe'}
                  src={`${config.APP.BASE_URI}/${props.result.jbrowse}`}
                  className="edge-iframe"
                  title={'jbrowse'}
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
