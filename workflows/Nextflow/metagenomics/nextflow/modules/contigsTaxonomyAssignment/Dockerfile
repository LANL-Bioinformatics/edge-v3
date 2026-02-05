# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:main AS build
ENV version=1.12.0

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name contigsTaxonomyAssignment \
    && conda activate contigsTaxonomyAssignment 

RUN conda install -n contigsTaxonomyAssignment python=3.5
RUN conda install -n contigsTaxonomyAssignment r-base=4.3.1
RUN conda install -n contigsTaxonomyAssignment -c bioconda minimap2=2.24
RUN conda install -n contigsTaxonomyAssignment -c bioconda pandas=0.23.4
RUN conda install -n contigsTaxonomyAssignment -c bioconda perl-json
RUN conda install -c conda-forge conda-pack
#use latest miccr (v0.0.3) with Chienchi's fix for tokenizing alignment file
RUN git clone --depth 1 https://github.com/chienchi/miccr.git

#pack environment for runtime image
RUN conda-pack -n contigsTaxonomyAssignment -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack

FROM debian:latest AS runtime

COPY --from=build /venv /venv
COPY --from=build /miccr /miccr

#add environment and miccr to PATH
ENV PATH=/venv/bin:/miccr:/miccr/utils:$PATH
RUN apt-get update && apt-get install procps -y && apt-get clean

SHELL ["/bin/bash", "-c"]
CMD /bin/bash
