import { workflows as mainWorkflows } from '../../defaults'

export const workflows = {
  ...mainWorkflows,
  binning: {
    validForm: true,
    errMessage: 'input error',
    paramsOn: true,
    files: [],
    rawReadsInput: {
      source: 'fasta',
      text: 'CONTIGS/FASTA',
      fasta: {
        enableInput: true,
        placeholder: 'Select a file or enter a file http(s) url',
        dataSources: ['upload', 'public', 'project'],
        fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
        projectTypes: ['assembly', 'annotation'],
        projectScope: ['self+shared'],
        viewFile: false,
        isOptional: false,
        cleanupInput: true,
        maxInput: 1,
      },
    },
    inputs: {
      binningMinLength: {
        text: 'Minimum Contig Length',
        tooltip: 'Default:1000, range: 1 - 10000',
        value: 1000,
        integerInput: {
          defaultValue: 1000,
          min: 1,
          max: 10000,
        },
      },
      binningMaxItr: {
        text: 'Maximum EM Algorithm Iteration',
        tooltip:
          "It limits how many times MaxBin2 runs the EM refinement process. 50 is a balance between performance and quality of binning. Users can change it if you think your data needs more or fewer iterations to reach a good convergence (e.g., if you're using very complex or very simple datasets).",
        value: 50,
        rangeInput: {
          defaultValue: 50,
          min: 1,
          max: 100,
          step: 1,
        },
      },
      binningProb: {
        text: 'EM Probability',
        tooltip:
          "It's the confidence cutoff for assigning contigs to bins. 90% ensures high-confidence assignments. A lower threshold would increase bin completeness but may reduce purity, while a higher threshold increases purity but may miss borderline contigs.",
        value: 0.9,
        rangeInput: {
          defaultValue: 0.9,
          min: 0.1,
          max: 1.0,
          step: 0.01,
        },
      },
      binningMarkerSet: {
        text: 'Marker Gene Sets',
        tooltip:
          'By default MaxBin will look for 107 marker genes present in >95% of bacteria. Alternatively you can also choose 40 marker gene sets that are universal among bacteria and archaea (Wu et al., PLoS ONE 2013). This option may be better suited for environment dominated by archaea; however it tend to split genomes into more bins. You can choose between different marker gene sets and see which one works better.',
        value: 107,
        display: 107,
        options: [
          { text: 107, value: 107 },
          { text: 40, value: 40 },
        ],
      },
      doCheckM: {
        text: 'CheckM',
        tooltip:
          'CheckM provides functions to assess the quality of genomes recovered from isolates, single cells, or metagenomes (Binned contigs). It provides robust estimates of genome completeness and contamination by using collocated sets of genes that are ubiquitous and single-copy within a phylogenetic lineage. Memory hog warning!!! At least 32GB',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
    },
    // only for input with validation method
    validInputs: {
      binningMinLength: {
        isValid: true,
        error: 'Minimum Contig Length error. Default: 1000, range: 1 - 10000',
      },
    },
  },
  geneFamily: {
    validForm: true,
    errMessage: 'input error',
    paramsOn: true,
    files: [],
    rawReadsInput: {
      source: 'fastq',
      fastq: {
        enableInput: true,
        placeholder: 'Select a file or enter a file http(s) url',
        dataSources: ['upload', 'public', 'project'],
        fileTypes: ['fastq', 'fq', 'fastq.gz', 'fq.gz'],
        projectTypes: ['runFaQCs'],
        projectScope: ['self+shared'],
        viewFile: false,
        isOptional: false,
        cleanupInput: true,
        maxInput: 1000,
      },
      fasta: {
        enableInput: true,
        placeholder: 'Select a file or enter a file http(s) url',
        dataSources: ['upload', 'public', 'project'],
        fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
        projectTypes: ['assembly', 'annotation'],
        projectScope: ['self+shared'],
        viewFile: false,
        isOptional: false,
        cleanupInput: true,
        maxInput: 1,
      },
    },
    inputs: {
      readsGeneFamily: {
        text: 'Reads Gene Family Analysis',
        value: true,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: true,
        },
      },
      contigsGeneFamily: {
        text: 'Contigs Gene Family Analysis',
        value: true,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: true,
        },
      },
    },
    readsInputs: {
      virulenceFactorTool: {
        text: 'Virulence Factor (VF) Detection Tool',
        tooltip: `MetaVF Toolkit will identify VFs in PE reads through sequence similarity search using
        VFDB 2.0 <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11402979/" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">[here]</span></a>`,
        value: 'MetaVF Toolkit',
        display: 'MetaVF Toolkit',
        options: [
          { text: 'MetaVF Toolkit', value: 'MetaVF Toolkit' },
          { text: 'PathoFact2', value: 'PathoFact2', disabled: true },
        ],
      },
    },
    contigsInputs: {
      virulenceFactorTool: {
        text: 'Virulence Factor (VF) Detection Tool',
        tooltip: `MetaVF Toolkit will identify VFs in contigs through sequence similarity search using
        VFDB 2.0 <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11402979/" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">[here]</span></a>; PathoFact2.`,
        value: 'MetaVF Toolkit',
        display: 'MetaVF Toolkit',
        options: [
          { text: 'MetaVF Toolkit', value: 'MetaVF Toolkit' },
          { text: 'PathoFact2', value: 'PathoFact2' },
        ],
      },
    },
    // only for input with validation method
    validInputs: {
      contigsInputs: {},
    },
  },
}
