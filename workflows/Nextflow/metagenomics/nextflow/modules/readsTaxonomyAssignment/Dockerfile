# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:v25.11.1 AS build
ENV version=1.15.1

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name readsTaxonomyAssignment \
    && conda activate readsTaxonomyAssignment 

RUN conda install -n readsTaxonomyAssignment python=3.10
#the required version of diamond is 2.0.5, but this runs into conda installation problems
#we will install it here to handle any dependencies, then later replace diamond with the appropriate release

#conda does not have the most recent version of gottcha (1.0b instead of 1.0c), 
#but we encounter errors when compiling splitrim.d in gottcha's latest source code release. 
#we will install gottcha here and later replace the non-splitrim scripts with the latest source code.
RUN conda install -n readsTaxonomyAssignment -c bioconda gottcha2=2.5.0 minimap2=2.17 \
    metaphlan=4.1.1 diamond=2.1.10 perl-json=4.10 perl-html-template=2.97 perl-xml-simple=2.25 \
    perl-excel-writer-xlsx=1.15 kraken2=2.1.3 krona=2.8.1 perl-yaml=1.30 centrifuge=1.0.4 pybedtools=0.10.0 \
    gottcha=1.0 bowtie2=2.5.1 perl-bioperl=1.7.8 perl-bioperl-core=1.7.8
RUN conda install -n readsTaxonomyAssignment -c conda-forge parallel=20260122 perl-app-cpanminus=1.7048 cairosvg=2.7.1 setuptools
RUN conda install -c conda-forge conda-pack=0.8.1


#download latest PanGIA 
#custom version from EDGE needed
RUN wget https://ref-db.edgebioinformatics.org/EDGE/dev/edge_dev_thirdParty_softwares.tgz \
    && tar -xvzf edge_dev_thirdParty_softwares.tgz \
    && tar -xvzf thirdParty/pangia-1.0.0.tar.gz -C . \
    && mv pangia /opt/conda/envs/readsTaxonomyAssignment/opt

#correct diamond version
RUN wget https://github.com/bbuchfink/diamond/releases/download/v2.0.5/diamond-linux64.tar.gz \
    && tar -xvzf diamond-linux64.tar.gz

#correct gottcha version
RUN wget https://github.com/LANL-Bioinformatics/GOTTCHA/archive/refs/tags/1.0c.tar.gz \
    && tar -xvzf 1.0c.tar.gz \
    && chmod 755 GOTTCHA-1.0c/src/*.pl


#pack environment for runtime image
RUN conda-pack -n readsTaxonomyAssignment -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack

FROM debian:trixie AS runtime

COPY --from=build /venv /venv
COPY --from=build /diamond /venv/bin
COPY --from=build /GOTTCHA-1.0c/src/*.pl /venv/bin

#add environment, pangia base and vis-scripts to PATH
ENV PATH=/venv/bin:/venv/opt/pangia:/venv/opt/pangia/pangia-vis/scripts:/venv/opt/krona:$PATH
ENV PERL5LIB=/venv/lib/perl5/core_perl/
RUN apt-get update && apt-get install procps -y && apt-get clean


SHELL ["/bin/bash", "-c"]
CMD /bin/bash
