# Use a minimal micromamba base image from the mamba-org Docker Hub repo
FROM mambaorg/micromamba:2.5.0-debian12

# Set up the environment
USER root
# Nextflow requires Java 11 or later
RUN apt-get update && \
    apt-get install -y default-jdk && \
    apt-get clean;

# Set JAVA_HOME environment variable
ENV JAVA_HOME /usr/lib/jvm/default-java

# Use micromamba to install Nextflow from the bioconda channel
# It's good practice to use a YAML file for complex environments, but a direct install works for just nextflow
RUN micromamba install -y -n base -c bioconda -c conda-forge nextflow && \
    micromamba clean -a

# Ensure the nextflow executable is in the PATH (micromamba manages this, but we can be explicit if needed)
# ENV PATH="$MAMBA_ROOT_PREFIX/bin:$PATH" # This should already be handled by the base image

# Set the working directory
RUN apt-get update && apt-get install -y bash ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

ARG NODE_MAJOR=20
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get install nodejs -y
 
LABEL org.opencontainers.image.description="EDGEv3 Web App"
# LABEL org.opencontainers.image.source="https://github.com/microbiomedata/nmdc-edge"

# Create an environment variable that contains the web app version identifier.
#
# Note: Its value will come from the `--build-arg NMDC_EDGE_WEB_APP_VERSION={value}`
#       CLI option, if any, included in the `$ docker build` command.
#       Reference: https://docs.docker.com/reference/dockerfile/#arg
#
ARG NMDC_EDGE_WEB_APP_VERSION
ENV NMDC_EDGE_WEB_APP_VERSION="$NMDC_EDGE_WEB_APP_VERSION"

# Create ORCID-related environment variables Node.js will consume while building the React app.
ARG IS_ORCID_AUTH_ENABLED
ENV REACT_APP_IS_ORCID_AUTH_ENABLED="$IS_ORCID_AUTH_ENABLED"

ARG ORCID_CLIENT_ID
ENV REACT_APP_ORCID_CLIENT_ID="$ORCID_CLIENT_ID"

# Allow the developer to (optionally) customize the ID and name of the user by which PM2 will
# be launched; and the ID and name of the group to which that user will belong.
ARG USER_ID=60005
ARG GROUP_ID=60005
ARG USER_NAME=webuser
ARG GROUP_NAME=webuser

# Install programs upon which the web app or its build process(es) depend.
#
# Note: `apk` (Alpine Package Keeper) is the Alpine Linux equivalent of `apt`.
#       Docs: https://wiki.alpinelinux.org/wiki/Alpine_Package_Keeper
#


# Update npm, itself, to the latest version.
RUN npm install -g npm@latest

# Install the latest version of PM2 globally (https://github.com/Unitech/pm2).
RUN npm install -g pm2@latest

# Set up both the web app client and the web app server.
#
# Note: I am intentionally omitting this Dockerfile from this COPY operation because I don't
#       want to trigger lots of cache misses while I'm still developing this Dockerfile.
#
# Note: By copying so much of the file tree this early in the Docker image build process,
#       we may be missing out on some Docker image layer caching opportunities.
#

WORKDIR /app
COPY ./installation  /app/installation
COPY ./webapp        /app/webapp
COPY ./pm2.config.js /app/pm2.config.js
#
# Generate empty folders (like `installation/install.sh` does).
# Note: `mkdir -p` automatically creates any necessary intermediate folders.
#
RUN mkdir -p io
RUN cd io && mkdir -p upload/files upload/tmp log projects public db sra
#

#
# Install the npm packages upon which the web app client depends.
#
# Note: The `--legacy-peer-deps` option is here because some of the npm packages upon which the web app depends,
#       have conflicting dependencies with one another. The `--legacy-peer-deps` option causes npm to be more
#       lenient about stuff like that. Reference: https://stackoverflow.com/a/66620869
#
RUN cd webapp/client && npm ci --legacy-peer-deps
#
# Build the web app client (i.e. React app).
#
# Note: Prefix the `npm run build` command with `NODE_OPTIONS=--openssl-legacy-provider`
#       in order to work around https://github.com/microbiomedata/nmdc-edge/issues/15.
#
RUN cd webapp/client && NODE_OPTIONS=--openssl-legacy-provider npm run build
#
# Build the web app server (e.g. Express app).
#
RUN cd webapp/server && npm ci

# Create a group having the specified GID (Group ID) and group name, and create
# a user (in that group) having the specified UID (User ID) and user name.
# Reference: https://gist.github.com/utkuozdemir/3380c32dfee472d35b9c3e39bc72ff01
RUN addgroup --gid $GROUP_ID $GROUP_NAME && \
    adduser --shell /sbin/nologin --disabled-password \
            --ingroup $GROUP_NAME --uid $USER_ID $USER_NAME

# Switch to that user before running the subsequent commands.
# Reference: https://docs.docker.com/reference/dockerfile/#user
USER $USER_NAME

# Run PM2 in the foreground. PM2 will serve the NMDC EDGE web app.
#
# Note: We use `pm2-runtime` (instead of `pm2` directly), as shown in the PM2
#       documentation about using PM2 inside containers.
#       Docs: https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/
#
CMD ["pm2-runtime", "start", "pm2.config.js"]
