import React from 'react'
import config from 'src/config'
const UserProjectPage = React.lazy(() => import('src/workflows/common/projectPage/User'))
const AdminProjectPage = React.lazy(() => import('src/workflows/common/projectPage/Admin'))
const SRAWorkflow = React.lazy(() => import('src/workflows/sra/Main'))
const MetaGWorkflow = React.lazy(() => import('src/workflows/metagenomics/Main'))

const workflowPrivateRoutes = [
  { path: '/user/project', name: 'ProjectPage', element: UserProjectPage },
  { path: '/admin/project', name: 'AdminProjectPage', element: AdminProjectPage },
  config.APP.SRADATA_IS_ENABLED && { path: '/user/sradata', name: 'Data', element: SRAWorkflow },
  // Add more workflow private routes here
  { path: '/workflow/metagenomics', name: 'MetaG', element: MetaGWorkflow },
]

export default workflowPrivateRoutes
