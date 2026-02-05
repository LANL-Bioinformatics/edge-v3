# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:main AS build
ENV version=0.18.0

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge && \
    conda config --add channels bioconda

RUN conda init bash && \
    . ~/.bashrc && \
    conda create --name ref2g && \
    conda activate ref2g

# install dependencies for ref2g
RUN conda install -n ref2g -c conda-forge python=3.9 r-base ghostscript 
RUN conda install -n ref2g -c bioconda perl-bioperl 
RUN conda install -n ref2g -c bioconda mummer4 bowtie2=2.5.4 perl-lwp-simple biopython=1.77 samtools=1.21 minimap2=2.1.1 bcftools=1.21 samclip=0.4.0 bwa=0.7.19 perl-parallel-forkmanager perl-json
RUN conda install -n ref2g -c conda-forge scipy
# custom version of Jason Ladner's consensus_fasta.py
RUN wget https://ref-db.edgebioinformatics.org/EDGE/dev/edge_dev_thirdParty_softwares.tgz \
    && tar -xvzf edge_dev_thirdParty_softwares.tgz \
    && tar -xvzf thirdParty/reference-based_assembly.tgz -C .

RUN conda install -c conda-forge conda-pack

RUN conda-pack -n ref2g -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack

FROM debian:latest AS runtime

COPY --from=build /venv /venv
COPY --from=build /reference-based_assembly/consensus_fasta.py /venv/bin/
RUN apt-get update && apt-get install procps -y && apt-get clean
RUN chmod 755 /venv/bin/consensus_fasta.py
ENV PERL5LIB=/venv/lib/perl5/core_perl
ENV PATH=/venv/bin

SHELL ["/bin/bash", "-c"]
CMD /bin/bash
