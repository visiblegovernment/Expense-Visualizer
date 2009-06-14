PRODUCT      :=dist
SOURCE_FILES := $(wildcard lib/css/*.* lib/css/theme/*.* lib/css/theme/images/*.* lib/js/*.* lib/sjs/*.* lib/images/*.* *.paml applets/*.paml elements/*.paml lib/swf/*.swf lib/css/*.css data/*.json)
DIST_FILES   := $(SOURCE_FILES:lib/sjs/%.sjs=lib/js/%.js)
DIST_FILES   := $(DIST_FILES:%.paml=%.html)
DIST_FILES   := $(DIST_FILES:%=$(PRODUCT)/%)

build: $(DIST_FILES)
	@echo $(DIST_FILES) | xargs -n1 echo

tarball: build
	@tar cvfz $(PRODUCT)-`date +'%F'`.tar.gz $(PRODUCT)

run:
	export SUGARPATH=lib/sjs && pamela-web

stats:
	@echo Paml files `do findr .paml | xargs -n1 basename | sort | uniq | wc -l`
	@echo Paml lines `do findr .paml | xargs cat | wc -l`
	@echo CSS  lines `cat lib/css/creativewire.css lib/css/base.css | wc -l`

clean:
	rm $(DIST_FILES) || true

$(PRODUCT)/%: %
	mkdir -p `dirname $@`
	cp $< $@

$(PRODUCT)/%.html: %.paml
	mkdir -p `dirname $@`
	pamela $< | sed 's|sjs/|js/|g' | sed 's|\.sjs|\.js|g' | sed 's|.paml|.html|g' > $@

$(PRODUCT)/lib/js/%.js: lib/sjs/%.sjs
	sugar -cljs -Llib/sjs $< | sed 's|.paml|.html|g' > $@
