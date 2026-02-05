#!/usr/bin/env perl
use strict;
use Getopt::Long;
use File::Basename;

my $input;
my $classified_result;
my $output;
my $log;

GetOptions(
    'in=s' => \$input,
    'classified=s' => \$classified_result,
    'output=s' => \$output,
    'log=s' => \$log
);

my %result;


#Total Contigs: (\d+) \((\d+) bp\); Classified Contigs: (\d+) \((\d+) bp\); Unclassified Contigs: (\d+) \((\d+) bp\);/){
my $total_classified_count = 0;
my $total_classified_len = 0;
open (my $fh, "<", $classified_result) or die "Cannot read $classified_result\n";
my $header = <$fh>;
while(<$fh>){
    chomp;
    my @f = split /\t/,$_;
    $result{$f[0]}=1;
    $total_classified_len += $f[9];
    $total_classified_count++;
}
close $fh;
my $ofh;
if ($output){
    open ($ofh, ">" , $output) or die "Cannot Write $output\n";
}
open (my $fafh, "<" , $input ) or die "Cannot read $input\n";
my $seq_id;
my $total_count=0;
my $total_len=0;
while(<$fafh>){
    chomp;
    if ($_=~ /^>(\S+)/){
        $total_count++;
        $seq_id=$1;
        print $ofh "$_\n" if (!$result{$seq_id} && $output);
    }else{
        print $ofh "$_\n" if (!$result{$seq_id} && $output);
        $total_len += length($_);
    }
}
close $ofh if ($output);
close $fafh;
open (my $log_fh , ">>" , $log) or die "Cannote write $log\n";
print $log_fh "Total Contigs: $total_count ($total_len bp); Classified Contigs: $total_classified_count ($total_classified_len bp); ";
print $log_fh "Unclassified Contigs: ". ($total_count - $total_classified_count) .  " (". ($total_len - $total_classified_len) . " bp);\n";
close $log_fh;
