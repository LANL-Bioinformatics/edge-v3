# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:v25.11.1 AS build
ENV version=1.6.5

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
  && . ~/.bashrc \
  && conda create --name runFaQCs \
  && conda activate runFaQCs 



#dependencies for illumina_fastq_QC.pl
RUN conda install -n runFaQCs -c bioconda perl-parallel-forkmanager=2.04 perl-string-approx=3.27 faqcs=2.12 porechop=0.2.4 nanoplot=1.46.2
RUN conda install -n runFaQCs -c conda-forge r-base=4.4.3

RUN conda install -c conda-forge conda-pack=0.8.1 


RUN conda-pack -n runFaQCs -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar


RUN /venv/bin/conda-unpack

FROM debian:trixie AS runtime

COPY --from=build /venv /venv
RUN apt-get update && apt-get install procps -y && apt-get clean
ENV PATH=/venv/bin:$PATH
    
SHELL ["/bin/bash", "-c"]
CMD /bin/bash

