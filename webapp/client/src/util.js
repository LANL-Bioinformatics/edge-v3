export const workflowList = {
  sra2fastq: {
    label: 'Download SRA Data',
    category: 'data',
    info: 'This tool retrieves sequence project in FASTQ files from NCBI- SRA / EBI - ENA / DDBJ database. Input accession number supports studies(SRP*/ ERP * /DRP*), experiments (SRX*/ERX * /DRX*), samples(SRS * /ERS*/DRS *), runs(SRR * /ERR*/DRR *), or submissions (SRA * /ERA*/DRA *).',
  },
  // Add more workflows here
  runFaQCs: {
    label: 'Reads QC',
    category: 'metagenomics',
    info: 'Assessment of quality control is performed by FaQCs. It ensures that the data entering further analysis—such as assembly, annotation, or taxonomic classification—meets stringent quality standards. FaQCs provides a comprehensive overview of the quality of sequencing reads, including metrics such as read length, base quality scores, and adapter contamination.',
  },
  assembly: {
    label: 'Assembly',
    category: 'metagenomics',
    info: 'EDGE provides the IDBA, Spades, MegaHit for illumina reads, LRASM includes miniasm and wtdbg2 algorithm and (meta)flye for PacBio/Nanopore reads, and Unicycler for bacteria genomes hybrid assembly. These assembly tools are to accommodate a range of sample types and data sizes.',
  },
  annotation: {
    label: 'Annotation',
    category: 'metagenomics',
    info: 'Prokka and RATT are provided for ab initio or transfer annotation from closely related reference genome. Prokka is a software tool for rapid prokaryotic genome annotation, while RATT (Rapid Annotation Transfer Tool) is used to transfer annotations from a reference genome to a related genome based on sequence similarity.',
  },
  binning: {
    label: 'Binning',
    category: 'metagenomics',
    info: 'The binning program in EDGE is MaxBin2. MaxBin2 is a tool designed for metagenomic binning, where it clusters assembled contigs from metagenomes into genome bins based on sequence composition and abundance information.',
  },
  antiSmash: {
    label: 'AntiSmash',
    category: 'metagenomics',
    info: 'EDGE use antiSMASH v6.1.1 for the rapid genome-wide identification, annotation and analysis of secondary metabolite biosynthesis gene clusters in bacterial and fungal genomes.',
  },
  taxonomy: {
    label: 'Taxonomy Classification',
    category: 'metagenomics',
    info: 'Multiple tools (Gottcha, PanGiA, Kraken2, Centrifuge, Metaphlan etc.) are used and the results are summarized in heat map and radar plots. Individual tool results are also presented with taxonomy dendrograms and Krona plots. Contig classification occurs by assigning taxonomies to all possible portions of contigs. For each contig, the longest and best match (using minimap2 ) is kept for any region within the contig and the region covered is assigned to the taxonomy of the hit. The next best match to a region of the contig not covered by prior hits is then assigned to that taxonomy. The contig results can be viewed by length of assembly coverage per taxa or by number of contigs per taxa.',
  },
  phylogeny: {
    label: 'Phylogeny Analysis',
    category: 'metagenomics',
    info: 'Phylogeny Analysis workflow is a whole genome SNP-based analysis that uses one reference assembly to which both reads and contigs are mapped. Because this analysis is based on read alignments and/or contig alignments to the reference genome(s), we strongly recommend only selecting genomes that can be adequately aligned at the nucleotide level (i.e. ~90% identity or better). The number of ‘core’ nucleotides able to be aligned among all genomes, and the number of SNPs within the core, are what determine the resolution of the phylogenetic tree.',
  },
  refBased: {
    label: 'Reference-Based Analysis',
    category: 'metagenomics',
    info: 'Reference-Based Analysis workflow ',
  },
  geneFamily: {
    label: 'Gene Family Analysis',
    category: 'metagenomics',
    info: 'Gene Family Analysis workflow ',
  },
}

// match colors in scss/edgescss
export const colors = {
  primary: '#5856d6',
  secondary: '#6b7785',
  success: '#1b9e3e',
  danger: '#e55353',
  warning: '#f9b115',
  info: '#39f',
  light: '#ebedef',
  gray: '#ced2d8',
  dark: '#212631',
  app: '#6a9e5d',
}
