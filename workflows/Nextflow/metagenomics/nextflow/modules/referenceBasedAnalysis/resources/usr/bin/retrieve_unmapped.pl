#!/usr/bin/env perl

use strict;
use warnings;
use Getopt::Long;
use File::Basename;

my @referenceGenome;
my $paired;

GetOptions(
    'ref=s{,}' => \@referenceGenome,
    'paired' => \$paired
);

my $referenceCount = scalar(@referenceGenome);
my $time=time();
my $outputDir="UnmappedReads";
my $refmapping_outdir="readsMappingToRef";
my $log = "log.txt";
my $unmappedSingle="singleEnd.fastq";
my $unmappedPaired_1="pairedEnd.1.fastq";
my $unmappedPaired_2="pairedEnd.2.fastq";
my $NumOfunmappedPaired=0;
my $NumOfunmappedSingle=0;
my $total_unmapped_reads=0;


open (my $se_fh,">  $unmappedSingle") or die "cannot open $unmappedSingle to write\n";
my ($pe_fh1, $pe_fh2);
if ($paired)
{
    open ($pe_fh1,">$unmappedPaired_1") or die "cannot open $unmappedPaired_1 to write\n";
    open ($pe_fh2,">$unmappedPaired_2") or die "cannot open $unmappedPaired_2 to write\n";
}
my %filter;
foreach my $file (@referenceGenome){
    my ($file_name, $file_path, $file_suffix)=fileparse("$file", qr/\.[^.]*/);
    my $bamFile = "$file_name.sort.bam";
    &executeCommand("samtools view -f 4 $bamFile | sort -T $outputDir -k 1,1 > $outputDir/unmapped.sam");
    open (my $fh, "$outputDir/unmapped.sam") or die "cannot open $outputDir/unmapped.sam\n";
    while (<$fh>)
    {
        chomp;
        my @samFields=split /\t/,$_;
        my $R1_R2 = 1;
        $R1_R2 = 2 if ($samFields[1] & 128);
        my $unique_id=$samFields[0]."_$R1_R2";
        $filter{$unique_id}++;
        next if ($filter{$unique_id} != $referenceCount);

        if ($samFields[1] & 1)  # paired reads
        {
            if (($samFields[1] & 4) && ($samFields[1] & 8))   # both unmapped
            {
                $NumOfunmappedPaired = $NumOfunmappedPaired + 1 ;
                print $pe_fh1 "@".$samFields[0]."/1\n".$samFields[9]."\n+\n".$samFields[10]."\n" if ($samFields[1] & 64);
                print $pe_fh2 "@".$samFields[0]."/2\n".$samFields[9]."\n+\n".$samFields[10]."\n" if ($samFields[1] & 128);
            }
            else{
                # the other mate mapped, do we need to keep this?
                $NumOfunmappedSingle++;
                print $se_fh "@".$samFields[0]."\n".$samFields[9]."\n+\n".$samFields[10]."\n";
            }
        }
        else{ # single end reads
                # original from single end reads and unmapped. Could be after QC SE reads.
                $NumOfunmappedSingle++;
                print $se_fh "@".$samFields[0]."/1\n".$samFields[9]."\n+\n".$samFields[10]."\n";
        }
    }
    close $fh;
}
close $se_fh;
&lprint ("  Unmapped reads:\n");
&lprint ("    Paired End: $NumOfunmappedPaired\n");
&lprint ("    Single End: $NumOfunmappedSingle\n");
$total_unmapped_reads = $NumOfunmappedPaired + $NumOfunmappedSingle;
&lprint("Total Unmapped:$total_unmapped_reads\n");
unlink "$outputDir/unmapped.sam";
&printRunTime($time);

#put total unmapped reads in stdout, handle created files outside this scope

# if ($QCpairFile)
# {
#     return ("$unmappedPaired_1 $unmappedPaired_2",$unmappedSingle,$total_unmapped_reads);
# }
# else
# {
#     return ("",$unmappedSingle,$total_unmapped_reads);
# }



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
