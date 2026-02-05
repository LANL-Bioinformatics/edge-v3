import { workflowList } from 'src/util'

export const workflowOptions = [
  { value: 'runFaQCs', label: workflowList['runFaQCs'].label },
  { value: 'assembly', label: workflowList['assembly'].label },
  { value: 'annotation', label: workflowList['annotation'].label },
  { value: 'binning', label: workflowList['binning'].label },
  { value: 'antiSmash', label: workflowList['antiSmash'].label },
  { value: 'taxonomy', label: workflowList['taxonomy'].label },
  { value: 'phylogeny', label: workflowList['phylogeny'].label },
  { value: 'refBased', label: workflowList['refBased'].label },
  { value: 'geneFamily', label: workflowList['geneFamily'].label },
]

export const taxClassificationOptions = {
  'GOTTCHA-Bacterial-Databases': [
    { value: 'gottcha-genDB-b', label: 'GOTTCHA Genus (Bacterial DB)' },
    { value: 'gottcha-speDB-b', label: 'GOTTCHA Species (Bacterial DB)' },
    { value: 'gottcha-strDB-b', label: 'GOTTCHA Strain (Bacterial DB)' },
  ],
  'GOTTCHA-Viral-Databases': [
    { value: 'gottcha-genDB-v', label: 'GOTTCHA Genus (Viral DB)' },
    { value: 'gottcha-speDB-v', label: 'GOTTCHA Species (Viral DB)' },
    { value: 'gottcha-strDB-v', label: 'GOTTCHA Strain (Viral DB)' },
  ],
  'GOTTCHA2-BacteriaViruses-Databases': [{ value: 'gottcha2-speDB-b', label: 'GOTTCHA2 Species' }],
  'PanGIA-Databases': [{ value: 'pangia', label: 'PanGIA NCBI Refseq89' }],
  'Reads-Mapping': [{ value: 'bwa', label: 'Reads Mapping (BWA against RefSeq)' }],
  'Other-Tools': [
    { value: 'metaphlan4', label: 'MetaPhlAn4' },
    { value: 'kraken2', label: 'Kraken2' },
    { value: 'centrifuge', label: 'Centrifuge' },
    { value: 'diamond', label: 'DIAMOND (Amino acid-based classification)' },
  ],
  'classification-tools-default': [
    { value: 'gottcha-speDB-b', label: 'GOTTCHA Species (Bacterial DB)' },
    { value: 'gottcha-speDB-v', label: 'GOTTCHA Species (Viral DB)' },
    { value: 'gottcha2-speDB-b', label: 'GOTTCHA2 Species' },
    { value: 'pangia', label: 'PanGIA NCBI Refseq89' },
    { value: 'metaphlan4', label: 'MetaPhlAn4' },
    { value: 'kraken2', label: 'Kraken2' },
    { value: 'centrifuge', label: 'Centrifuge' },
  ],
}

export const inputRawReads = {
  validForm: false,
  errMessage: 'input error',
  files: [],
  inputs: {
    source: {
      text: 'Input Source',
      value: 'fastq',
      display: 'READS/FASTQ',
      options: [
        { text: 'READS/FASTQ', value: 'fastq' },
        { text: 'CONTIGS/FASTA', value: 'fasta' },
        { text: 'NCBI SRA', value: 'sra' },
      ],
    },
    seqPlatform: {
      text: 'Sequencing Platform',
      value: 'Illumina',
      display: 'Illumina',
      tooltip:
        'Illumina: high-throughput, short-read sequencing with high accuracy. Nanopore and Pacbio: long reads sequencing technologies.',
      options: [
        { text: 'Nanopore', value: 'Nanopore' },
        { text: 'Illumina', value: 'Illumina' },
        { text: 'PacBio', value: 'PacBio' },
      ],
    },
    paired: {
      text: 'Paired-End?',
      value: true,
    },
    inputFiles: {
      text: ' Files',
      value: [],
      display: [],
    },
  },
  fastqInput: {
    text: 'Fastq File',
    tooltip:
      'Either paired-end Illumina data or single-end data from various sequencing platform in FASTQ format as the input; the file can be becompressed. <br/>Acceptable file name extensions: .fastq, .fq, .fastq.gz, .fq.gz<br />Note: The file size limit for the URL input is 10GB',
    enableInput: true,
    placeholder: 'Select a file or enter a file http(s) url',
    dataSources: ['upload', 'public'],
    fileTypes: ['fastq', 'fq', 'fastq.gz', 'fq.gz'],
    projectTypes: [],
    projectScope: ['self+shared'],
    viewFile: false,
    isOptional: false,
    cleanupInput: true,
    maxInput: 1000,
  },
  fastaInput: {
    text: 'Contig Fasta File',
    tooltip:
      'Acceptable file name extensions: .fasta, .fa, .fna, .contigs<br />Note: The file size limit for the URL input is 10GB',
    enableInput: true,
    placeholder: 'Select a file or enter a file http(s) url',
    dataSources: ['upload', 'public'],
    fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
    projectTypes: [],
    projectScope: ['self+shared'],
    viewFile: false,
    isOptional: false,
    cleanupInput: true,
    maxInput: 1000,
  },
  sraInput: {
    text: 'SRA Accession(s)',
    isOptional: false,
    note: '<span className="text-muted edge-text-size-small"> \
    (Internet required) Input SRA accessions (comma separate for &gt; 1 input) support studies (SRP*/ERP*/DRP*), \
    experiments (SRX*/ERX*/DRX*), samples (SRS*/ERS*/DRS*), runs (SRR*/ERR*/DRR*), or submissions (SRA*/ERA*/DRA*). \
    ex: <a target="_blank" href="https://www.ncbi.nlm.nih.gov/sra/?term=SRR1553609" rel="noopener noreferrer">SRR1553609</a> \
    </span>',
  },
  // only for input with validation method
  validInputs: {
    inputFiles: { isValid: false, error: 'Data input error.' },
  },
}

