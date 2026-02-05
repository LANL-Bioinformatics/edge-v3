# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:main AS build
ENV version=1.7.0

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name readsToContig \
    && conda activate readsToContig 

RUN conda install -n readsToContig -c conda-forge r-base
RUN conda install -n readsToContig -c conda-forge python=3.11
RUN conda install -n readsToContig -c bioconda minimap2=2.24
RUN conda install -n readsToContig -c bioconda perl-json
RUN conda install -n readsToContig -c bioconda samclip=0.4.0
RUN conda install -n readsToContig -c bioconda bwa
RUN conda install -n readsToContig -c bioconda bowtie2
RUN conda install -n readsToContig -c bioconda samtools=1.6
RUN conda install -c conda-forge conda-pack


RUN conda-pack -n readsToContig -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack

FROM debian:buster AS runtime
#RUN apk add --no-cache bash

COPY --from=build /venv /venv
RUN apt-get update && apt-get install procps -y && apt-get clean
ENV PERL5LIB=/venv/lib/perl5/core_perl
ENV PATH=/venv/bin:$PATH
    
SHELL ["/bin/bash", "-c"]
CMD /bin/bash
