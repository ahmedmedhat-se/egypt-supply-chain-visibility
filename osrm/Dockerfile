# syntax=docker/dockerfile:1.7
# Self-built OSRM image with the region's street network preprocessed and
# baked in at build time, so `docker compose up` needs no data-prep step.
#
# Build args (default to Egypt from Geofabrik):
#   REGION   short name used for the routing database   (egypt)
#   PBF_URL  source OpenStreetMap extract URL
#   OSRM_IMAGE  upstream osrm-backend image tag

ARG OSRM_IMAGE=ghcr.io/project-osrm/osrm-backend:latest
ARG ALPINE_IMAGE=alpine:3.21
ARG REGION=egypt
ARG PBF_URL=https://download.geofabrik.de/africa/egypt-latest.osm.pbf

# The osrm-backend runtime image ships no http client, so download the map in
# a throwaway alpine stage and copy just the file forward.
FROM ${ALPINE_IMAGE} AS downloader
ARG PBF_URL
ARG REGION
RUN apk add --no-cache ca-certificates && \
    mkdir -p /data && wget -q -O "/data/${REGION}.osm.pbf" "${PBF_URL}"

# Full extraction -> partition -> customize in one pass. The raw PBF is removed
# afterwards so it never lands in the final image.
FROM ${OSRM_IMAGE} AS preprocess
ARG REGION
WORKDIR /work
COPY --from=downloader "/data/${REGION}.osm.pbf" /work/region.osm.pbf
RUN osrm-extract -p /opt/car.lua /work/region.osm.pbf && \
    osrm-partition /work/region.osrm && \
    osrm-customize /work/region.osrm && \
    rm -f /work/region.osm.pbf

FROM ${OSRM_IMAGE}
COPY --from=preprocess /work/region.osrm* /data/
EXPOSE 5000
CMD ["/usr/local/bin/osrm-routed", "--algorithm", "mld", "/data/region.osrm"]