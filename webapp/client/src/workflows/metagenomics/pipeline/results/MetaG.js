import { RunFaQCs } from '../../results/RunFaQCs'
import { Assembly } from '../../results/Assembly'
import { Annotation } from '../../results/Annotation'
import { Binning } from '../../results/Binning'
import { AntiSmash } from '../../results/AntiSmash'
import { Phylogeny } from '../../results/Phylogeny'
import { RefBased } from '../../results/RefBased'
import { workflows } from '../../defaults'

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
              title={workflows[workflow].title + ' Result'}
              userType={props.type}
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
              title={workflows[workflow].title + ' Result'}
              userType={props.type}
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
              title={workflows[workflow].title + ' Result'}
              userType={props.type}
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
              title={workflows[workflow].title + ' Result'}
              userType={props.type}
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
              title={workflows[workflow].title + ' Result'}
              userType={props.type}
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
              title={workflows[workflow].title + ' Result'}
              userType={props.type}
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
              title={workflows[workflow].title + ' Result'}
              userType={props.type}
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
