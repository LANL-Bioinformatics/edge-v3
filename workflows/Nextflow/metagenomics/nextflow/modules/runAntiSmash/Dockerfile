# syntax=docker/dockerfile:1
FROM antismash/standalone-lite-nonfree:7.1.0
ENV version=0.15.2

RUN apt-get update && apt-get install procps -y && apt-get clean

#we override the base image's entrypoint for appropriate interaction with Nextflow
ENTRYPOINT ["/usr/bin/env"]
SHELL ["/bin/bash", "-c"]
CMD /bin/bash
