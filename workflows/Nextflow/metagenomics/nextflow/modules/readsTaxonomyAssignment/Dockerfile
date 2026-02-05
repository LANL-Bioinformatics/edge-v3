# syntax=docker/dockerfile:1
FROM continuumio/miniconda3:main AS build
ENV version=1.15.0

ENV container=docker

# add conda channels
RUN conda config --add channels conda-forge \
    && conda config --add channels bioconda

RUN conda init bash \
    && . ~/.bashrc \
    && conda create --name readsTaxonomyAssignment \
    && conda activate readsTaxonomyAssignment 

RUN conda install -n readsTaxonomyAssignment python=3.10
RUN conda install -n readsTaxonomyAssignment -c bioconda gottcha2=2.1.8.8 minimap2=2.17 metaphlan=4.1.1
#the required version of diamond is 2.0.5, but this runs into conda installation problems
#we will install it here to handle any dependencies, then later replace diamond with the appropriate release
RUN conda install -n readsTaxonomyAssignment -c bioconda diamond 
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-json
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-html-template
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-xml-simple
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-excel-writer-xlsx
RUN conda install -n readsTaxonomyAssignment -c bioconda kraken2
RUN conda install -n readsTaxonomyAssignment -c bioconda krona
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-yaml
RUN conda install -n readsTaxonomyAssignment -c bioconda centrifuge
RUN conda install -n readsTaxonomyAssignment -c bioconda pybedtools
RUN conda install -n readsTaxonomyAssignment -c conda-forge parallel
#conda does not have the most recent version of gottcha (1.0b instead of 1.0c), 
#but we encounter errors when compiling splitrim.d in gottcha's latest source code release. 
#we will install gottcha here and later replace the non-splitrim scripts with the latest source code.
RUN conda install -n readsTaxonomyAssignment -c bioconda gottcha
RUN conda install -n readsTaxonomyAssignment -c bioconda bowtie2=2.5.1
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-html-template
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-xml-simple
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-excel-writer-xlsx
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-bioperl
RUN conda install -n readsTaxonomyAssignment -c conda-forge perl-app-cpanminus
RUN conda install -n readsTaxonomyAssignment -c bioconda perl-bioperl-core
RUN conda install -n readsTaxonomyAssignment -c conda-forge cairosvg=2.7.1
RUN conda install -c conda-forge conda-pack


#download latest PanGIA 
#ISSUE: differs from version in EDGE's third-party software, in ways that break scripts
#we can get EDGE's version from its third-party tarball, but it's a wastefully large download.
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


#add scripts from this project to bin
#ADD bin/* /opt/conda/envs/readsTaxonomyAssignment/bin

#pack environment for runtime image
RUN conda-pack -n readsTaxonomyAssignment -o /tmp/env.tar && \
    mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
    rm /tmp/env.tar

RUN /venv/bin/conda-unpack

FROM debian:latest AS runtime

COPY --from=build /venv /venv
COPY --from=build /diamond /venv/bin
COPY --from=build /GOTTCHA-1.0c/src/*.pl /venv/bin

#add environment, pangia base and vis-scripts to PATH
ENV PATH=/venv/bin:/venv/opt/pangia:/venv/opt/pangia/pangia-vis/scripts:/venv/opt/krona:$PATH
ENV PERL5LIB=/venv/lib/perl5/core_perl/
RUN apt-get update && apt-get install procps -y && apt-get clean


SHELL ["/bin/bash", "-c"]
CMD /bin/bash
