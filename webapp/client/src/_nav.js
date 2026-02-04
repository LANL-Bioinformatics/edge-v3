import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilGrid, cilCloudUpload, cilLayers } from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Home',
    to: '/home',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Public Projects',
    to: '/public/projects',
    icon: <CIcon icon={cilGrid} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Upload Files',
    to: '/user/uploads',
    icon: <CIcon icon={cilCloudUpload} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Retrieve SRA Data',
    to: '/user/sradata',
    icon: <CIcon icon={cilCloudUpload} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Workflows',
  },
  /* {
    component: CNavGroup,
    name: 'Metagenomics',
    icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Run a Single Workflow',
        to: '/workflow/metagenomics',
        badge: {
          color: 'info',
          text: '9',
        },
      },
    ],
  }, */
]

export default _nav
