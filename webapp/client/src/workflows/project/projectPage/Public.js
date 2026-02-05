import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ProjectSummary from '/src/edge/project/results/ProjectSummary'
import { LoaderDialog } from '/src/edge/common/Dialogs'
import { getData, apis } from '/src/edge/common/util'
import ProjectResult from '../ProjectResult'

const Public = (props) => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [code, setCode] = useState()
  const [project, setProject] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()

  useEffect(() => {
    const codeParam = params.get('code')
    if (codeParam) {
      setCode(codeParam)
    } else {
      navigate('/public/projects')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const getProject = () => {
      let url = `${apis.publicProjects}/${code}`
      getData(url)
        .then((data) => {
          setProject(data.project)
          setLoading(false)
        })
        .catch((err) => {
          setError(err)
          setLoading(false)
        })
    }
    if (code) {
      setLoading(true)
      getProject()
    }
  }, [code])

  return (
    <div className="animated fadeIn">
      <LoaderDialog loading={loading} text="Loading..." />
      {error ? (
        <div className="clearfix">
          <h4 className="pt-3">Project not found</h4>
          <hr />
          <p className="text-muted float-left">
            The project might be deleted or you have no permission to acces it.
          </p>
        </div>
      ) : (
        <>
          <ProjectSummary project={project} />
          <br></br>
          <ProjectResult project={project} type={'public'} />
        </>
      )}
    </div>
  )
}

export default Public
