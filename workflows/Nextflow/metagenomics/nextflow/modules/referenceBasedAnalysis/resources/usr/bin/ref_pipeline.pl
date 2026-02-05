#!/usr/bin/env perl

#use of alignTrim for primer trimming currently disabled
use strict;
use warnings;
use File::Basename;
use File::Path qw(make_path remove_tree);
use File::Copy;
use Getopt::Long;



my @referenceGenome;
my $tax_kingdom;
my $log="log.txt";
my $numCPU;
my $project_name;
my $outputDir;
my $QCpairFile;
my $QCunpairFile;
my $r2gAligner;
my $r2gAlignerOptions;
my $r2gMinMapq;
my $r2gMaxClip;
my $platform;
my $r2gVariantCall;
my $r2gVariantCallMinq;
my $r2gVariantCallPloidy;
my $r2gExtractMapped;
my $doConsensus;
my $c_mapq;
my $c_mincov;
my $c_maxcov;
my $c_altprop;
my $c_indelprop;
my $c_baseq;
my $c_baq;
my $c_dedup;
my $c_polymer_filt;
my $c_strand_filt;
my $c_varlog;
my $c_compopt;



GetOptions(
    'ref=s{,}' => \@referenceGenome,
    't=s' => \$numCPU,
    'proj=s' => \$project_name,
    'out=s' => \$outputDir,
    'kingdom:s' => \$tax_kingdom,
    'plat:s' => \$platform,
    'p:s' => \$QCpairFile,
    'u:s' => \$QCunpairFile,
    'aln:s' => \$r2gAligner,
    'alnOpt:s' => \$r2gAlignerOptions,
    'minmap:s' => \$r2gMinMapq,
    'maxclip:s' => \$r2gMaxClip,
    'vc:s' => \$r2gVariantCall,
    'vc-minq:s' => \$r2gVariantCallMinq,
    'vc-ploidy:s' => \$r2gVariantCallPloidy,
    'x-mapped:s' => \$r2gExtractMapped,
    'consensus:s' => \$doConsensus,
    'c-mapq:s' => \$c_mapq,
    'c-mincov:s' =>\$c_mincov,
    'c-maxcov:s' =>\$c_maxcov,
    'c-altprop:s'=>\$c_altprop,
    'c-indelprop:s' => \$c_indelprop,
    'c-baseq:s' => \$c_baseq,
    'c-baq:s' => \$c_baq,
    'c-dedup:s' => \$c_dedup,
    'c-polymer:s' => \$c_polymer_filt,
    'c-sb:s' => \$c_strand_filt,
    'c-varlog:s' => \$c_varlog,
    'c-compopt:s' => \$c_compopt
);


my $referenceGenome;
my $genbankFile;
my $gff3File;
my $ref_headers;#array ref

($referenceGenome,$genbankFile,$gff3File, $ref_headers)=&check_reference_genome(\@referenceGenome) if (@referenceGenome);

if ($referenceGenome)
{
    my ($r2gVCF,$r2gGap);
    my ($r2gUnmappedPaired,$r2gUnmappedSingle,$numOfunmappedReads);

    if ($QCpairFile or $QCunpairFile){
        ($r2gVCF,$r2gGap)=&runReadsToGenome($QCpairFile,$QCunpairFile,\@referenceGenome, $ref_headers);
    }

}