export const workflows = {
  runFaQCs: {
    validForm: false,
    errMessage: 'input error',
    paramsOn: true,
    files: [],
    rawReadsInput: {
      source: 'fastq',
      text: 'READS/FASTQ',
      tooltip:
        'ReadsQC requires either paired-end Illumina data or single-end data from various sequencing platform in FASTQ format as the input; the file can be becompressed. <br/>Acceptable file name extensions: .fastq, .fq, .fastq.gz, .fq.gz<br />Note: The file size limit for the URL input is 10GB',
      sourceOptions: [
        { text: 'READS/FASTQ', value: 'fastq' },
        { text: 'NCBI SRA', value: 'sra' },
      ],
      fastq: {
        enableInput: true,
        placeholder: 'Select a file or enter a file http(s) url',
        dataSources: ['upload', 'public'],
        fileTypes: ['fastq', 'fq', 'fastq.gz', 'fq.gz'],
        projectTypes: [],
        projectScope: ['self+shared'],
        viewFile: false,
        isOptional: false,
        cleanupInput: true,
        maxInput: 1000,
      },
    },
    inputs: {
      trimQual: {
        text: 'Trim Quality Level',
        tooltip: 'Targets # as quality level (default 20) for trimming',
        value: 20,
        rangeInput: {
          defaultValue: 20,
          min: 0,
          max: 40,
          step: 1,
        },
      },
      trim5end: {
        text: "Cut #bp from 5'-end",
        tooltip: 'Cut # bp from 5 end before quality trimming/filtering',
        value: 0,
        rangeInput: {
          defaultValue: 0,
          min: 0,
          max: 100,
          step: 1,
        },
      },
      trim3end: {
        text: "Cut #bp from 3'-end",
        tooltip: 'Cut # bp from 3 end before quality trimming/filtering',
        value: 0,
        rangeInput: {
          defaultValue: 0,
          min: 0,
          max: 100,
          step: 1,
        },
      },
      trimAdapter: {
        text: 'Trim Adapter',
        tooltip: 'Trim reads with illumina adapter/primers (default: No)',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      trimRate: {
        text: 'Trim Adapter mismatch ratio',
        tooltip: "Mismatch ratio of adapters' length(default : 0.2, allow 20% mismatches) ",
        value: 0.2,
        rangeInput: {
          defaultValue: 0.2,
          min: 0.0,
          max: 1.0,
          step: 0.01,
        },
      },
      trimPolyA: {
        text: 'Trim polyA',
        tooltip: 'Trim poly A ( > 15 )',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      artifactFile: {
        text: 'Adapter/Primer FASTA',
        tooltip:
          'Additional artifact (adapters/primers/contaminations) reference file in fasta format',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      minLen: {
        text: 'Minimum Read Length',
        tooltip:
          'Trimmed read should have to be at least this minimum length (default:50, range: 0 - 1000)',
        value: 50,
        integerInput: {
          defaultValue: 50,
          min: 0,
          max: 1000,
        },
      },
      avgQual: {
        text: 'Average Quality Cutoff',
        tooltip: 'Average quality cutoff (default:0, no filtering)',
        value: 0,
        rangeInput: {
          defaultValue: 0,
          min: 0,
          max: 40,
          step: 1,
        },
      },
      numN: {
        text: '"N" Base Cutoff',
        tooltip:
          'Trimmed read has greater than or equal to this number of continuous base "N" will be discarded. (default: 2, "NN")',
        value: 2,
        rangeInput: {
          defaultValue: 2,
          min: 1,
          max: 10,
          step: 1,
        },
      },
      filtLC: {
        text: 'Low Complexity Filter',
        tooltip:
          'Low complexity filter ratio, Maximum fraction of mono-/di-nucleotide sequence  (default: 0.85)',
        value: 0.85,
        rangeInput: {
          defaultValue: 0.85,
          min: 0.0,
          max: 1.0,
          step: 0.01,
        },
      },
      filtPhiX: {
        text: 'Filter phiX',
        tooltip: 'Filter phiX reads',
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
      artifactFile: { isValid: true, error: 'Adapter/Primer FASTA error. Invalid url' },
      minLen: { isValid: true, error: 'Minimum Read Length error. Range: 0 - 1000' },
    },
  },
  assembly: {
    validForm: false,
    errMessage: 'input error',
    paramsOn: true,
    files: [],
    rawReadsInput: {
      source: 'fastq',
      text: 'READS/FASTQ',
      tooltip:
        'Assembly requires either paired-end Illumina data or single-end data from various sequencing platform in FASTQ format as the input; the file can be becompressed. <br/>Acceptable file name extensions: .fastq, .fq, .fastq.gz, .fq.gz<br />Note: The file size limit for the URL input is 10GB',
      sourceOptions: [
        { text: 'READS/FASTQ', value: 'fastq' },
        { text: 'NCBI SRA', value: 'sra' },
      ],
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
    },
    inputs: {
      assembler: {
        text: 'Assembler',
        tooltip:
          'IDBA_UD performs well on isolates as well as metagenomes but it may not work well on very large genomes; SPAdes performs well on isolates as well as single cell data but it may not work on larger genomes, and it takes more computational resource. PacBio CLR and Oxford Nanopore reads are used for gap closure and repeat resolution.; MEGAHIT is an ultra-fast single-node solution for large and complex metagenomics assembly via succinct de Bruijn graph which achieves low memory assembly.; Unicycler is an assembly pipeline for bacterial genomes. It can assemble Illumina-only read sets where it functions as a SPAdes-optimise. For the best possible assemblies, give it both Illumina reads and long reads, and it will conduct a hybrid assembly.; LRASM is designed for long noise reads such as reads from Nanopore and it assemble fastq/fasta formatted reads using miniasm/wtdbg2/flye and use racon to perform consensus.',
        value: 'IDBA_UD',
        display: 'IDBA_UD',
        options: [
          { text: 'IDBA_UD', value: 'IDBA_UD' },
          { text: 'SPAdes', value: 'SPAdes' },
          { text: 'MEGAHIT', value: 'MEGAHIT' },
          { text: 'UniCycler', value: 'UniCycler' },
          { text: 'LRASM', value: 'LRASM' },
        ],
        notes: {
          IDBA_UD:
            '<a href="https://github.com/loneknightpy/idba" target="_blank" rel="noopener noreferrer">IDBA_UD</a> performs well on isolates as well as metagenomes but it may not work well on very large genomes.',
          SPAdes:
            '<a href="https://github.com/ablab/spades" target="_blank" rel="noopener noreferrer">SPAdes</a> performs well on isolates as well as single cell data but \
          it may not work on larger genomes, and it takes more computational resource.PacBio CLR and Oxford Nanopore reads are used for gap closure and repeat resolution.',
          MEGAHIT:
            '<a href="https://github.com/voutcn/megahit" target="_blank" rel="noopener noreferrer">MEGAHIT</a> is an ultra-fast single-node solution for large and complex metagenomics assembly via succinct de Bruijn graph which achieves low memory assembly.',
          UniCycler:
            '<a href="https://github.com/rrwick/Unicycler" target="_blank" rel="noopener noreferrer">Unicycler</a> is an assembly pipeline for bacterial genomes. \
          It can assemble Illumina-only read sets where it functions as a SPAdes-optimise. \
          For the best possible assemblies, give it both Illumina reads and long reads, and it will conduct a hybrid assembly. ',
          LRASM:
            '<a href="https://gitlab.com/chienchi/long_read_assembly" target="_blank" rel="noopener noreferrer">LRASM</a> is designed for long noise reads such as reads \
          from Nanopore and it assemble fastq/fasta formatted reads using minimap2/miniasm and use racon to perform consensus.',
        },
      },
      minContigSize: {
        text: 'Minimum Contig Length',
        tooltip:
          'Trimmed read should have to be at least this minimum length (default:200, range: 0 - 1000)',
        value: 200,
        integerInput: {
          defaultValue: 200,
          min: 0,
          max: 1000,
        },
      },
      aligner: {
        text: 'Validation Aligner',
        tooltip:
          'After assembly, the reads will use the aligner mapped to assembled contigs for validation.',
        value: 'bwa',
        display: 'Bowtie 2',
        options: [
          { text: 'Bowtie 2', value: 'bowtie2' },
          { text: 'BWA mem', value: 'bwa' },
          { text: 'Minimap2', value: 'minimap2' },
        ],
      },
      aligner_options: {
        text: 'Aligner Options',
        value: null,
        tooltip:
          'Click &nbsp;<a href="http://bowtie-bio.sourceforge.net/bowtie2/manual.shtml#usage" target="_blank" rel="noopener noreferrer">' +
          '<span style="color:yellow;">Bowtie2</span></a> &nbsp;|&nbsp; ' +
          '&nbsp;<a href="http://bio-bwa.sourceforge.net/bwa.shtml#3" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">BWA mem</span></a> &nbsp;|&nbsp; ' +
          '&nbsp;<a href="https://lh3.github.io/minimap2/minimap2.html" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">Minimap2</span></a>&nbsp; for detail.',
        textInput: {
          placeholder: '(optional)',
          showError: false,
          isOptional: true,
          showErrorTooltip: true,
          defaultValue: null,
        },
      },
      extractUnmapped: {
        text: 'Extract Unmapped/Unassembled Reads',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
    },
    assemblerInputs: {
      IDBA_UD: {
        idba_minK: {
          text: 'Minimum Kmer Length',
          value: 31,
          rangeInput: {
            defaultValue: 31,
            min: 1,
            max: 99,
            step: 1,
          },
        },
        idba_maxK: {
          text: 'Maximum Kmer Length',
          value: 121,
          rangeInput: {
            defaultValue: 121,
            min: 1,
            max: 151,
            step: 1,
          },
        },
        idba_step: {
          text: 'Step Size',
          value: 20,
          rangeInput: {
            defaultValue: 20,
            min: 1,
            max: 50,
            step: 1,
          },
        },
      },
      SPAdes: {
        spades_algorithm: {
          text: 'Algorithm',
          tooltip:
            '<table border="1"><tbody>' +
            '<tr><th>Algorithm</th><th>Targeting applications</th></tr>' +
            '<tr><td>Default</td><td>General genome assembly</td></tr>' +
            '<tr><td>Single-cell</td><td>MDA (single-cell) data</td></tr>' +
            '<tr><td>Metagenome</td><td>Complex metagenome assembly</td></tr>' +
            '<tr><td>Plasmids</td><td>plasmidSPAdes pipeline for plasmid detection</td></tr>' +
            '<tr><td>RNAseq</td><td>Transcriptome assembly</td></tr>' +
            '<tr><td>Biosynthetic</td><td>non-ribosomal and polyketide gene clusters assembly</td></tr>' +
            '<tr><td>Corona</td><td>coronavirus assembly</td></tr>' +
            '<tr><td>Metaviral</td><td>extracting extrachromosomal elements from metagenomic assemblies</td></tr>' +
            '<tr><td>Metaplasmid</td><td>plasmid detection in metagenomic datasets</td></tr>' +
            '<tr><td>RNA viral</td><td>virus assembly module from RNA-Seq data</td></tr>' +
            '</tbody></table>',
          value: 'default',
          display: 'Default',
          options: [
            { value: 'default', label: 'Default' },
            { value: 'singlecell', label: 'Single-cell (MDA)' },
            { value: 'metagenome', label: 'Metagenome (metaSPAdes)' },
            { value: 'plasmid', label: 'Plasmids (plasmidSPAdes)' },
            { value: 'rna', label: 'RNASeq (rnaSPAdes)' },
            { value: 'biosyntheticSPAdes', label: 'Biosynthetic(biosyntheticSPAdes)' },
            { value: 'coronaSPAdes', label: 'Corona(coronaSPAdes)' },
            { value: 'metaviralSPAdes', label: 'Metaviral(metaviralSPAdes)' },
            { value: 'metaplasmidSPAdes', label: 'Metaplasmid(metaplasmidSPAdes)' },
            { value: 'rnaviralSPAdes', label: 'RNA viral(rnaviralSPAdes)' },
          ],
        },
        spades_pacbio: {
          text: 'Pacbio Subreads Fasta/q',
          value: null,
          display: null,
          fileInput: {
            enableInput: true,
            placeholder: '(Optional) Select a file or enter a file http(s) url',
            dataSources: ['upload', 'public'],
            fileTypes: ['fasta', 'fa', 'fna', 'contigs', 'fastq', 'fq'],
            viewFile: false,
            isOptional: true,
            cleanupInput: true,
          },
        },
        spades_nanopore: {
          text: 'Nanopore Reads Fasta/q',
          value: null,
          display: null,
          fileInput: {
            enableInput: true,
            placeholder: '(Optional) Select a file or enter a file http(s) url',
            dataSources: ['upload', 'public'],
            fileTypes: ['fasta', 'fa', 'fna', 'contigs', 'fastq', 'fq'],
            viewFile: false,
            isOptional: true,
            cleanupInput: true,
          },
        },
      },
      MEGAHIT: {
        megahit_preset: {
          text: 'Preset',
          tooltip:
            '<table border="1"><tbody>' +
            '<tr><th>Presets</th><th>Targeting applications</th></tr>' +
            '<tr><td>meta</td><td>General metagenome assembly, such as guts</td></tr>' +
            '<tr><td>meta-sensitive</td><td>More sensitive metagenome assembly, but slower</td></tr>' +
            '<tr><td>meta-large</td><td>Large and complex metagenome assembly, such as soil</td></tr>' +
            '</tbody></table>',
          value: 'meta',
          display: 'meta',
          options: [
            { value: 'meta', label: 'meta' },
            { value: 'meta-sensitive', label: 'meta-sensitive' },
            { value: 'meta-large', label: 'meta-large' },
          ],
        },
      },
      UniCycler: {
        Unicycler_bridgingMode: {
          text: 'Bridging Mode',
          tooltip:
            'Normal = moderate contig size and misassembly rate; Conservative = smaller contigs, lowest misassembly rate; Bold = longest contigs, higher misassembly rate.',
          value: 'normal',
          display: 'Normal',
          options: [
            { text: 'Normal', value: 'normal' },
            { text: 'Conservative', value: 'conservative' },
            { text: 'Bold', value: 'bold' },
          ],
        },
        Unicycler_longreads: {
          text: 'Long Reads Fasta/q',
          value: null,
          display: null,
          fileInput: {
            enableInput: true,
            placeholder: '(Optional) Select a file or enter a file http(s) url',
            dataSources: ['upload', 'public'],
            fileTypes: ['fasta', 'fa', 'fna', 'contigs', 'fastq', 'fq'],
            viewFile: false,
            isOptional: true,
            cleanupInput: true,
          },
        },
        Unicycler_minLongReads: {
          text: 'Minimum Long Reads Cutoff (bp)',
          tooltip: 'Default:2000, range: 1 - 10000',
          value: 2000,
          integerInput: {
            defaultValue: 2000,
            min: 1,
            max: 10000,
          },
        },
      },
      LRASM: {
        Lrasm_algorithm: {
          text: 'Algorithm',
          tooltip:
            '<a href="https://www.ncbi.nlm.nih.gov/pubmed/27153593" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">miniasm</span></a> ' +
            'is a fast OLC-based de novo assembler for noisy long reads. It takes all-vs-all read self-mappings ' +
            '(<a href="https://github.com/lh3/minimap2" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">minimap2</span></a>) as input and outputs an assembly graph ' +
            'in the GFA format. <a href="https://github.com/ruanjue/wtdbg2" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">wtdbg2</span></a> uses fuzzy Bruijn graph approach to ' +
            'do long noisy reads assembly. It is able to assemble large/deep/complex genome at a speed tens of times faster than OLC-based assembler ' +
            'with comparable base accuracy. ' +
            '<a href="https://github.com/mikolmogorov/Flye" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">Flye</span></a> is ' +
            'a de novo assembler for single molecule sequencing reads, such as those produced by PacBio and Oxford Nanopore Technologies. ' +
            'It is designed for a wide range of datasets, from small bacterial projects to large mammalian-scale assemblies. metaFlye is a special mode of Flye for metagenome assembly.',
          value: 'flye',
          display: 'flye',
          options: [
            { text: 'minasm', value: 'minasm' },
            { text: 'wtdbg2', value: 'wtdbg2' },
            { text: 'flye', value: 'flye' },
            { text: 'metaFlye', value: 'metaFlye' },
          ],
        },
        Lrasm_ec: {
          text: 'Error Correction',
          tooltip:
            'Reads Error-correction by racon using all-vs-all pairwise overlaps between reads including dual overlaps. This step is computationally intensive in terms of memory and time usage.',
          value: false,
          switcher: {
            trueText: 'Yes',
            falseText: 'No',
            defaultValue: false,
          },
        },
        Lrasm_preset: {
          text: 'Preset',
          value: 'nanopore',
          display: 'Nanopore',
          options: [
            { text: 'Nanopore', value: 'nanopore' },
            { text: 'Nanopore HQ', value: 'nanopore-hq' },
            { text: 'Pacbio', value: 'pacbio' },
            { text: 'Pacbio HiFi', value: 'pacbio-hifi' },
          ],
        },
        Lrasm_numConsensus: {
          text: 'Num of Iteration of Consensus',
          value: 3,
          rangeInput: {
            defaultValue: 3,
            min: 1,
            max: 5,
            step: 1,
          },
        },
      },
    },
    // only for input with validation method
    validInputs: {
      IDBA_UD: {
        minContigSize: { isValid: true, error: 'Minimum Read Length error. Range: 0 - 1000' },
      },
      SPAdes: {
        minContigSize: { isValid: true, error: 'Minimum Read Length error. Range: 0 - 1000' },
        spades_pacbio: { isValid: true, error: 'Pacbio Subreads Fasta/q error. Invalid url' },
        spades_nanopore: { isValid: true, error: 'Nanopore Reads Fasta/q error. Invalid url' },
      },
      MEGAHIT: {
        minContigSize: { isValid: true, error: 'Minimum Read Length error. Range: 0 - 1000' },
      },
      UniCycler: {
        minContigSize: { isValid: true, error: 'Minimum Read Length error. Range: 0 - 1000' },
        Unicycler_longreads: { isValid: true, error: 'Long Reads Fasta/q error. Invalid url' },
        Unicycler_minLongReads: {
          isValid: true,
          error: 'Minimum Long Reads Cutoff (bp) error. Range: 1 - 10000',
        },
      },
      LRASM: {
        minContigSize: { isValid: true, error: 'Minimum Read Length error. Range: 0 - 1000' },
      },
    },
  },
  annotation: {
    validForm: false,
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
        projectTypes: ['assembly'],
        projectScope: ['self+shared'],
        viewFile: false,
        isOptional: false,
        cleanupInput: true,
        maxInput: 1,
      },
    },
    inputs: {
      minContigSize: {
        text: 'Minimum Contig Length',
        tooltip: 'Default:700, range: 1 - 10000',
        value: 700,
        integerInput: {
          defaultValue: 700,
          min: 1,
          max: 10000,
        },
      },
      annotateProgram: {
        text: 'Annotation Tool',
        tooltip:
          'Prokka is ab initio annotation tool. RATT will transfer the annotation from the provided closest relatvie genome annotation.',
        value: 'prokka',
        display: 'Prokka',
        options: [
          { text: 'Prokka', value: 'prokka' },
          { text: 'RATT', value: 'ratt' },
        ],
      },
    },
    annotateProgramInputs: {
      prokka: {
        taxKingdom: {
          text: 'Specify Kingdom',
          tooltip:
            'Please choose the genome type you would like to annotate for Prokka to do genome annotation.',
          value: 'bacteria',
          display: 'Bacteria',
          options: [
            { text: 'Archaea', value: 'archaea' },
            { text: 'Bacteria', value: 'bacteria' },
            { text: 'Mitochondria', value: 'mitochondria' },
            { text: 'Viruses', value: 'viruses' },
            { text: 'Metagenome', value: 'metagenome' },
          ],
          gcodes: {
            archaea: 11,
            bacteria: 11,
            mitochondria: 5,
            viruses: 1,
            metagenome: 11,
          },
        },
        gcode: {
          text: 'Genetic Code',
          tooltip:
            'The genetic code will change according to the kingdom selected. Default is 11. 1 for viruses, 5 fro mitochondria. Or you can specify it here.',
          value: 11,
          rangeInput: {
            defaultValue: 11,
            min: 1,
            max: 33,
            step: 1,
          },
        },
        customProtein: {
          text: 'Protein FASTA/GenBank for Prokka',
          tooltip: 'Protein FASTA or GBK file to use as 1st priority annoation sources',
          value: null,
          display: null,
          fileInput: {
            enableInput: true,
            placeholder: '(Optional) Select a file or enter a file http(s) url',
            dataSources: ['upload', 'public'],
            fileTypes: ['fasta', 'fa', 'fna', 'contigs', 'gb', 'gbk', 'genbank'],
            viewFile: false,
            isOptional: true,
            cleanupInput: true,
          },
        },
        customHMM: {
          text: 'Trusted HMM for Prokka',
          tooltip: 'Trusted HMM to first annotate from',
          value: null,
          display: null,
          fileInput: {
            enableInput: true,
            placeholder: '(Optional) Select a file or enter a file http(s) url',
            dataSources: ['upload', 'public'],
            fileTypes: ['hmm'],
            viewFile: false,
            isOptional: true,
            cleanupInput: true,
          },
        },
        evalue: {
          text: 'Similarity e-value cut-off1',
          value: '1e-09',
          textInput: {
            placeholder: '(required)',
            showError: false,
            isOptional: false,
            showErrorTooltip: true,
            errMessage: 'Required.',
            defaultValue: '1e-09',
          },
        },
        keggView: {
          text: 'KEGG Pathway View',
          tooltip: 'Visualize Prokka annotation in KEGG map. Need Internet Connection',
          value: true,
          switcher: {
            trueText: 'Yes',
            falseText: 'No',
            defaultValue: true,
          },
        },
      },
      ratt: {
        sourceGBK: {
          text: 'Annotation Source Genbank',
          tooltip:
            'Please provide the reference/source annotation (Genbank file), EDGE will use RATT to transfer the annotation from the reference genome. The reference genome must be close relative to the sample.',
          value: null,
          display: null,
          fileInput: {
            enableInput: true,
            placeholder: '(Required) Select a file or enter a file http(s) url',
            dataSources: ['upload', 'public'],
            fileTypes: ['fasta', 'fa', 'fna', 'contigs', '.gb', '.gbk', '.genbank'],
            viewFile: false,
            isOptional: false,
            cleanupInput: true,
          },
        },
      },
    },

    // only for input with validation method
    validInputs: {
      prokka: {
        minContigSize: {
          isValid: true,
          error: 'Minimum Contig Length error. Default: 700, range: 1 - 10000',
        },
        evalue: { isValid: true, error: 'Similarity e-value cut-off error. Invalid evalue' },
        customProtein: {
          isValid: true,
          error: 'Protein FASTA/GenBank for Prokka error. Invalid url',
        },
        customHMM: {
          isValid: true,
          error: 'Trusted HMM for Prokkas error. Invalid url',
        },
      },
      ratt: {
        minContigSize: { isValid: true, error: 'Minimum Contig Length error. Range: 1 - 10000' },
        sourceGBK: {
          isValid: false,
          error: 'Annotation Source Genbank error. Invalid file input',
        },
      },
    },
  },
  binning: {
    validForm: false,
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
      binningAbundFile: {
        text: 'Abundance File',
        tooltip:
          'Required when input is contig only. Please make sure that your abundance information is provided in the following format (\t stands for a tab delimiter): (contig header)\t(abundance). <br/> \
           For example: <br/>A0001 30.89<br/>A0002 20.02<br/><br/>Note: Acceptable file name extensions: txt, tsv',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Required) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['txt', 'tsv'],
          viewFile: false,
          isOptional: false,
          cleanupInput: true,
        },
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
      binningAbundFile: { isValid: false, error: 'Abundance File input error.' },
    },
  },
  antiSmash: {
    validForm: true,
    errMessage: 'input error',
    paramsOn: true,
    files: [],
    rawReadsInput: {
      source: 'fasta',
      text: 'CONTIGS/FASTA',
      fasta: {
        text: 'Contig Fasta File',
        tooltip:
          'Acceptable file name extensions: .fasta, .fa, .fna, .contigs, .gb, .gbk, .genbank<br />Note: The file size limit for the URL input is 10GB',
        enableInput: true,
        placeholder: 'Select a file or enter a file http(s) url',
        dataSources: ['upload', 'public', 'project'],
        fileTypes: ['fasta', 'fa', 'fna', 'contigs', 'gb', 'gbk', 'genbank'],
        projectTypes: ['assembly', 'annotation'],
        projectScope: ['self+shared'],
        viewFile: false,
        isOptional: false,
        cleanupInput: true,
        maxInput: 1,
      },
    },
    inputs: {
      smaTaxon: {
        text: 'Taxon',
        tooltip:
          'EDGE use antiSMASH v6.1.1 for the rapid genome-wide identification, annotation and analysis of secondary metabolite biosynthesis gene clusters in bacterial and fungal genomes.',
        value: 'bacteria',
        display: 'bacteria',
        options: [
          { text: 'bacteria', value: 'bacteria' },
          { text: 'fungi', value: 'fungi' },
        ],
      },
      knownclusterblast: {
        text: 'Known ClusterBlast',
        tooltip: 'Compare identified clusters against known gene clusters from the MIBiG database.',
        value: true,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: true,
        },
      },
      subclusterblast: {
        text: 'Sub ClusterBlast',
        tooltip:
          'Compare identified clusters against known subclusters responsible for synthesising precursors.',
        value: true,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: true,
        },
      },
      clusterblast: {
        text: 'ClusterBlast',
        tooltip: 'Compare identified clusters against a database of antiSMASH-predicted clusters.',
        value: false,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: false,
        },
      },
      mibig: {
        text: 'MIBiG cluster comparison',
        tooltip: 'Run a comparison against the MIBiG dataset.',
        value: false,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: false,
        },
      },
      fullhmm: {
        text: 'Cluster Pfam analysis',
        tooltip: 'Run a whole-genome HMMer analysis.',
        value: false,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: false,
        },
      },
      pfam2go: {
        text: 'Pfam-based GO term annotation',
        tooltip: 'Run Pfam to Gene Ontology mapping module.',
        value: false,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: false,
        },
      },
      asf: {
        text: 'Active Site Finder',
        tooltip: 'Run active site finder module.',
        value: true,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: true,
        },
      },
      rre: {
        text: 'RREFinder',
        tooltip: 'Run RREFinder precision mode on all RiPP gene clusters.',
        value: true,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: true,
        },
      },
      tigrfam: {
        text: 'TIGRFam analysis',
        tooltip: 'Annotate clusters using TIGRFam profiles.',
        value: false,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: false,
        },
      },
      cassis: {
        text: 'Cluster-border prediction based on transcription factor binding sites (CASSIS)',
        tooltip: 'Use CASSIS algorithm for cluster border prediction (fungal seqs only).',
        value: false,
        switcher: {
          trueText: 'On',
          falseText: 'Off',
          defaultValue: false,
        },
      },
    },
    // only for input with validation method
    validInputs: {},
  },
  taxonomy: {
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
      contigTax: {
        text: 'Contigs Classification',
        tooltip:
          'EDGE will map contigs to NCBI genomes using minimap2 and make a taxonomic inference for each contig.',
        value: true,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: true,
        },
      },
    },
    readInputs: {
      readTax: {
        text: 'Reads Classification',
        value: true,
      },
      enabledTools: {
        text: 'Classification Tools',
        tooltip:
          'EDGE uses multiple tools for taxonomy classification including GOTTCHA (bacterial & viral databases), ' +
          'MetaPhlAn4, Kraken and reads mapping to NCBI RefSeq using BWA. Each tool has its own database and you can find the taxonomy information ' +
          'table <a href="https://lanl-bioinformatics.github.io/EDGE/docs/taxonomyDBtable.html" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">[here]</span></a>',
        defaultSelections: taxClassificationOptions['classification-tools-default'],
        value: taxClassificationOptions['classification-tools-default'].map((item) => {
          return item.value
        }),
        display: taxClassificationOptions['classification-tools-default']
          .map((item) => {
            return item.label
          })
          .join(', '),
        toolGroup: [
          {
            label: 'GOTTCHA Bacterial Databases',
            options: taxClassificationOptions['GOTTCHA-Bacterial-Databases'],
          },
          {
            label: 'GOTTCHA Viral Databases',
            options: taxClassificationOptions['GOTTCHA-Viral-Databases'],
          },
          {
            label: 'GOTTCHA2 BacteriaViruses Databases',
            options: taxClassificationOptions['GOTTCHA2-BacteriaViruses-Databases'],
          },
          {
            label: 'PanGIA Databases',
            options: taxClassificationOptions['PanGIA-Databases'],
          },
          {
            label: 'Reads Mapping',
            options: taxClassificationOptions['Reads-Mapping'],
          },
          {
            label: 'Other Tools',
            options: taxClassificationOptions['Other-Tools'],
          },
        ],
      },
      splitTrimMinQ: {
        text: 'Splitrim Quality Level',
        tooltip: 'Splitrim is used for GOTTCHA classification',
        value: 20,
        rangeInput: {
          defaultValue: 20,
          min: 1,
          max: 140,
          step: 1,
        },
      },
      custom_gottcha_genDB_b: {
        text: 'CUSTOM GOTTCHA-genDB-b',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_gottcha_speDB_b: {
        text: 'CUSTOM GOTTCHA-speDB-b',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_gottcha_strDB_b: {
        text: 'CUSTOM GOTTCHA-strDB-b',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_gottcha_genDB_v: {
        text: 'CUSTOM GOTTCHA-genDB-v',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_gottcha_speDB_v: {
        text: 'CUSTOM GOTTCHA-speDB-v',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_gottcha_strDB_v: {
        text: 'CUSTOM GOTTCHA-strDB-v',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_gottcha2_speDB_b: {
        text: 'CUSTOM GOTTCHA2-speDB-b',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_bwa_db: {
        text: 'CUSTOM BWA DB',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_metaphlan_db: {
        text: 'CUSTOM Metaphlan DB',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_kraken_db: {
        text: 'CUSTOM Kraken DB',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_pangia_db: {
        text: 'CUSTOM Pangia DB',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_diamond_db: {
        text: 'CUSTOM Diamond DB',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
      custom_centrifuge_db: {
        text: 'CUSTOM Centrifuge DB',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Optional) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'contigs'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
        },
      },
    },
    // only for input with validation method
    validInputs: {
      readInputs: {
        enabledTools: {
          isValid: true,
          error: 'Classification Tools error: at least 1 tool required',
        },
        custom_gottcha_genDB_b: {
          isValid: true,
          error: 'CUSTOM GOTTCHA-genDB-b error. Invalid url',
        },
        custom_gottcha_speDB_b: {
          isValid: true,
          error: 'CUSTOM GOTTCHA-speDB-b error. Invalid url',
        },
        custom_gottcha_strDB_b: {
          isValid: true,
          error: 'CUSTOM GOTTCHA-strDB-b error. Invalid url',
        },
        custom_gottcha_genDB_v: {
          isValid: true,
          error: 'CUSTOM GOTTCHA-genDB-v error. Invalid url',
        },
        custom_gottcha_speDB_v: {
          isValid: true,
          error: 'CUSTOM GOTTCHA-speDB-v error. Invalid url',
        },
        custom_gottcha_strDB_v: {
          isValid: true,
          error: 'CUSTOM GOTTCHA-strDB-v error. Invalid url',
        },
        custom_gottcha2_speDB_b: {
          isValid: true,
          error: 'CUSTOM GOTTCHA2-speDB-b error. Invalid url',
        },
        custom_bwa_db: { isValid: true, error: 'CUSTOM BWA DB error. Invalid url' },
        custom_metaphlan_db: { isValid: true, error: 'CUSTOM Metaphlan DB error. Invalid url' },
        custom_kraken_db: { isValid: true, error: 'CUSTOM Kraken DB error. Invalid url' },
        custom_pangia_db: { isValid: true, error: 'CUSTOM Pangia DB error. Invalid url' },
        custom_diamond_db: { isValid: true, error: 'CUSTOM Diamond DB error. Invalid url' },
        custom_centrifuge_db: { isValid: true, error: 'CUSTOM Centrifuge DB error. Invalid url' },
      },
    },
  },
  phylogeny: {
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
      treeMaker: {
        text: 'Tree Build Method',
        tooltip: 'FastTree is faster and RAxML is slower but more accurate.',
        value: 'FastTree',
        display: 'FastTree',
        options: [
          { text: 'FastTree', value: 'FastTree' },
          { text: 'RAxML', value: 'RAxML' },
        ],
      },
      snpDBname: {
        text: 'Pre-built SNP DB',
        tooltip:
          'EDGE supports 5 pre-computed databases for SNP phylogeny analysis. The genomes list can be found at https://edge.readthedocs.io/en/develop/database.html#snp-db.',
        value: null,
        display: null,
        options: [
          { value: 'Ecoli', label: 'Ecoli' },
          { value: 'Yersinia', label: 'Yersinia' },
          { value: 'Francisella', label: 'Francisella' },
          { value: 'Brucella', label: 'Brucella' },
          { value: 'Bacillus', label: 'Bacillus' },
        ],
      },
      phameBootstrap: {
        text: 'Bootstrap',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      phameBootstrapNum: {
        text: 'Bootstrap Number',
        value: 100,
        integerInput: {
          defaultValue: 100,
          min: 1,
          max: 1000,
        },
      },
    },
    genomeInputs: {
      snpGenomes: {
        text: 'Select Genome(s)',
        tooltip:
          'This workflow is a whole genome SNP based analysis that requires at minimum one reference genome and at least three dataset for building the phylogenetic tree. Because this analysis is based on read alignments and/or contig alignments to the reference genome(s), we strongly recommend only selecting genomes that can be adequately aligned at the nucleotide level (i.e. ~90% identity or better).',
        value: [],
        display: [],
        asyncSelectInput: {
          placeholder: 'Select at least 3 but no more than 20 genomes',
          min: 3,
          max: 20,
          //max search results to display
          maxOptions: 2000,
        },
      },
      snpRefGenome: {
        text: 'Select A Reference Genome from Selected Genomes',
        value: 'Random',
        display: 'Random',
      },
      snpGenomesFiles: {
        text: 'Add Genome(s)',
        value: [],
        display: [],
        fileInputArray: {
          text: 'Genome',
          enableInput: true,
          placeholder: 'Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna'],
          projectTypes: [],
          projectScope: ['self+shared'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
          maxInput: 100,
        },
      },
      phylAccessions: {
        text: 'SRA Accession(s)',
        tooltip:
          '(Internet requried) Input SRA accessions (comma separate for > 1 input) support studies (SRP*/ERP*/DRP*), experiments (SRX*/ERX*/DRX*), samples (SRS*/ERS*/DRS*), runs (SRR*/ERR*/DRR*), or submissions (SRA*/ERA*/DRA*).',
        value: [],
        display: null,
        sraInput: { isOptional: true },
      },
    },
    // only for input with validation method
    validInputs: {
      snpDBname: {
        isValid: false,
        error: 'Pre-built SNP DB error. Please select from precomputed SNP DB or from Genomes list',
      },
      snpGenomes: {
        isValid: true,
        error: 'Select Genome(s) error. Select at least 3 but no more than 20 genomes',
      },
      snpGenomesFiles: { isValid: false, error: 'Add Genome(s) error. Invalid input' },
      phylAccessions: {
        isValid: true,
        error: 'SRA Accessions error. Invalid input',
      },
      phameBootstrapNum: {
        isValid: true,
        error: 'Bootstrap Number error. Invalid integer input. Range: 1 - 1000',
      },
    },
  },
  refBased: {
    validForm: true,
    errMessage: 'input error',
    paramsOn: true,
    files: [],
    rawReadsInput: {
      source: 'fastq',
      text: 'READS/FASTQ',
      sourceOptions: [
        { text: 'READS/FASTQ', value: 'fastq' },
        { text: 'NCBI SRA', value: 'sra' },
      ],
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
    },
    inputs: {
      selectGenomes: {
        text: 'Select Genome(s)',
        tooltip:
          'List of genome name from NCBI genomes see https://raw.githubusercontent.com/LANL-Bioinformatics/EDGE/refs/heads/devel/edge_ui/data/Ref_list.json',
        value: [],
        display: [],
        asyncSelectInput: {
          placeholder: 'Select no more than 20 genomes',
          min: 0,
          max: 20,
          //max search results to display
          maxOptions: 2000,
        },
      },
      referenceGenomes: {
        text: 'Reference Genome',
        value: [],
        display: [],
        fileInputArray: {
          text: 'Genome',
          enableInput: true,
          placeholder: 'Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public'],
          fileTypes: ['fasta', 'fa', 'fna', 'genbank', 'gb', 'gbk', 'gbff'],
          projectTypes: [],
          projectScope: ['self+shared'],
          viewFile: false,
          isOptional: true,
          cleanupInput: true,
          maxInput: 100,
        },
      },
      r2gAligner: {
        text: 'Read Aligner',
        tooltip:
          'EDGE use default setting of the aligner. Bowtie2 default is for global alignment and BWA mem algorithm will do local alignment. If users would like to overwrite the setting, users can use "Aligner Options" to do so. For example, use “–local” to run bowtie2 with local alignment mode. Or, use “-x ont2d” to run BWA mem with Nanopore reads.',
        value: 'bwa',
        display: 'Bowtie 2',
        options: [
          { text: 'Bowtie 2', value: 'bowtie2' },
          { text: 'BWA mem', value: 'bwa' },
          { text: 'Minimap2', value: 'minimap2' },
        ],
      },
      r2gAlignerOptions: {
        text: 'Aligner Options',
        value: null,
        tooltip:
          'Click &nbsp;<a href="http://bowtie-bio.sourceforge.net/bowtie2/manual.shtml#usage" target="_blank" rel="noopener noreferrer">' +
          '<span style="color:yellow;">Bowtie2</span></a> &nbsp;|&nbsp; ' +
          '&nbsp;<a href="http://bio-bwa.sourceforge.net/bwa.shtml#3" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">BWA mem</span></a> &nbsp;|&nbsp; ' +
          '&nbsp;<a href="https://lh3.github.io/minimap2/minimap2.html" target="_blank" rel="noopener noreferrer"><span style="color:yellow;">Minimap2</span></a>&nbsp; for detail.',
        textInput: {
          placeholder: '(optional)',
          showError: false,
          isOptional: true,
          showErrorTooltip: true,
          defaultValue: null,
        },
      },
      r2gMinMapQual: {
        text: 'Map Quality',
        tooltip:
          'For coverage calculation and variants call, BWA MEM/minimap2 uses MAPQ=60 for uniquely mapped and bowtie2 uses MAPQ=42.',
        value: 60,
        rangeInput: {
          defaultValue: 60,
          min: 1,
          max: 255,
          step: 1,
        },
      },
      r2gMaxClip: {
        text: 'MaxClip',
        tooltip: 'Use samclip to filter alignment result. Maximum clip length to allow.',
        value: 50,
        rangeInput: {
          defaultValue: 50,
          min: 1,
          max: 300,
          step: 1,
        },
      },
      r2gVariantCall: {
        text: 'Variant Call',
        tooltip:
          'EDGE will use samtools/bcftools (version 1.21) to call variants. See detailed at https://www.htslib.org/workflow/wgs-call.html',
        value: true,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: true,
        },
      },
      r2gMapUnmapped: {
        text: 'Identify Unmapped Reads',
        tooltip:
          'EDGE will try to classify reads that are unmapped to references by mapping them to NCBI RefSeq database.',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      r2gExtractMapped: {
        text: 'Extract Mapped Reads',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      r2gExtractUnmapped: {
        text: 'Extract Unmapped Reads',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      r2gGetConsensus: {
        text: 'Consensus Fasta',
        tooltip: 'Generated Consensus Fasta from the mapping result. See additional for parameters',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
    },
    r2gGetConsensusInputs: {
      r2gConsensusMinMapQual: {
        text: 'Minimum mapQ',
        tooltip: 'Minimum mapping quality for a read to be used in the pileup generation.',
        value: 60,
        rangeInput: {
          defaultValue: 60,
          min: 1,
          max: 255,
          step: 1,
        },
      },
      r2gConsensusMinCov: {
        text: 'Minimum Coverage',
        tooltip: 'Minimum level of coverage required to avoid an N in the consensus.',
        value: 5,
        rangeInput: {
          defaultValue: 5,
          min: 1,
          max: 100,
          step: 1,
        },
      },
      r2gConsensusMaxCov: {
        text: 'Maximum Coverage',
        tooltip: 'Maximum per base coverage to be used in the pileup generation.',
        value: 8000,
        integerInput: {
          defaultValue: 8000,
          min: 1,
          max: 10000,
        },
      },
      r2gConsensusAltProp: {
        text: 'Alternate Base Threshold',
        tooltip:
          'Requires that a greater proportion of the reads (than this threshold) must support an alternative base for the consensus to be changed.',
        value: 0.5,
        rangeInput: {
          defaultValue: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
        },
      },
      r2gConsensusAltIndelProp: {
        text: 'Indels Threshold',
        tooltip:
          'Requires that a greater proportion of the reads (than this threshold) must support an INDELs for the consensus to be changed.',
        value: 0.5,
        rangeInput: {
          defaultValue: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
        },
      },
      r2gConsensusMinBaseQual: {
        text: 'Minimum baseQ',
        tooltip: 'Minimum base quality for a base to be used in the evalution of the consensus.',
        value: 20,
        rangeInput: {
          defaultValue: 20,
          min: 1,
          max: 60,
          step: 1,
        },
      },
      r2gConsensusDisableBAQ: {
        text: 'Disable BAQ',
        tooltip: 'Disable BAQ (per-Base Alignment Quality)',
        value: true,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: true,
        },
      },
      r2gConsensusPCRdedup: {
        text: 'Remove PCR Duplicates',
        tooltip: 'Remove PCR duplicates by samtools markdup',
        value: true,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: true,
        },
      },
      r2gConsensusHomopolymerFilt: {
        text: 'Homopolymer Filter',
        tooltip: 'Filter the INDELs variants < 0.8 INDEL Threshold in homopolymer (>= 4bp) region',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      r2gConsensusStrandBiasFilt: {
        text: 'StrandBias Filter',
        tooltip:
          'Filter the SNP variants based on both Fisher Exact test Phred scaled p value score (>60) and the symmetric odds ratio test score (>3)',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      r2gConsensusVarlogOpt: {
        text: 'Log variant',
        tooltip: '',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
      r2gConsensusCompOpt: {
        text: 'Log compisition',
        tooltip: '',
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
        },
      },
    },
    r2gVariantCallInputs: {
      r2gVariantCallMinQual: {
        text: 'Variant QUAL',
        tooltip:
          'Minimum QUAL SCORE, QUAL phred-scaled quality score for the assertion made in ALT, to filter varaint call result.',
        value: 60,
        rangeInput: {
          defaultValue: 60,
          min: 1,
          max: 255,
          step: 1,
        },
      },
      r2gVariantCallPloidy: {
        text: 'Ploidy',
        tooltip: 'Ploidy for variants call',
        value: 'diploid',
        display: 'Diploid',
        options: [
          { text: 'Haploid', value: 'haploid' },
          { text: 'Diploid', value: 'diploid' },
        ],
      },
    },
    // only for input with validation method
    validInputs: {
      selectGenomes: {
        isValid: false,
        error: 'Select Genome(s) error. Select at least 1 but no more than 20 genomes',
      },
      referenceGenomes: { isValid: true, error: 'Reference genome error. Invalid input' },
      r2gConsensusMaxCov: {
        isValid: true,
        error: 'Maximum Coverage error. Invalid integer input. Range: 1 - 10000',
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
        value: false,
        switcher: {
          trueText: 'Yes',
          falseText: 'No',
          defaultValue: false,
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
      inputFAA: {
        text: 'Input FAA File',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Required) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public', 'project'],
          fileTypes: ['faa'],
          projectTypes: ['annotation'],
          projectScope: ['self+shared'],
          viewFile: false,
          isOptional: false,
          cleanupInput: true,
        },
      },
      inputGFF: {
        text: 'Input GFF File',
        value: null,
        display: null,
        fileInput: {
          enableInput: true,
          placeholder: '(Required) Select a file or enter a file http(s) url',
          dataSources: ['upload', 'public', 'project'],
          fileTypes: ['gff'],
          projectTypes: ['annotation'],
          projectScope: ['self+shared'],
          viewFile: false,
          isOptional: false,
          cleanupInput: true,
        },
      },
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
      contigsInputs: {
        inputFAA: { isValid: false, error: 'Input FAA File error. Required' },
        inputGFF: { isValid: false, error: 'Input GFF File error. Required' },
      },
    },
  },
}
