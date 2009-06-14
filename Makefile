MYSQL_USER=
MYSQL_PASS=
MYSQL_DB=dev_visiblegovernment
HOSTNAME=localhost
DATASET_DB=`ls -1 dataset/*.sql.bz2 | tail -n1`

.PHONY: createdb cleardb loaddb data vizdata

info:
	@echo VisibleGovernment - Spendings Visualization Makefile
	@echo
	@echo "createdb  - creates the database"
	@echo "cleardb   - clears the data in the database"
	@echo "loaddb    - loads the last .sql snapshot in dataset/"
	@echo "data      - runs the 'collect.py' script to process the data"
	@echo "vizdata   - copies the processed data to the viz directory"
	@echo

createdb:
	echo "create database $(MYSQL_DB) ; grant all privileges on $(MYSQL_DB).* to '$(MYSQL_USER)'@'$(HOSTNAME)';" | mysql -uroot -p ; true

cleardb:
	mysqldump -u$(MYSQL_USER) -p$(MYSQL_PASS) --add-drop-table --no-data $(MYSQL_DB) | grep ^DROP | mysql -u$(MYSQL_USER) -p$(MYSQL_PASS) -D$(MYSQL_DB) ; true

loaddb: createdb cleardb
	bunzip2 -c $(DATASET_DB) | mysql -u$(MYSQL_USER) -p$(MYSQL_PASS) -D$(MYSQL_DB)

data:
	python collect.py

vizdata: data
	cp dataset/*.json viz/data/

# EOF
