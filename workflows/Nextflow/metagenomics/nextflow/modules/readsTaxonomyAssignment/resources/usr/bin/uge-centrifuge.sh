#!/bin/bash
#$ -cwd
#$ -l h_vmem=16G
#$ -m abe
#$ -j y
#SBATCH --mem-per-cpu=10G

set -e;

usage(){
cat << EOF
USAGE: $0 -i <FASTQ> -d <DATABASE> -o <OUTDIR> -p <PREFIX> [OPTIONS]

OPTIONS:
   -i      Input a FASTQ file (singleton or pair-end sequences separated by comma)
   -d      Database
   -n      Additional options for centrifuge
   -o      Output directory
   -p      Output prefix
   -t      Number of threads (default: 24)
   -h      help
EOF
}

FASTQ=
REFDB=$EDGE_HOME/database/Centrifuge/p_compressed
PREFIX=
OUTPATH=
THREADS=24
OPTIONS=

while getopts "i:d:o:p:t:n:h" OPTION
do
     case $OPTION in
        i) FASTQ=$OPTARG
           ;;
        d) REFDB=$OPTARG
           ;;
        o) OUTPATH=$OPTARG
           ;;
        p) PREFIX=$OPTARG
           ;;
        t) THREADS=$OPTARG
           ;;
        n) OPTIONS=$OPTARG
           ;;
        h) usage
           exit
           ;;
     esac
done

if [[ -z "$FASTQ" || -z "$OUTPATH" || -z "$PREFIX" ]]
then
     usage;
     exit 1;
fi

export PATH=$EDGE_HOME/bin:$EDGE_HOME/scripts/microbial_profiling/script:$EDGE_HOME/scripts:$PATH;

mkdir -p $OUTPATH

echo "[BEGIN]"

set -x;
centrifuge -x $REFDB $OPTIONS -p $THREADS -U $FASTQ -S $OUTPATH/$PREFIX.classification.tsv --report-file $OUTPATH/$PREFIX.report.txt
centrifuge-kreport -x $REFDB $OUTPATH/$PREFIX.classification.tsv > $OUTPATH/$PREFIX.kreport.tsv
set +e;

awk -F'\t' 'BEGIN {
      OFS="\t"

      name["D"]="domain";  rank["D"]=1
      name["P"]="phylum";  rank["P"]=2
      name["C"]="class";   rank["C"]=3
      name["O"]="order";   rank["O"]=4
      name["F"]="family";  rank["F"]=5
      name["G"]="genus";   rank["G"]=6
      name["S"]="species"; rank["S"]=7
      name["S1"]="strain"; rank["S1"]=8
   }

   $4 in name {
      taxa=$6
      sub(/^[[:space:]]+/, "", taxa)
      print name[$4], taxa, $2, $3, $5, rank[$4]
   }' $OUTPATH/$PREFIX.kreport.tsv \
   | sort -t$'\t' -k6,6n -k3,3nr \
   | cut -f1-5 } > $OUTPATH/$PREFIX.out.list

#generate out.list
convert_krakenRep2tabTree.pl < $OUTPATH/$PREFIX.kreport.tsv > $OUTPATH/$PREFIX.out.tab_tree

# Make Krona plot
ktImportTaxonomy -m 3 -t 5 -o $OUTPATH/$PREFIX.krona.html $OUTPATH/$PREFIX.kreport.tsv

# This is old 101817. See above for current Krona plot creation (consistent with the method used for other tools).
#generate krona plot
#cat $OUTPATH/$PREFIX.out.list | awk -F\\t "{if(\$4>0 && \$4!=\"ASSIGNED\") print \$5\"\t\"\$4}" > $OUTPATH/$PREFIX.out.krona
#ktImportTaxonomy -t 1 -s 2 -o $OUTPATH/$PREFIX.krona.html $OUTPATH/$PREFIX.out.krona

#preparing megan CSV file
cat $OUTPATH/$PREFIX.out.list | awk -F\\t "{if(\$4>0 && \$4!=\"ASSIGNED\") print \$2\"\t\"\$4}" > $OUTPATH/$PREFIX.out.megan

set +x;
echo "";
echo "[END] $OUTPATH $PREFIX";
