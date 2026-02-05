#!/usr/bin/env perl

use strict;
use warnings;
use File::Basename;
use Getopt::Long;

my $c2g_SNP_INDEL_File;
my $c2g_gap_file;
my $r2g_vcf_file;
my $r2g_gap_file;
my $gff3File;
my $ref_fasta;
my @r2g_consensus_log_files; #= glob("$r2g_outputDir/*consensus.changelog");
my @r2g_consensus_gap_files; #= glob("$r2g_outputDir/*consensus.gaps");
my $proj_name;



GetOptions(
    'ref=s' => \$ref_fasta,
    'c_gap=s' => \$c2g_gap_file,
    'c_indel=s' => \$c2g_SNP_INDEL_File,
    'r_gap=s' => \$r2g_gap_file,
    'r_vcf=s' => \$r2g_vcf_file,
    'cons_logs:s{1,}' => \@r2g_consensus_log_files,
    'cons_gaps:s{1,}' => \@r2g_consensus_gap_files,
    'gff=s' => \$gff3File,
    'proj_name=s' => \$proj_name
);

my $time=time();
my $outDir = ".";
my $outputDir=".";
my $log = "$outputDir/variantAnalysis.log";
my $r2g_outputDir=".";
my $c2g_gapAnalysisOutput="./Contig_GapVSReference.report.txt";
my $r2g_gapAnalysisOutput="./Reads_GapVSReference.report.txt";
my $r2g_gapJSONanalysisOutput = "./GapVSReference.report.json";
my $log2 = "./variantAnalysis.log";
my $cmd;

if ( ! -e "$gff3File")
{
    &lprint ("GFF3 file not exists. Skip Variant Analysis\n"); 
    return 0;
}  

my $fastainput =  (`grep "##FASTA" $gff3File`)? "": "-fasta $ref_fasta";
if ($c2g_SNP_INDEL_File and -s $c2g_SNP_INDEL_File){
    $cmd="SNP_analysis.pl -gff $gff3File -SNP $c2g_SNP_INDEL_File $fastainput -format nucmer -output $outputDir 2>$log";
    &lprint (" Running \n $cmd\n");
    &executeCommand($cmd);
}
if ($c2g_gap_file and -s $c2g_gap_file){
    $cmd="gap_analysis.pl -gff $gff3File -gap $c2g_gap_file > $c2g_gapAnalysisOutput 2>>$log";
    &lprint (" Running \n $cmd\n");
    &executeCommand($cmd);
}
if ($r2g_vcf_file and -s $r2g_vcf_file){
    $cmd="SNP_analysis.pl -gff $gff3File -SNP $r2g_vcf_file $fastainput -format vcf -output $r2g_outputDir 2>>$log2";
    &lprint (" Running \n $cmd\n");
    &executeCommand($cmd);
}
if ($r2g_gap_file and -s $r2g_gap_file){
    $cmd="gap_analysis.pl -gff $gff3File -gap $r2g_gap_file > $r2g_gapAnalysisOutput 2>>$log2";
    &lprint (" Running \n $cmd\n");
    &executeCommand($cmd);
}
foreach my $con_gap_file(@r2g_consensus_gap_files){
    my $prefix = basename($con_gap_file,".gaps");
    my $output = "$r2g_outputDir/$prefix.gaps_report.txt";
    $cmd="gap_analysis.pl -gff $gff3File -gap $con_gap_file >  $output 2>>$log2";
    &lprint (" Running \n $cmd\n");
    &executeCommand($cmd);
}
foreach my $con_log_file(@r2g_consensus_log_files){
    my $prefix = basename($con_log_file,".changelog");
    my $ambiguous_log  = "$r2g_outputDir/${prefix}_w_ambiguous.log";
    symlink($con_log_file,$ambiguous_log);
    $cmd="SNP_analysis.pl -gff $gff3File -SNP $con_log_file $fastainput -format changelog -output $r2g_outputDir 2>>$log2";
    &lprint (" Running \n $cmd\n");
    &executeCommand($cmd);
    $cmd="SNP_analysis.pl -gff $gff3File -SNP $ambiguous_log $fastainput -format changelog -output $r2g_outputDir 2>>$log2";
    &lprint (" Running \n $cmd\n");
    &executeCommand($cmd);

    $cmd="tab2Json_for_dataTable.pl -limit 0 $r2g_outputDir/${prefix}.SNPs_report.txt > $r2g_outputDir/${prefix}.SNPs_report.json";
    &executeCommand($cmd) if ( -e "$r2g_outputDir/${prefix}.SNPs_report.txt" );
    $cmd="tab2Json_for_dataTable.pl -limit 0 $r2g_outputDir/${prefix}.Indels_report.txt > $r2g_outputDir/${prefix}.Indels_report.json";
    &executeCommand($cmd) if ( -e "$r2g_outputDir/${prefix}.Indels_report.txt" );

    unlink "$r2g_outputDir/${prefix}_w_ambiguous.Indels_report.txt";
    unlink $ambiguous_log;
}

&printRunTime($time);
$cmd="tab2Json_for_dataTable.pl -project_name $proj_name -limit 0 -mode ref_gap $r2g_gapAnalysisOutput > $r2g_gapJSONanalysisOutput";
&executeCommand($cmd) if ( -s $r2g_gapAnalysisOutput );
$cmd="tab2Json_for_dataTable.pl -limit 0 $r2g_outputDir/readsToRef.Indels_report.txt > $r2g_outputDir/readsToRef.Indels_report.json";
&executeCommand($cmd) if ( -e "$r2g_outputDir/readsToRef.Indels_report.txt" );
$cmd="tab2Json_for_dataTable.pl -limit 0 $r2g_outputDir/readsToRef.SNPs_report.txt > $r2g_outputDir/readsToRef.SNPs_report.json";
&executeCommand($cmd) if ( -e "$r2g_outputDir/readsToRef.SNPs_report.txt" );

sub printRunTime {
  my $time=shift;
  my $runTime = time() - $time;
  my $time_string = sprintf(" Running time: %02d:%02d:%02d\n\n", int($runTime / 3600), int(($runTime % 3600) / 60), 
  int($runTime % 60));
  &lprint ($time_string);
  return $time_string;
}

sub lprint {
      my ($line) = @_;
      open (my $log_fh, ">>", $log) or die "Failed to write $log\n$!";
      print $log_fh $line;  
      print $line;
      close $log_fh
}

sub executeCommand 
{
    my $command = shift;
    if (system($command) != 0)
         { die ("the command $command failed\n");}
}