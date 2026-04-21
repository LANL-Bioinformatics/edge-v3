import { useState, useMemo } from 'react'
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap'
import DropdownTreeSelect from 'react-dropdown-tree-select'
import 'react-dropdown-tree-select/dist/styles.css'
import { LoaderDialog } from 'src/edge/common/Dialogs'

export const ProjectOutputDownload = (props) => {
  const [submitting, setSubmitting] = useState(false)
  const [fileSelected, setFileSelected] = useState([])
  const [resetTreeSelector, setResetTreeSelector] = useState(0)

  const treeSelectorSearchPredicate = (node, searchTerm) => {
    //return node.label && node.label.toLowerCase().startsWith(searchTerm)
    return node.label && node.label.toLowerCase().indexOf(searchTerm) >= 0
  }

  const treeSelector = useMemo(
    () => (
      <DropdownTreeSelect
        id={'output-tree-select'}
        data={props.outputTreeData}
        searchPredicate={treeSelectorSearchPredicate}
        className="edge-dropdown-tree-select"
        texts={{ placeholder: 'Search/Select folders/files to download ...' }}
        clearSearchOnChange={false}
        keepOpenOnSelect={true}
        keepTreeOnSearch={true}
        keepChildrenOnSearch={true}
        mode="multiSelect"
        showPartiallySelected={false}
        showDropdown="always"
        onChange={(currentNode, selectedNodes) => onChangeFiles(currentNode, selectedNodes)}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.outputTreeData, resetTreeSelector],
  )

  const onChangeFiles = (currentNode, selectedNodes) => {
    //console.log('onChange::', currentNode, selectedNodes)
    if (!currentNode.label) {
      return
    }
    let files = []
    selectedNodes.map((item) => {
      files.push({ path: item.filePath, id: item.id, value: item.value })
    })
    //console.log('files selected::', files)
    setFileSelected(files)
  }

  const zipFiles = () => {
    if (fileSelected.length === 0) {
      alert('Please select files/folders to download')
      return
    }
    setSubmitting(true)
    let filePaths = []
    fileSelected.forEach((file) => {
      filePaths.push(file.path)
    })
    const url = '/projects/download'
    getData(url, { project: props.project, filePaths: filePaths }, 'POST')
      .then((data) => {
        //console.log('download url::', data.downloadUrl)
        window.open(data.downloadUrl, '_blank')
        setSubmitting(false)
        props.closeModal()
      })
      .catch((err) => {
        alert(err)
        setSubmitting(false)
      })
  }

  return (
    <>
      <LoaderDialog loading={submitting === true} text="Zipping files..." />
      <Modal isOpen={props.isOpen} size="lg" centered>
        <ModalBody className="justify-content-center" style={{ height: '600px' }}>
          {treeSelector}
        </ModalBody>
        <ModalFooter className="justify-content-center">
          <Button
            disabled={fileSelected.length === 0 ? true : false}
            size="sm"
            color="primary"
            type="submit"
            onClick={() => zipFiles()}
          >
            Download Outputs
          </Button>{' '}
          <Button size="sm" color="secondary" onClick={() => props.closeModal()}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
