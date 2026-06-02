import { RunFaQCs } from '../../results/RunFaQCs'
import { Assembly } from '../../results/Assembly'
import { Annotation } from '../../results/Annotation'
import { Binning } from '../../results/Binning'
import { AntiSmash } from '../../results/AntiSmash'
import { Taxonomy } from '../../results/Taxonomy'
import { Phylogeny } from '../../results/Phylogeny'
import { RefBased } from '../../results/RefBased'
import { GeneFamily } from '../../results/GeneFamily'
import { workflowList } from 'src/util'

const resultTitles = {
  runFaQCs: 'ReadsQC Result',
  assembly: 'Assembly Result',
  annotation: 'Annotation Result',
  binning: 'Binning Result',
  antiSmash: 'AntiSmash Result',
  taxonomy: 'Taxonomy Result',
  phylogeny: 'Phylogeny Analysis Result',
  refBased: 'Reference-Based Analysis Result',
  geneFamily: 'Gene Family Result',
}

const getResultTitle = (workflow) =>
  resultTitles[workflow] || `${workflowList[workflow]?.label || workflow} Result`

export const MetaG = (props) => {
  return (
    <>
      {Object.keys(props.result).map((workflow, index) => {
        if (workflow === 'runFaQCs') {
          return (
            <RunFaQCs
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'assembly') {
          return (
            <Assembly
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'annotation') {
          return (
            <Annotation
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'binning') {
          return (
            <Binning
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'antiSmash') {
          return (
            <AntiSmash
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'taxonomy') {
          return (
            <Taxonomy
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'phylogeny') {
          return (
            <Phylogeny
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'refBased') {
          return (
            <RefBased
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else if (workflow === 'geneFamily') {
          return (
            <GeneFamily
              key={index}
              result={props.result[workflow]}
              project={props.project}
              title={getResultTitle(workflow)}
              userType={props.userType}
              allExpand={props.allExpand}
              allClosed={props.allClosed}
            />
          )
        } else {
          return <></>
        }
      })}
    </>
  )
}
