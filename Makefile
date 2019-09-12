#!/usr/bin/env bash

ENVIRONMENT ?= dev
SERVICE ?= aws-sns-sqs
AWS_REGION ?= eu-west-1
BITBUCKET_BUILD_NUMBER ?= localbuild

ARTIFACTS_BUCKET:=artifactory-$(ENVIRONMENT)
ARTIFACTS_PREFIX:=$(SERVICE)

SNS_STACK_NAME = $(SERVICE)-sns
SQS_STACK_NAME = $(SERVICE)-sqs

NOW = $(shell date)
#REPOS = $(shell git config --get remote.origin.url)
#REV = $(shell git rev-parse HEAD)

# This needs to be deoloyed first
.PHONY: deploy_sns
deploy_sns:
	@echo "\n----- Deploying SNS stack START -----\n"
	aws cloudformation deploy \
	--template-file cloudformation/sns.yml \
	--stack-name $(SNS_STACK_NAME) \
	--capabilities CAPABILITY_NAMED_IAM \
	--region $(AWS_REGION) \
	--tags Environment=$(ENVIRONMENT) \
				"UpdatedDate=$(NOW)" \
				BitbucketBuildNumber=$(BITBUCKET_BUILD_NUMBER) \
	--parameter-overrides \
	Service=$(SERVICE)
	@echo "\n----- Deploying SNS stack DONE -----\n"

# deploy this after the sns stack
.PHONY: deploy_sqs
deploy_sqs:
	@echo "\n----- Deploying SQS stack START -----\n"
	aws cloudformation deploy \
	--template-file cloudformation/sqs.yml \
	--stack-name $(SQS_STACK_NAME) \
	--capabilities CAPABILITY_NAMED_IAM \
	--region $(AWS_REGION) \
	--tags Environment=$(ENVIRONMENT) \
				"UpdatedDate=$(NOW)" \
				BitbucketBuildNumber=$(BITBUCKET_BUILD_NUMBER) \
	--parameter-overrides \
	Service=$(SERVICE)
	@echo "\n----- Deploying SQS stack DONE -----\n"

.PHONY: deploy_serverless
deploy_serverless:
	@echo "\n----- Deploying serverless stack -----\n"
	$(call cfn-deploy,serverless)

cfn-deploy = $(call cfn-package,${1}) && \
	aws cloudformation deploy \
	--template-file cloudformation/dist/${1}.yml \
	--stack-name $(SERVICE)-${1} \
	--capabilities CAPABILITY_NAMED_IAM \
	--region $(AWS_REGION) \
	--tags Environment=$(ENVIRONMENT) \
				"UpdatedDate=$(NOW)" \
				BitbucketBuildNumber=$(BITBUCKET_BUILD_NUMBER) \
	--no-fail-on-empty-changeset \
	--parameter-overrides \
		Service=$(SERVICE) \
		Environment=$(ENVIRONMENT) \
		Region=${AWS_REGION}

cfn-package = mkdir -p cloudformation/dist && \
	aws cloudformation package \
	--template-file cloudformation/${1}.yml \
	--output-template-file cloudformation/dist/${1}.yml \
	--s3-bucket $(ARTIFACTS_BUCKET) \
	--s3-prefix $(ARTIFACTS_PREFIX)

clean:
	npm cache clean --force
	rm -rf node_modules
	for f in src/*; do \
		([ -d $$f ] && cd "$$f" && rm -rf node_modules) \
  done;

install:
	npm install
	for f in src/*; do \
		([ -d $$f ] && cd "$$f" && npm install) \
  done;

install_production:
	npm install --production
	for f in src/*; do \
		([ -d $$f ] && cd "$$f" && npm install --production) \
  done;

prune:
	npm prune --production
	for f in src/*; do \
		([ -d $$f ] && cd "$$f" && npm prune --production) \
  done;

lint:
	./node_modules/.bin/eslint '**/*.js' --ignore-path .gitignore --fix

test: lint
	./node_modules/.bin/jest tests/**/*.test.js --silent

test-coverage:
	./node_modules/.bin/jest tests/**/*.test.js --silent --ci --coverage

ci: install validate_config test-coverage prune

validate_config:
	npm install ajv
	node scripts/validateConfig.js

deploy_config:
	npm install aws-sdk
	node scripts/deployConfig.js $(AWS_REGION) $(SERVICE)-config
