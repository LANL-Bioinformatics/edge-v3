# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:main AS build
ENV version=0.6.0

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name snpTree \
    && conda activate snpTree 

# install dependencies for snpTree

RUN conda install -n snpTree -c bioconda bcftools=1.9
RUN conda install -n snpTree -c bioconda samtools=1.9
RUN conda install -n snpTree -c bioconda phame
RUN conda install -n snpTree -c bioconda perl-bioperl
RUN conda install -n snpTree -c bioconda perl-xml-simple
RUN conda install -n snpTree -c bioconda perl-xml-libxml
RUN conda install -n snpTree -c bioconda perl-bio-phylo
RUN conda install -n snpTree -c bioconda perl-json
RUN conda install -n snpTree -c bioconda perl-yaml
RUN conda install -n snpTree -c conda-forge python=3.7
RUN conda install -c conda-forge conda-pack

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
