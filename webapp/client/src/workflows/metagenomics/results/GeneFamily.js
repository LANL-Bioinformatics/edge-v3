import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardBody, Collapse } from 'reactstrap'
import { MaterialReactTable } from 'material-react-table'
import { ThemeProvider } from '@mui/material'
import { theme } from 'src/edge/um/common/tableUtil'
import { Header } from 'src/edge/project/results/CardHeader'
import config from 'src/config'

export const GeneFamily = (props) => {
  const [collapseCard, setCollapseCard] = useState(true)
  const url = config.APP.BASE_URI + '/projects/' + props.project.code + '/'
  const summaryData = props.result.summary
  //create columns from data
  const summaryColumns = useMemo(
    () =>
      summaryData?.length
        ? Object.keys(summaryData[0]).map((columnId) => ({
            header: columnId,
            accessorKey: columnId,
            id: columnId,
          }))
        : [],
    [summaryData],
  )

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
        title={props.title || 'Gene Family Result'}
        collapseParms={collapseCard}
      />
      <Collapse isOpen={!collapseCard}>
        <CardBody>
          {props.result.summary && (
            <>
              <ThemeProvider theme={theme}>
                <MaterialReactTable
                  columns={summaryColumns}
                  data={summaryData}
                  muiTableBodyCellProps={{
                    sx: {
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    },
                  }}
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
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}
