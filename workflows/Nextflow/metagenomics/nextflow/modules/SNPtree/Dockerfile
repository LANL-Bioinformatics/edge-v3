# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:v25.11.1 AS build
ENV version=0.6.2

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name snpTree \
    && conda activate snpTree 

# install dependencies for snpTree

RUN conda install -n snpTree -c bioconda bcftools=1.9 samtools=1.9 phame=1.0.3 \
    perl-bioperl=1.7.8 perl-xml-simple=2.25 perl-xml-libxml=2.0207 perl-bio-phylo=2.0.2 \
    perl-json=4.10 perl-yaml=1.30 raxml=8.2.13
RUN conda install -n snpTree -c conda-forge python=3.7
RUN conda install -c conda-forge conda-pack=0.8.1

RUN conda-pack -n snpTree -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack


FROM debian:latest AS runtime

COPY --from=build /venv /venv

RUN apt-get update && apt-get install procps -y && apt-get clean
ENV PERL5LIB=/venv/lib/perl5/core_perl:/venv/lib/perl5/site_perl
ENV PATH=/venv/bin:$PATH

    
SHELL ["/bin/bash", "-c"]
CMD /bin/bash
