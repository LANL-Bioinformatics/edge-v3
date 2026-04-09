import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardBody,
  Collapse,
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Button,
  ButtonGroup,
  Row,
  Col,
} from 'reactstrap'

import { MaterialReactTable } from 'material-react-table'
import { ThemeProvider } from '@mui/material'
import { theme } from 'src/edge/um/common/tableUtil'
import { PdfViewer } from 'src/edge/common/PdfViewer'
import { MySelect } from 'src/edge/common/MySelect'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'
import { taxClassificationOptions } from '../defaults'

export const Taxonomy = (props) => {
  const [collapseCard, setCollapseCard] = useState(true)
  const url = config.APP.BASE_URI + '/projects/' + props.project.code + '/'
  const tabs = {
    Summary: 'table and krona',
    'Classification Tools': 'table and tree/krona',
  }
  const [taxLevel, setTaxLevel] = useState('species')
  const [activeTab, setActiveTab] = useState(0)
  const summaryData = props.result.summary
  const [toolOptions, setToolOptions] = useState([])
  const [toolToDisplay, setToolToDisplay] = useState([])
  const [toolTableColumns, setToolTableColumns] = useState({})

  //create columns from data
  const summaryColumns = useMemo(
    () =>
      summaryData.length
        ? Object.keys(summaryData[0]).map((columnId) => ({
            header: columnId,
            accessorKey: columnId,
            id: columnId,
            Cell: ({ cell }) =>
              columnId.startsWith('TOP') && cell.getValue() && cell.getValue() !== 'N/A' ? (
                <a
                  className="edge-link"
                  href={`https://www.ncbi.nlm.nih.gov/datasets/taxonomy/${cell.getValue()}/`}
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

  //handle tab toggle
  const toggleTab = (tab) => {
    setActiveTab(tab)
  }

  //find selected tools option labels for display
  useEffect(() => {
    let options = []
    const tools = Object.keys(props.result.tools)
    // get taxonomy classification options without default and filter to only include those with value in tools, then combine them into one array
    const { 'classification-tools-default': defaultOptions, ...taxOptions } =
      taxClassificationOptions
    Object.keys(taxOptions).forEach((key) => {
      //filter taxClassificationOptions to find the one with value matching keys of props.result.tools
      const filteredOptions = taxOptions[key].filter((option) => tools.includes(option.value))
      options = [...options, ...filteredOptions]
    })
    setToolOptions((prev) => [...prev, ...options])
    //set table columns for each tool
    tools.forEach((tool) => {
      if (props.result.tools[tool].table) {
        const columns = Object.keys(props.result.tools[tool].table[0]).map((columnId) => ({
          header: columnId,
          accessorKey: columnId,
          id: columnId,
          Cell: ({ cell }) =>
            columnId === 'TAXA' && cell.getValue() ? (
              <a
                className="edge-link"
                href={`https://www.ncbi.nlm.nih.gov/datasets/taxonomy/${cell.getValue()}/`}
                target="_blank"
                rel="noreferrer"
              >
                {cell.getValue()}
              </a>
            ) : columnId === 'NAME' && cell.getValue() ? (
              <a
                className="edge-link"
                href={`https://www.ncbi.nlm.nih.gov/datasets/taxonomy/${cell.getValue()}/`}
                target="_blank"
                rel="noreferrer"
              >
                {cell.getValue()}
              </a>
            ) : (
              cell.getValue()
            ),
        }))
        setToolTableColumns((prev) => ({ ...prev, [tool]: columns }))
      }
    })
  }, [props.result, props.result.tools])

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
        title={'Taxonomy Result'}
        collapseParms={collapseCard}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          <Nav tabs>
            {Object.keys(tabs).map((item, index) => (
              <NavItem key={item + index}>
                <NavLink
                  style={{ cursor: 'pointer' }}
                  active={activeTab === index}
                  onClick={() => {
                    toggleTab(index)
                  }}
                >
                  {item}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
          <TabContent activeTab={activeTab}>
            {Object.keys(tabs).map((item, index) => (
              <TabPane key={index} tabId={index}>
                <br></br>
                {item === 'Summary' ? (
                  <>
                    <ButtonGroup className="mr-3" aria-label="First group" size="sm">
                      <Button
                        color="outline-primary"
                        onClick={() => setTaxLevel('species')}
                        active={taxLevel === 'species'}
                      >
                        Species
                      </Button>
                      <Button
                        color="outline-primary"
                        onClick={() => setTaxLevel('genus')}
                        active={taxLevel === 'genus'}
                      >
                        Genus
                      </Button>
                      <Button
                        color="outline-primary"
                        onClick={() => setTaxLevel('strain')}
                        active={taxLevel === 'strain'}
                      >
                        Strain
                      </Button>
                    </ButtonGroup>
                    <br></br>
                    <br></br>
                    <ThemeProvider theme={theme}>
                      <MaterialReactTable
                        columns={summaryColumns}
                        data={summaryData.filter((row) => row.LEVEL === taxLevel)}
                        globalFilterFn="includesString" //turn off fuzzy matching and use simple includesString filter function
                        enableColumnFilters={false} //turn off individual column filters
                        enableFullScreenToggle={false}
                        initialState={{
                          density: 'compact',
                          columnVisibility: {
                            DATASET: false,
                          },
                          pagination: {
                            pageSize: 5, // Set initial rows per page to 5
                            pageIndex: 0, // Start on the first page
                          },
                        }}
                        renderEmptyRowsFallback={() => (
                          <center>
                            <br></br>No result to display
                          </center>
                        )}
                      />
                    </ThemeProvider>
                    <br></br>
                    <br></br>
                    <Row>
                      <Col xs="12" md="3" lg="3">
                        <span className="edge-text-bold">{`Heatmap at ${taxLevel} level`}</span>{' '}
                        <a
                          href={`${url}${props.result[taxLevel].heatmap}`}
                          target="_blank"
                          rel="noreferrer"
                          className="edge-link"
                        >
                          [full]
                        </a>
                        <br></br>
                        <PdfViewer pdf={`${url}${props.result[taxLevel].heatmap}`} alt="heatmap" />
                      </Col>
                      <Col xs="12" md="1" lg="1"></Col>
                      <Col xs="12" md="8" lg="8">
                        <span className="edge-text-bold">{`Radar map at ${taxLevel} level`}</span>{' '}
                        <a
                          href={`${url}${props.result[taxLevel].radar}`}
                          target="_blank"
                          rel="noreferrer"
                          className="edge-link"
                        >
                          [full]
                        </a>
                        <br></br>
                        <iframe
                          key={'radar-' + taxLevel}
                          className="edge-iframe"
                          src={`${url}${props.result[taxLevel].radar}`}
                          alt="radar"
                        />
                      </Col>
                    </Row>
                  </>
                ) : item === 'Classification Tools' ? (
                  <>
                    <MySelect
                      options={toolOptions}
                      value={''}
                      isMulti={true}
                      placeholder={'Choose tools to display'}
                      checkbox={true}
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      onChange={(selected) => {
                        setToolToDisplay(selected)
                      }}
                    />
                    <br></br>
                    {toolToDisplay.map((tool) =>
                      props.result.tools[tool.value].table ? (
                        <div key={tool.value}>
                          <h5 className="edge-text-bold">{tool.label}</h5>
                          <ThemeProvider theme={theme}>
                            <MaterialReactTable
                              columns={toolTableColumns[tool.value]}
                              data={
                                props.result.tools[tool.value].table
                                  ? props.result.tools[tool.value].table
                                  : []
                              }
                              globalFilterFn="includesString" //turn off fuzzy matching and use simple includesString filter function
                              enableFullScreenToggle={false}
                              initialState={{
                                density: 'compact',
                                pagination: {
                                  pageSize: 5, // Set initial rows per page to 5
                                  pageIndex: 0, // Start on the first page
                                },
                              }}
                              renderEmptyRowsFallback={() => (
                                <center>
                                  <br></br>No result to display
                                </center>
                              )}
                            />
                          </ThemeProvider>
                          <br></br>
                          <br></br>
                          <span className="edge-text-bold">Tree plot at species level </span>{' '}
                          <a
                            href={`${url}${props.result.tools[tool.value].tree}`}
                            target="_blank"
                            rel="noreferrer"
                            className="edge-link"
                          >
                            [full]
                          </a>
                          <br></br>
                          <img
                            key={`tree-${tool.value}`}
                            src={`${url}${props.result.tools[tool.value].tree}`}
                            alt={`${tool.label} tree plot`}
                            style={{ width: '100%', height: 'auto' }}
                          />
                          <br></br>
                          <span className="edge-text-bold">Krona plot at species level </span>{' '}
                          <a
                            href={`${url}${props.result.tools[tool.value].krona}`}
                            target="_blank"
                            rel="noreferrer"
                            className="edge-link"
                          >
                            [full]
                          </a>
                          <br></br>
                          <br></br>
                          <iframe
                            key={`krona-${tool.value}`}
                            className="edge-iframe"
                            src={`${url}${props.result.tools[tool.value].krona}`}
                            alt={`${tool.label} krona plot`}
                          />
                        </div>
                      ) : (
                        <div key={tool.value}>
                          <span className="edge-text-bold">{tool.label}</span> <br></br>
                          <span className="red-text">No result available</span>
                          <br></br>
                          <br></br>
                        </div>
                      ),
                    )}
                  </>
                ) : (
                  <span>
                    No available
                    <br></br>
                    <br></br>
                  </span>
                )}
              </TabPane>
            ))}
          </TabContent>
          <br></br>
          <br></br>
        </CardBody>
      </Collapse>
    </Card>
  )
}

export default Taxonomy
