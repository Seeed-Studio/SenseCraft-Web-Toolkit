.PHONY: run build image push clean

tag = latest
releaseName = sensecraft-web-toolkit

ALL: run

run:
	yarn run dev

build:
	yarn run build

image:
	docker build -f ./docker/Dockerfile -t $(releaseName):$(tag) .