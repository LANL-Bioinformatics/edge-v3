# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:main AS build
ENV version=0.1

ENV container=docker

RUN git clone --depth=1 https://github.com/aw-watson/MetaVF_toolkit.git

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda env create --name MetaVF_toolkit -f /MetaVF_toolkit/env/MetaVF_toolkit_no_builds.yaml \
    && conda activate MetaVF_toolkit 

# #pack environment
# RUN conda install -c conda-forge conda-pack

# RUN conda-pack -n MetaVF_toolkit -o /tmp/env.tar && \
#     mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
#     rm /tmp/env.tar

# RUN /venv/bin/conda-unpack

# FROM debian:latest AS runtime

# COPY --from=build /venv /venv
# COPY --from=build /MetaVF_toolkit /MetaVF_toolkit

RUN gunzip /MetaVF_toolkit/databases/*.gz && chmod 755 /MetaVF_toolkit/metaVF.py

ENV PATH=/venv/bin:/MetaVF_toolkit:$PATH
RUN apt-get update && apt-get install procps -y && apt-get clean
    
SHELL ["/bin/bash", "-c"]
CMD /bin/bash