sub check_reference_genome
{
    my $referenceGenome_r = shift;
    my $time=time();
    my %format;
    my $referenceGenome = "$outputDir/reference.fasta";
    my $referenceGBK = "$outputDir/reference.gbk";
    my $gff3File="$outputDir/reference.gff";
    my @files =  @{$referenceGenome_r};
    my @fasta_files;
    my $ref_headers;
    
    
    &lprint ("  Checking Reference genome\n");
    
    for my $file_i (0..$#files)
    {
         my $file = $files[$file_i];
         my ($file_name, $file_path, $file_suffix)=fileparse("$file", qr/\.[^.]*/);
         my $ref_fasta_file="$outputDir/$file_name.fasta";
         if (is_genbank($file))
         {
             $format{"genbank"}++;
             &lprint ("Converting $file_name Genbank to Fasta and GFF\n");
             if ($file_suffix =~ /gz/)
             {
		 &executeCommand("gunzip -c $file > $outputDir/$file_name.gbk");
                 &executeCommand("genbank2fasta.pl $outputDir/$file_name.gbk > $ref_fasta_file");
                 &executeCommand("gunzip -c $file >> $referenceGBK");
             }
             else
             {
                 &executeCommand("genbank2fasta.pl $file > $ref_fasta_file");
                 &executeCommand("cat $file >> $referenceGBK");
             }	
         }elsif (is_fasta($file)){
             $format{"fasta"}++;
             if ($file_suffix =~ /gz/){
                 &executeCommand("gunzip -c $file > $ref_fasta_file");
             }else{
                 &executeCommand("awk 'NF > 0 {print \$0}' $file > $ref_fasta_file");
             }
         }else{
         	&lprint("The reference input doesn't looks like in genbank or fasta format. Will skip analysis modules require reference genomes\n");
         	return($referenceGenome,$referenceGBK,$gff3File);
         }
         $referenceGenome_r->[$file_i] = $ref_fasta_file;
         push @fasta_files,  $ref_fasta_file;
         my $file_gff3="";
         $file_gff3 = "$file_path/$file_name.gff" if ( -e "$file_path/$file_name.gff" );
         $file_gff3 = "$file_path/$file_name.gff3" if ( -e "$file_path/$file_name.gff3" );
         &executeCommand("cat $file_gff3 >> $gff3File") if ( -e "$file_gff3");
    }
    &executeCommand("genbank2gff3.pl -e 3 --outdir stdout $referenceGBK > $gff3File") if ( -s $referenceGBK && ! -e $gff3File);
    if ( scalar (keys %format) > 1)
    {
        &lprint("The input refernece mix up with genbank and fasta format. It may cause JBrowse tracks not function properly\n");
    }
    if (scalar(@fasta_files)>1)
    {
        my $cmd = "awk '{print \$0}' ". join(" ",@fasta_files). "> $referenceGenome.tmp ";
        &executeCommand($cmd);
        $ref_headers = &correct_fasta_header("$referenceGenome.tmp",$referenceGenome);
        unlink "$referenceGenome.tmp";
    }
    else
    {
        $ref_headers = &correct_fasta_header("$fasta_files[0]", "$referenceGenome") if ( ! -s $referenceGenome );
    }
    
    my $ref_header = `head -n 1 $referenceGenome`;
    if ($ref_header =~ m/virus|viral|phage/i ) {$tax_kingdom= "Viruses";}
   
    my $refSize = &fastaAllSize($referenceGenome);
    
    if ($refSize==0)
    {
        $referenceGenome="";
        &lprint ("  The input genome size is 0. Will skip analysis modules require reference genomes\n");
        return($referenceGenome,$referenceGBK,$gff3File);
    }
    
    #not sure if it is Virus, use size of references to determine the kingdoma (580K is smallest Prok,Mycoplasma)
    if (!$tax_kingdom) { $tax_kingdom = ($refSize < 580000)? "Viruses":"Bacteria";}
   
    &printRunTime($time);
    return($referenceGenome,$referenceGBK,$gff3File, $ref_headers);
}

sub executeCommand 
{
    my $command = shift;
    if (system($command) != 0)
         { die ("the command $command failed\n");}
}

sub is_genbank
{
    $SIG{'PIPE'}=sub{};
    my $file=shift;
    my ($fh,$pid) = open_file($file);
    my $head=<$fh>;
    close $fh;
    kill 9, $pid; # avoid gunzip broken pipe
    $SIG{'PIPE'} = 'DEFAULT';
    ($head =~ /^LOCUS/i)?
        return 1:
        return 0;
   
}

sub lprint {
      my ($line) = @_;
      open (my $log_fh, ">>", $log) or die "Failed to write $log\n$!";
      print $log_fh $line;  
      print $line;
      close $log_fh
}

sub correct_fasta_header {
	my $fasta = shift;
	my $output_fasta = shift;
	my @headers;
	my %id_check;
	my $num=1;
	open (my $fh, "<", $fasta);
	open (my $ofh , ">", $output_fasta);
	while (<$fh>){
		chomp;
		$_ =~ s/^>\s+/>/;
		if (/^>(\S+)\s*(.*)/){
			my $id = $1;
			my $desc = $2;
			$id =~ s/\W/_/g;
			push @headers, $id;
			if ($id_check{$id}){
				&lprint("There is duplicate fasta header unique id (first non space word). $id\n");
				$id = $id . "_$num";
				$num += 1;
			}else{
				$id_check{$id}="$id $desc";
			}
			print $ofh ">".$id." $desc\n";
		}else{
			print $ofh $_,"\n";
		}
	}
	close $fh;
	close $ofh;
	return \@headers;
}

sub fastaAllSize
{
    my $fastaFile=shift;
    my $seqCount=0;
    my $baseCount=0;
    open (my $fh, $fastaFile) or die "Cannot open $fastaFile";
    while (<$fh>)
    {  
        if (/>/)
        {
            $seqCount++;
        }
        else
        {
            chomp;
            $baseCount += length ($_);
        }
    }
    close $fh;
    return ($baseCount);
}

sub printRunTime {
  my $time=shift;
  my $runTime = time() - $time;
  my $time_string = sprintf(" Running time: %02d:%02d:%02d\n\n", int($runTime / 3600), int(($runTime % 3600) / 60), 
  int($runTime % 60));
  &lprint ($time_string);
  return $time_string;
}

sub is_fasta
{
    $SIG{'PIPE'}=sub{};
    my $file=shift;
    my ($fh,$pid)= open_file($file);
    my $head=<$fh>;
    close $fh;
    kill 9, $pid; # avoid gunzip broken pipe
    $SIG{'PIPE'} = 'DEFAULT';
    ($head =~/^>/)?
        return 1:
        return 0;
}

sub open_file
{
    my ($file) = @_;
    my $fh;
    my $pid;
    if ( $file=~/\.gz\.?\d?$/i ) { $pid=open($fh, "gunzip -c $file |") or die ("gunzip -c $file: $!"); }
    else { $pid=open($fh,'<',$file) or die("$file: $!"); }
    return ($fh,$pid);
}

sub runReadsToGenome 
{
    my $pairFile=shift;
    my $unpairFile=shift;
    my $referenceFile_r = shift;
    my $ref_headers = shift;
    my $referenceFiles = join(" ",@$referenceFile_r);
    #print STDERR scalar(@$referenceFile_r)."\n";
    my $referenceCount = scalar(@$referenceFile_r);
    #print STDERR $referenceCount."\t".$referenceFiles."\n";
    my $time=time();
    my $outPrefix = "readsToRef";
    my $log="$outputDir/mapping.log";
    my $outVCF = "$outputDir/$outPrefix.vcf";
    my $outGap = "$outputDir/$outPrefix.gaps";
    my $r2g_aligner_options = $r2gAlignerOptions || "";
    my $r2g_mapq = $r2gMinMapq? $r2gMinMapq : 42;
    my $ont_flag = ($platform =~ /nanopore/i)? 1 : 0;
    my $pacbio_flag = ($platform =~ /pacbio/i)? 1 : 0;
    my $variant_call = $r2gVariantCall ? $r2gVariantCall : 0;
    my $variant_call_min_qual = $r2gVariantCallMinq? $r2gVariantCallMinq : 0;
    my $variant_call_ploidy =  $r2gVariantCallPloidy ? $r2gVariantCallPloidy : "haploid";
    my $correct_bed_file;

    &lprint ("[Reads Mapping To Reference]\n");
    print($r2g_aligner_options);


    my $parameters;    
    $parameters .= " -pre $outPrefix -cpu $numCPU -consensus 0 -disableBAQ";
    if ($r2gAligner =~ /bowtie/){
        $r2g_aligner_options =~ s/-p\s*\d+//;
    	$parameters .= " -aligner bowtie -bowtie_options ". "'".  $r2g_aligner_options . "'";
    }elsif($r2gAligner =~ /bwa/){
        $r2g_aligner_options =~ s/-t\s*\d+//;
        $r2g_aligner_options .= " -x ont2d " if $ont_flag;
        $r2g_aligner_options .= " -x pacbio " if $pacbio_flag;
    	$parameters .= " -aligner bwa -bwa_options ". "'" . $r2g_aligner_options . "'";
    }elsif($r2gAligner =~ /minimap/){
        $r2g_aligner_options =~ s/-t\s*\d+//;
        $r2g_aligner_options .= " -x map-pb " if $pacbio_flag;
        $parameters .= " -aligner minimap2 -minimap2_options ". "'" . $r2g_aligner_options . "'";
    }


    $parameters .= " -no_indels " if $ont_flag; # or $pacbio_flag?
    $parameters .= " -no_snp " if ($variant_call == 0);
    $parameters .= " -maq  $r2g_mapq ";
    $parameters .= " -ploidy $variant_call_ploidy " if ($variant_call_ploidy);
    $parameters .= " -variant_qual $variant_call_min_qual " if ($variant_call_min_qual);
    $parameters .= " -min_depth $c_mincov " if ($c_mincov); 
    $parameters .= " -max_clip $r2gMaxClip " if ($r2gMaxClip);
    # if ( $configuration->{r2g_align_trim_bed_file} and &is_bed6_plus($configuration->{r2g_align_trim_bed_file}) ){
	# $correct_bed_file = "$outputDir/".basename($configuration->{r2g_align_trim_bed_file});
	# &correct_bed_ref($configuration->{r2g_align_trim_bed_file}, $correct_bed_file);
	# my $alignTrim_parameters = $parameters;
    #     $alignTrim_parameters .= " -p \'$pairFile\'" if ($pairFile);
    #     $alignTrim_parameters .= " -u $unpairFile" if ( -s $unpairFile);
	# $alignTrim_parameters=~ s/-u /-long / if ($ont_flag or $pacbio_flag) and $r2gAligner =~ /minimap/;
	# my $mapping_command = "perl $RealBin/scripts/runReadsToGenome.pl -d $outputDir/AlignTrimMapping $alignTrim_parameters";
    # 	($pairFile, $unpairFile, my $AlignTrim_ref)=&getAlignTrimReads($mapping_command,$referenceFile_r, $ref_headers, $log, $outputDir,$correct_bed_file);
    # }
	    
    $parameters .= " -ref $referenceFiles";
    $parameters .= " -p \'$pairFile\'" if ($pairFile);
    $parameters .= " -u $unpairFile" if ($unpairFile);
    $parameters=~ s/-u /-long / if ($ont_flag or $pacbio_flag) and $r2gAligner =~ /minimap/;
    my $command = "runReadsToGenome.pl -skip_aln -d $outputDir $parameters 1>>$log 2>\&1 ";
    if ( ! -e "$outputDir/runReadsToGenome.finished" ){
      &lprint ("  Running \n  $command \n");
      &executeCommand($command);
      &executeCommand("cat $outputDir/*.gap.coords > $outGap");
      &executeCommand("cat $outputDir/*.vcf > $outVCF") if ($variant_call == 1);
    }
    # if ($configuration->{r2g_align_trim_bed_file}){
    #     # ampilcon coverage plot
	# my $bed_file_flag = ($correct_bed_file =~ /bedpe/ )? "--bedpe $correct_bed_file":"--bed $correct_bed_file";
    #     my @cov_files = glob("$outputDir/AlignTrimMapping/*coverage");
    #     foreach my $cov_f (@cov_files){
    #            my $refID = ($cov_f =~ /readsToRef_(\S+).coverage/) ? "--refID $1": "";
    #            my $gff = (-e "$outDir/Reference/reference.gff")? "--gff $outDir/Reference/reference.gff" : "";
	#        my $mincov = ( $configuration->{r2g_consensus_min_cov} )?  $configuration->{r2g_consensus_min_cov} : 5;
    #            $command = "$py38_env_activate_cmd; $RealBin/scripts/amplicon_coverage.py --mincov $mincov --count_primer --outdir $outputDir --cov $cov_f $gff $refID $bed_file_flag; $env_deactivate_cmd";

    #            &executeCommand($command);
    #     }

    # }

    if ($r2gExtractMapped){
        # extract mapped reads
        `echo "Extract mapped reads" >> $log`;
         foreach my $file (@$referenceFile_r){
            my ($file_name, $file_path, $file_suffix)=fileparse("$file", qr/\.[^.]*/);
            my $bamFile = "$outputDir/$file_name.sort.bam";
            $command = "bam_to_fastq.pl -mapped -prefix $outputDir/Mapped_to_$file_name $bamFile >>$log ";
            &executeCommand($command);
        }
    }
    &executeCommand("echo -n \"Total Unmapped:\" >>$log");
    &executeCommand("count_unmapped.pl $outputDir/*bam >>$log");

    if ($doConsensus){
        my $consensus_log = "$outputDir/consensus.log";
        my $con_min_mapQ = $c_mapq || 42;
        my $con_max_cov = $c_maxcov || 8000;
        my $con_alt_prop = $c_altprop || 0.5;
        my $con_altIndel_prop = $c_indelprop || 0.5;
        my $con_min_cov = $c_mincov || 5;
        my $con_min_baseQ = $c_baseq|| 20;
        my $con_disable_BAQ = $c_baq;
        my $con_pcr_dedup = $c_dedup? "1":"0";
	my $con_homopolymer_filter = $c_polymer_filt? "1":"0";
        my $con_strandbias_filter = $c_strand_filt? "1":"0";
	my $con_varlog_opt = $c_varlog ? "1":"0";
	my $con_comp_opt = $c_compopt? "1":"0";
	foreach my $file (@$referenceFile_r){
            &make_dir("$outputDir/consensus_tmp");
            my ($file_name, $file_path, $file_suffix)=fileparse("$file", qr/\.[^.]*/);
            my $bamFile = "$outputDir/$file_name.sort.bam";
            &correct_fasta_header("$file","$outputDir/consensus_tmp/${file_name}.fa");
            $command = "consensus_fasta.py --procs=$numCPU -b $bamFile -r $outputDir/consensus_tmp/$file_name.fa -o ${file_name}_consensus --temp=./consensus_tmp ";
	    $command .= " --comp " if ($con_comp_opt);
	    $command .= " --filterHomopolymer " if ($con_homopolymer_filter);
            $command .= " --filterStrandBias " if ($con_strandbias_filter);
            $command .= " --varlog " if ($con_varlog_opt);
            $command .= " --disableBAQ" if ($con_disable_BAQ);
            $command .= " --NOpcrDedup" if (!$con_pcr_dedup);
	    #$command .= " --bed $correct_bed_file " if ( $configuration->{r2g_align_trim_bed_file} and &is_bed6_plus($configuration->{r2g_align_trim_bed_file}) );
            $command .= " --useAnomPairs --mapQ=$con_min_mapQ --maxCov=$con_max_cov --propThresh=$con_alt_prop --covThresh=$con_min_cov --baseQual=$con_min_baseQ --INDELpropThresh=$con_altIndel_prop  >> $consensus_log";
            &lprint ("  Running \n  $command \n");
            &executeCommand($command);
            move("$outputDir/consensus_tmp/$file_name.sort_sorted_nodups.bam", "$outputDir/");
            move("$outputDir/consensus_tmp/$file_name.sort_sorted.bam", "$outputDir/");
            move("$outputDir/consensus_tmp/$file_name.sort_sorted_nodups.bam_metrics.txt", "$outputDir/$file_name.sort_sorted_nodups.bam_pcrdedup.txt");
            &executeCommand("samtools index  $outputDir/$file_name.sort_sorted_nodups.bam") if ( -e "$outputDir/$file_name.sort_sorted_nodups.bam");
            &executeCommand("samtools index  $outputDir/$file_name.sort_sorted.bam") if ( -e "$outputDir/$file_name.sort_sorted.bam");
            &executeCommand("cd $outputDir && sed -i -e 's/$file_name/$project_name/' ${file_name}_consensus.fasta");
            &executeCommand("cd $outputDir && fastacomposition.pl ${file_name}_consensus.fasta > ${file_name}_consensus.fasta.comp");
	    if ( -e "$outputDir/${file_name}_consensus_w_ambiguous.fasta"){
                &executeCommand("cd $outputDir && sed -i -e 's/$file_name/$project_name/' ${file_name}_consensus_w_ambiguous.fasta");
                &executeCommand("cd $outputDir && fastacomposition.pl ${file_name}_consensus_w_ambiguous.fasta > ${file_name}_consensus_w_ambiguous.fasta.comp");
            }

	}
        remove_tree("$outputDir/consensus_tmp") if ( -d "$outputDir/consensus_tmp");
        &touchFile("$outputDir/getConsensus.finished");  
    }
    &printRunTime($time);
    return ($outVCF,$outGap);
}

sub touchFile{
    my $file=shift;
    open (my $fh,">",$file) or die "$!";
    close $fh;
}

sub make_dir{
	my $dir=shift;
	make_path($dir,{chmod => 0755,});
	return 0;
}

# sub is_bed6_plus{
#     $SIG{'PIPE'}=sub{};
#     my $file=shift;
#     my ($fh,$pid)= open_file($file);
#     my $count=0;
#     my $check_num=100;
#     my $is_bed=0;
#     for ($count..$check_num){
#         my $line=<$fh>;
# 	next if !$line;
#         next if $line =~ /^#/;
#         my @col = split /\t/,$line;
#         if (scalar(@col) >= 6 and $col[1] =~ /^\d+$/ and  $col[2] =~ /^\d+$/ and $col[4] =~ /^\d+$/){
# 	    $is_bed=1;
#         }
#     }
#     kill 9, $pid; # avoid gunzip broken pipe
#     $SIG{'PIPE'} = 'DEFAULT';
#     return $is_bed;
# }


# sub getAlignTrimReads{
# 	my $cmd = shift;
# 	my $ref_r = shift;
# 	my $ref_headers = shift;
# 	my $log = shift;
# 	my $outputDir = shift;
# 	my $bed_file = shift;
# 	my $pairFile;
# 	my $unpairFile;
# 	my $ont_flag = ($platform =~ /nanopore/i)? 1 : 0;
#     my $pacbio_flag = ($platform =~ /pacbio/i)? 1 : 0;
# 	my $AlignTrim_ref = @$ref_r[0];
# 	if ($bed_file =~ /artic_ncov|SC2_200324|swift_primer_schemes_v2/){
# 		if (my ($NC_044512_ref) = grep $_ =~ /NC_045512|MN908947/, @$ref_r) {
# 			$AlignTrim_ref = $NC_044512_ref;
# 		}
# 	}else{
# 		open (my $fh, "<", $bed_file) or die "Cannot open Bed file\n";
# 		my $ref_id;
# 		while(<$fh>){
# 			next if /^#/;
# 			my @array = split /\t/;
# 			$ref_id = $array[0];
# 			last if $ref_id;
# 		}
# 		close $fh;
# 		if (my ($align_trim_ref_index) = grep $_ =~ /$ref_id/, 0..$#{$ref_headers}) {
# 			$AlignTrim_ref = $ref_r->[$align_trim_ref_index];
# 		} 
# 	}
# 	$cmd .= " -align_trim_bed_file $bed_file -ref $AlignTrim_ref -no_snp -no_plot";
# 	$cmd .= " -align_trim_strand " if ! $ont_flag and ! $pacbio_flag;
# 	&lprint ("  ## Align Trimmed Ref: $AlignTrim_ref \n");
# 	&lprint ("  ## Get Align Trimmed Reads \n");
# 	$cmd .= " 1>$log 2>\&1";
# 	my $exe_cmd = "$py38_env_activate_cmd; $cmd; $env_deactivate_cmd";
# 	&executeCommand($exe_cmd);
# 	my @align_trim_bam_file = glob("$outputDir/AlignTrimMapping/*bam");
# 	my $extract_reads_cmd = "perl $RealBin/scripts/bam_to_fastq.pl -remove_softclip -prefix $outputDir/AlignTrimMapping/AlignTrimmedReads $align_trim_bam_file[0]";
# 	&executeCommand($extract_reads_cmd);
# 	move($_,"$outputDir/") for @align_trim_bam_file;
# 	move($_, "$outputDir/") for glob("$outputDir/AlignTrimMapping/*bai");
# 	if ( -s "$outputDir/AlignTrimMapping/AlignTrimmedReads.1.fastq"){
# 		$pairFile = "$outputDir/AlignTrimMapping/AlignTrimmedReads.1.fastq $outputDir/AlignTrimMapping/AlignTrimmedReads.2.fastq";
# 	}
# 	if ( -s "$outputDir/AlignTrimMapping/AlignTrimmedReads.se.fastq"){
# 		$unpairFile = "$outputDir/AlignTrimMapping/AlignTrimmedReads.se.fastq";
# 	}
# 	if ( ! $pairFile and ! $unpairFile){
# 		die "failed: No reads remain after align trim. Please see $log\n";
# 	}
# 	return ($pairFile,$unpairFile,$AlignTrim_ref);
# }
