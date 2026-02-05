#!/usr/bin/env nextflow


process report {
    label 'report'
    publishDir (
    path:"${settings["reportOutDir"]}",
    mode: 'copy',
    saveAs: {
        filename ->
        if(filename.endsWith(".png")) {
            "HTML_Report/images/${filename}"
        }
        else if(filename.endsWith("final_report.pdf")) {
            "${filename}"
        }
        else{
            null //publish no other files at this time
        }
    }
    )

    input:
    val settings
    val platform
    path fastqCount
    path qcStats
    path qcReport
    path hostRemovalReport
    path readsTaxonomyReports
    path contigTaxonomyReport
    path contigStatsReport
    path contigPlots
    path annStats
    path alnstats

    output:
    path "*"

    script:
    //TODO: will need reference-based analysis updates as those workflows develop
    //TODO: add in taxonomy classification reports
    """
    #!/usr/bin/env perl
    use File::Basename;

    my \$time=time();
    my \$Rscript="./merge.R";
    my \$InputLogPDF="./Inputs.pdf";
    my \$ont_flag = ("${platform != null ? platform.trim(): ""}" =~ /NANOPORE/)? 1 : 0; 
    my \$pacbio_flag = ("${platform != null ? platform.trim(): ""}" =~ /PACBIO/)? 1 : 0; 
    my \$mergeFiles="\$InputLogPDF,";
    \$mergeFiles.="$qcReport"."," if ( -s "$qcReport");
    my \$imagesDir = "./HTML_Report/images";
    my \$final_pdf= "./final_report.pdf";


    my \$taxonomyPDFfiles="";
    \$taxonomyPDFfiles .= "$readsTaxonomyReports" if("$readsTaxonomyReports" ne "NO_FILE5");
    \$taxonomyPDFfiles =~ s/\\s/,/g;
    \$taxonomyPDFfiles .= "$contigTaxonomyReport"."," if( -s "$contigTaxonomyReport");


    my \$qc_flag = (${settings['faqcs']})?"V":"";
    my \$host_removal_flag = (${settings['hostRemoval']})?"V":"";
    my \$assembly_flag = (${settings["runAssembly"]})?"V":"";
    my \$annotation_flag = (${settings["annotation"]})?"V":"";
    my \$taxonomy_flag = (${settings["readsTaxonomyAssignment"]})?"V":"";

    my \$features_parameters = "qc<-c(\\"\$qc_flag\\",\\"QC\\")\\nhost<-c(\\"\$host_removal_flag\\",\\"Host Removal\\")\\n
    assembly<-c(\\"\$assembly_flag\\",\\"Assembly\\")\\nannotation<-c(\\"\$assembly_flag\\",\\"Annotation\\")\\n
    taxonomy<-c(\\"\$taxonomy_flag\\",\\"Taxonomy Classification\\")\\n
    primer<-c(\\"\$primer_flag\\",\\"Primer Design\\")\\n";

    open (my \$Rfh, ">\$Rscript") or die "\$Rscript \$!";
    print \$Rfh <<Rscript;
    #first pdf page
    library(grid)
    library(gridExtra)
    pdf(file = "\$InputLogPDF",width = 10, height = 8)

    plot(0:1,0:1,type='n',xlab="",ylab="",xaxt='n',yaxt='n')
    text(0,1,\\"EDGE Version: DEV_3.0\\",adj=0,font=2)
    text(0,1-0.08,\\"Project: ${settings["projName"]}\\",adj=0,font=2)
    nextPos<-1-0.32
    parameters_pos<-nextPos-0.14
    input_pos<-nextPos-0.28
    Rscript

    print \$Rfh <<Rscript;
    text(0,nextPos,"Features:",adj=0,font=2)
    \$features_parameters
    parameters<-rbind(qc,host,assembly,annotation,taxonomy,primer)
    rownames(parameters)<-parameters[,2]
    parameters<-t(parameters)
    parameters[2,]<-\\"\\"
    pushViewport(viewport(x=0.5, y=parameters_pos))
    #grid.table(parameters,show.colnames=TRUE,gpar.coretext = gpar(col = \\"red\\", cex = 0.8))
    grid.table(parameters)
    text(0,nextPos-0.22,\\"Inputs:\\",adj=0,font=2)
    Rscript

    if ( -s '$fastqCount'){ 
    print \$Rfh <<Rscript;
    popViewport(0)
    input<-read.table(file=\\"$fastqCount\\")
    pushViewport(viewport(x=0.35, y=input_pos))
    #grid.table(input,show.rownames = FALSE,cols=c(\\"Inputs\\",\\"Reads\\",\\"Bases\\",\\"Avg_Len\\"),show.box = TRUE)
    grid.table(input,cols=c(\\"Inputs\\",\\"Reads\\",\\"Bases\\",\\"Avg_Len\\"))
    Rscript
    }else{
    print \$Rfh <<Rscript;
    popViewport(0)
    tmp<-dev.off()
    Rscript
    }


    if (-s "$hostRemovalReport"){
        \$mergeFiles .= '$hostRemovalReport'.",";
    }
    if (-s "$contigStatsReport"){
        \$mergeFiles .= '$contigStatsReport'.",";
    }
    if ( -s "$alnstats"){
        \$mergeFiles .= "alnstats.pdf".",".'$contigPlots'.",";

    print \$Rfh <<Rscript;
    pdf(file = "alnstats.pdf",width = 10, height = 8)
    
    readsMappingToContigStats<-readLines("$alnstats")
    readsMappingToContigStats<-gsub("-?nan","0",readsMappingToContigStats,ignore.case = TRUE)
    readsMappingToContigStats<-gsub("\\t"," ",readsMappingToContigStats,ignore.case = TRUE)
    plot(0:1,0:1,type='n',xlab="",ylab="",xaxt='n',yaxt='n')
    for (i in 1:length(readsMappingToContigStats)){
    text(0,1-0.07*i,readsMappingToContigStats[i],adj=0,font=2)
    }
    title("Mapping Reads to Contigs")
    tmp<-dev.off()
    Rscript

    }

    \$mergeFiles .= '$annStats'."," if ( -s '$annStats');

    \$mergeFiles .= \$taxonomyPDFfiles if (\$taxonomyPDFfiles);

    \$mergeFiles =~ s/\\,\$//g;
    my \$command = "R --vanilla --slave --silent < \$Rscript";
    if (system(\$command) != 0)
         { die ("the command \$command failed\\n");}
    my \$command2 = "pdfcat.pl -i \$mergeFiles -o \$final_pdf -f ${settings["projName"]}";
    if (system(\$command2) != 0)
         { die ("the command \$command2 failed\\n");}
    close \$Rfh;
    unlink "\$Rscript";
    unlink \$InputLogPDF;


    my @conversions;
    if ( -s "$qcReport")
    {
        my \$page_count = `pdfPageCount.pl "$qcReport"`;
        chomp \$page_count;
        my \$qc_3d_page = \$page_count - 2 ;
        my \$qc_boxplot_page = \$page_count - 3 ;
        push @conversions, "convert -strip -density 120 -flatten $qcReport[1] ./QC_read_length.png";
        push @conversions, "convert -strip -density 120 -flatten $qcReport[2] ./QC_GC_content.png";
        push @conversions, "convert -strip -density 120 -flatten $qcReport[3] ./QC_nucleotide_content.png";
        push @conversions, "convert -strip -density 120 -flatten $qcReport[\$qc_3d_page] ./QC_quality_report.png";
        push @conversions, "convert -strip -density 120 -flatten $qcReport[\$qc_boxplot_page] ./QC_quality_boxplot.png";
    }

    push @conversions, "convert -strip -density 120 -flatten $hostRemovalReport ./HostRemovalStats.png" if (-s "$hostRemovalReport");
    push @conversions, "convert -strip -density 120 -flatten $contigStatsReport[0] ./Assembly_length.png" if (-s "$contigStatsReport");
    push @conversions, "convert -strip -density 120 -flatten $contigStatsReport[1] ./Assembly_GC_content.png" if (-s "$contigStatsReport");
    push @conversions, "convert -strip -density 120 -flatten $contigPlots[0] ./Assembly_CovDepth_vs_Len.png" if (-s "$contigPlots");
    push @conversions, "convert -strip -density 120 -flatten $contigPlots[1] ./Assembly_Cov_vs_Len.png" if (-s "$contigPlots");
    push @conversions, "convert -strip -density 120 -flatten $contigPlots[2] ./Assembly_GC_vs_CovDepth.png" if (-s "$contigPlots");
    push @conversions, "convert -strip -density 120 -flatten $annStats ./annotation_stats_plots.png" if (-s "$annStats");

    foreach my \$file(split /,/, \$taxonomyPDFfiles) 
    {
     next if (\$file eq "$contigTaxonomyReport");
     my (\$file_name, \$file_path, \$file_suffix)=fileparse("\$file", qr/\\.[^.]*/);
     my \$size_opt = (\$file_name =~ /tree/)? "-resize 240":"-density 120";
     push @conversions, "convert \$size_opt -colorspace RGB -flatten \$file ./\$file_name.png" if (-s \$file);
    }

    eval {system(\$_)} foreach (@conversions);
    
    """
}


workflow REPORT {
    take:
    settings
    platform
    fastqCount
    qcStats
    qcReport
    hostRemovalReport
    readsTaxonomyReports
    contigTaxonomyReport
    contigStatsReport
    contigPlots
    annStats
    alnStats

    main:
    report(settings,
        platform,
        fastqCount,
        qcStats,
        qcReport,
        hostRemovalReport,
        readsTaxonomyReports,
        contigTaxonomyReport,
        contigStatsReport,
        contigPlots,
        annStats,
        alnStats)

}