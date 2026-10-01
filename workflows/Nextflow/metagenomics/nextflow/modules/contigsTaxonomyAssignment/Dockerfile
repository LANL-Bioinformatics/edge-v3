# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:v25.11.1 AS build
ENV version=1.12.2

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name contigsTaxonomyAssignment \
    && conda activate contigsTaxonomyAssignment 

RUN conda install -n contigsTaxonomyAssignment python=3.9 r-base=4.3.1 
RUN conda install -n contigsTaxonomyAssignment -c bioconda minimap2=2.31 pandas=2.1.4 perl-json=4.10
RUN conda install -c conda-forge conda-pack=0.8.1
#use latest miccr (v0.0.3) with Chienchi's fix for tokenizing alignment file
#pin to SHA 686e245d7934c28565db948262b477eb7d3ed1b9
RUN git clone --depth 1 https://github.com/chienchi/miccr.git && \ 
    cd miccr && git checkout 686e245d7934c28565db948262b477eb7d3ed1b9 

#pack environment for runtime image
RUN conda-pack -n contigsTaxonomyAssignment -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack

FROM debian:trixie AS runtime

COPY --from=build /venv /venv
COPY --from=build /miccr /miccr

#add environment and miccr to PATH
ENV PATH=/venv/bin:/miccr:/miccr/utils:$PATH
RUN apt-get update && apt-get install procps -y && apt-get clean

SHELL ["/bin/bash", "-c"]
CMD /bin/bash
