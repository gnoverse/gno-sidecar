# Can be either one of 'chrome', 'edge', 'firefox' or several separated by
# commas, e.g. 'edge,firefox'
BROWSER ?= chrome

# Internal
MAKEFILE_DIR = $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
NODE_MODULES = $(MAKEFILE_DIR)/node_modules
BUILD_DIR    = $(MAKEFILE_DIR)/dist

help:
	@echo "Help:"
	@echo "   make start_dev  ->  Run extension in dev mode (see BROWSER below)"
	@echo "   make start_prod ->  Run extension in prod mode (see BROWSER below)"
	@echo "   make build      ->  Build extension for prod (see BROWSER below)"
	@echo "   make clean      ->  Clean up dependencies and generated files"
	@echo
	@echo "   BROWSER         ->  Env var used to specify a target, e.g : 'firefox,edge,chrome'"

start_dev: $(NODE_MODULES)
	@cd $(MAKEFILE_DIR) && npm run dev -- --browser=$(BROWSER)

start_prod: $(NODE_MODULES)
	@cd $(MAKEFILE_DIR) && npm run start -- --browser=$(BROWSER)

build: $(NODE_MODULES)
	@cd $(MAKEFILE_DIR) && npm run build -- --browser=$(BROWSER)

$(NODE_MODULES): $(MAKEFILE_DIR)/package.json
	@cd $(MAKEFILE_DIR) && npm install
	touch $@

clean:
	@rm -rf $(NODE_MODULES)
	@rm -rf $(BUILD_DIR)

.PHONY: help start_dev start_prod build clean
