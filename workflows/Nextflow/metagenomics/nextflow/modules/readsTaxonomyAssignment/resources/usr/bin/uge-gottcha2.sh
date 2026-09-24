#!/bin/bash
#$ -l h_vmem=100G,mem_free=40G
#$ -j y
#$ -cwd
#SBATCH --mem-per-cpu=10G

usage(){
cat << EOF
USAGE: $0 -i <FASTQ> -o <OUTDIR> -p <PREFIX> -l <LEVEL> [OPTIONS]

ARGUMENTS:
   -i      Input a FASTQ file or pair-ended FASTAQ files sperated by comma
   -o      Output directory
   -p      Output prefix
   -l      Level [genus|species|strain]
   -d      Database

OPTIONS:
   -t      Number of threads. [default is 4]
   -a      minimap2 options
   -q      minQ: minimum quality of any single base [default is 20]
   -f      fixL: chunk all fragments of reads into smaller fragments of length [default is 30]
   -m      minL (*** disabled, don't use ***)
   -s      The FULL PATH and prefix of pre-splitrimmed sequences and stats file.
   -h      help
EOF
}

###########################
#
# Default values
#
###########################

FASTQ=
PREFIX=
OUTPATH=
LVL="species"
THREADS=4
PRE_SPLITRIM=
DB=$EDGE_HOME/database/GOTTCHA2/gottcha_db.species.fna
OTHER_OPTIONS=()

# manual argument parser: known single-character flags consume their
# following argument; anything else (unknown short flags, combined
# short flags like -np, or long options like --ont) is passed through
# untouched in OTHER_OPTIONS.
while [[ $# -gt 0 ]]
do
     case "$1" in
        -i) FASTQ=$2
            shift 2
            ;;
        -o) OUTPATH=$2
            shift 2
            ;;
        -p) PREFIX=$2
            shift 2
            ;;
        -l) LVL=$2
            shift 2
            ;;
        -d) DB=$2
            shift 2
            ;;
        -t) THREADS=$2
            shift 2
            ;;
        -a) BWAMETHOD=$2
            shift 2
            ;;
        -q) TRIM_MINQ=$2
            shift 2
            ;;
        -f) TRIM_FIXL=$2
            shift 2
            ;;
        -m) TRIM_MINL=$2
            shift 2
            ;;
        -s) PRE_SPLITRIM=$2
            shift 2
            ;;
        -h) usage
            exit
            ;;
        *) OTHER_OPTIONS+=("$1")
           shift
           ;;
     esac
done

## path
RELABD_COL="GENOMIC_CONTENT_EST"
export PATH=$EDGE_HOME/thirdParty/gottcha2:$EDGE_HOME/bin:$EDGE_HOME/scripts/microbial_profiling/script:$EDGE_HOME/scripts:$PATH;

mkdir -p $OUTPATH

set -xe;

gottcha2 fast-profile -r $RELABD_COL -i $FASTQ -t $THREADS --outdir $OUTPATH -p $PREFIX --database $DB "${OTHER_OPTIONS[@]}"

awk -F\\t '{if($NF=="" || $NF=="NOTE"){print $_}}' $OUTPATH/$PREFIX.full.tsv | cut -f -10 > $OUTPATH/$PREFIX.summary.tsv
awk -F\\t '{if(NR==1){out=$1"\t"$2"\tROLLUP\tASSIGNED"; { for(i=3;i<=NF;i++){out=out"\t"$i}}; print out;}}' $OUTPATH/$PREFIX.summary.tsv > $OUTPATH/$PREFIX.out.list
awk -F\\t '{if(NR>1){out=$1"\t"$2"\t"$4"\t"; { for(i=3;i<=NF;i++){out=out"\t"$i}}; print out;}}' $OUTPATH/$PREFIX.summary.tsv >> $OUTPATH/$PREFIX.out.list
touch $OUTPATH/$PREFIX.lineage.tsv
#gottcha2.py -r $RELABD_COL --database $DB -s $OUTPATH/$PREFIX.gottcha_*.sam -m lineage -c > $OUTPATH/$PREFIX.out.tab_tree
cp $OUTPATH/$PREFIX.lineage.tsv $OUTPATH/$PREFIX.out.tab_tree

#generate KRONA chart
ktImportText  $OUTPATH/$PREFIX.out.tab_tree -o $OUTPATH/$PREFIX.krona.html

set +xe;
echo "";
echo "[END] $OUTPATH $PREFIX";
