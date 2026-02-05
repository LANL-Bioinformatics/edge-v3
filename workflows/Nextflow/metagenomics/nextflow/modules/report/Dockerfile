# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:main AS build
ENV version=0.5.0

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name report \
    && conda activate report 

RUN conda install -n report -c conda-forge r-base
RUN conda install -n report -c conda-forge r-gridextra
RUN conda install -n report -c bioconda perl-findbin
RUN conda install -n report -c bioconda perl-pdf-api2
RUN conda install -n report -c conda-forge imagemagick
RUN conda install -c conda-forge conda-pack


RUN conda-pack -n report -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack

FROM debian:buster AS runtime
#RUN apk add --no-cache bash

COPY --from=build /venv /venv
RUN apt-get update && apt-get install procps -y && apt-get clean
ENV PATH=/venv/bin:$PATH
ENV PERL5LIB=/venv/lib/perl5/core_perl
    
SHELL ["/bin/bash", "-c"]
CMD /bin/bash
