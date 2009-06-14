import MySQLdb, time, random, os
from retro.core import asJSON

# =============================================================================
# Datalicious data-collect function
# =============================================================================

LAST_FILE = None
def path(p=None):
	global LAST_FILE
	if p:
		LAST_FILE = p
		return p
	else:
		assert LAST_FILE
		return LAST_FILE
def exists(p):return os.path.exists(path(p))
def load(p=None):return file(path(p),'r').read()
def save(d,p=None):return file(path(p),'w').write(d)
def saveb(d,p=None):return file(path(p),'wb').write(d)
def json(d):import simplejson;return simplejson.dumps(d)
def unjson(d):import simplejson;return simplejson.loads(d)

# =============================================================================
# Visible Government Schema Queries
# =============================================================================

# NOTE: Here we divide the total by 0.44, so as to make the hospitality and
# travel guidelines on the same par -- of course, this makes the travel expense
# guideline irrelevant, as it's just a factor of the actual amount, but at least
# it won't interefere with the hospitality guidelines.
TRAVEL_EXPENSES_QUERY = """
select e.department, e.position, e.start_date, e.end_date, e.total/100, e.total/100/0.44 from travel_expense_with_position as e;
"""

HOSPITALITY_EXPENSES_QUERY = """
select e.department, e.position, e.start_date, e.end_date, e.total/100, sum(g.value
* a_g.multiplier/100)  from hospitality_expense_with_position as e
join applied_guidelines as a_g on e.id = a_g.expense_id join
guidelines as g on g.id = a_g.guideline_id group by e.id 
"""
POSITIONS_QUERY = """
select id, name from positions order by name;
"""

DEPARTMENTS_QUERY = """
select id, name from sites order by name;
"""
# =============================================================================
# Data model
# =============================================================================

class Data:

	FIELDS = []
	KEY    = None
	ALL    = None
	INDEX  = None

	def __init__( self, **kwargs ):
		if self.__class__.ALL is None:
			self.__class__.ALL = []
		if self.__class__.INDEX is None:
			self.__class__.INDEX = {}
		for name, default in self.fields():
			setattr( self, name, eval(default))
		self.__class__.ALL.append(self)
		for name, value in kwargs.items():
			self.set(name, value)

	def fields( self ):
		for f in self.FIELDS:
			name    = None
			default = f.split("=",1)
			if len(default) == 1:
				name    = default[0]
				default = "None"
			else:
				name    = default[0]
				default = default[1]
			yield name, default

	def fieldNames( self ):
		for name,_ in self.fields():
			yield name

	def set( self, field, value ):
		assert field in self.fieldNames()
		prev = getattr(self, field)
		if field == self.KEY:
			if prev != None: del self.__class__.INDEX[prev]
			self.__class__.INDEX[value] = self
		setattr( self, field, value )

	def get( self, field ):
		return getattr(self, field)

	def export( self ):
		res = {}
		for n in self.fieldNames():
			v = getattr(self, n)
			if isinstance(v, Data):
				v = v.export()
			res[n] = v
		return res

	def asJSON( self, jsonifier, **options ):
		return jsonifier(self.export())

class Amount(Data):

	FIELDS = [
		"hos=0",
		"hos_gd=0",
		"tra=0",
		"tra_gd=0",
		"all=0",
		"all_gd=0"
	]

class Department(Data):

	KEY    = "name"
	FIELDS = [
		"name",
		"start",
		"end",
		# Spendings per month
		"mon={}",
		# Spendings per month and position
		"mon_pos={}",
		"total=Amount()",
		"max_month=Amount()"
	]

	def addMonthSpending( self, month, position, type, amount, guidelines ):
		assert amount > 0
		assert guidelines > 0
		if self.start == -1: self.start = month
		else: self.start = min(self.start, month)
		if self.end == -1: self.end = month
		else: self.end = min(self.end, month)
		mon     = self.mon
		mon_pos = self.mon_pos
		if not mon.has_key(month):
			mon[month] = Amount()
			assert not mon_pos.has_key(month)
			mon_pos[month] = {}
		if not mon_pos[month].has_key(position):
			mon_pos[month][position] = Amount()
		if type == "hospitality":
			for a in (mon[month], mon_pos[month][position], self.total):
				a.hos    += amount
				a.hos_gd += guidelines
		else:
			for a in (mon[month], mon_pos[month][position], self.total):
				a.tra    += amount
				a.tra_gd += guidelines
		for a in (mon[month], mon_pos[month][position], self.total):
			a.all    += amount
			a.all_gd += guidelines
		# We take care of the maximum
		self.max_month.hos    = max(self.max_month.hos, mon[month].hos)
		self.max_month.hos_gd = max(self.max_month.hos_gd, mon[month].hos_gd)
		self.max_month.tra    = max(self.max_month.tra, mon[month].tra)
		self.max_month.tra_gd = max(self.max_month.tra_gd, mon[month].tra_gd)
		self.max_month.all    = max(self.max_month.all, mon[month].all)
		self.max_month.all_gd = max(self.max_month.all_gd, mon[month].all_gd)

# =============================================================================
# Data processing functions
# =============================================================================

POSITIONS   = {}
MIN_YEAR = 2003
MAX_YEAR = 2009

def normalize_position( position ):
	"""Returns an integere representing the normalized position"""
	assert POSITIONS, "Positions must be loaded"
	assert position in POSITIONS.keys(), "Position not known: %s" % (position)
	return POSITIONS[position]

pytype = type
def department_add_expenses(department, position, type, date, amount, guidelines):
	"""Adds the given 'type' (hospitality or travel) information for the
	given 'department'."""
	dep    = Department.INDEX[department]
	# NOTE: Before 200903 dataset, date was timetuple
	#date   = date.timetuple()
	if pytype(date) == str:
		date = map(int, date.split("-"))
	else:
		date = date.timetuple()
		date = [date.tm_year, date.tm_mon, date.tm_mday]
	# Offset represents the number of months since the start of the dataset
	# range
	month = (date[0] - MIN_YEAR) * 12 + date[1]
	valid =  month >= 0 and month < ((MAX_YEAR - MIN_YEAR) * 12)
	position = normalize_position(position)
	if valid and amount:
		if guidelines <= 0:
			print "ERROR: Invalid guidelines : %s for %s" % (date, department)
			guidelines = amount
		dep.addMonthSpending(month, position, type, amount, guidelines)
		# We update the maximum months information
		#dep["maxMonth"][type] = max(dep["maxMonth"][type], amounts["expenses"][type])
		#dep["maxMonth"]["all"]  = max(dep["maxMonth"]["all"], amounts["expenses"]["all"])
		#print date[0], date[1], amount, "/", dep["amounts"][offset]["expenses"]
	else:
		print "ERROR: Invalid data : %s for %s" % (date, department)

# =============================================================================
# Data collection
# =============================================================================

conn   = MySQLdb.connect(host="localhost",user="sebastien",passwd="pouetpouet",db="dev_visiblegovernment")
cursor = conn.cursor ()
# FIXME: Disabled until we get the real query
cursor.execute(TRAVEL_EXPENSES_QUERY)
travel_expenses = cursor.fetchall()
cursor.execute(HOSPITALITY_EXPENSES_QUERY)
hospitality_expenses = cursor.fetchall()
#travel_expenses      = hospitality_expenses
cursor.execute(POSITIONS_QUERY)
positions = cursor.fetchall()
cursor.execute(DEPARTMENTS_QUERY)
departments = cursor.fetchall()
cursor.close ()
conn.close ()

# =============================================================================
# Data processing
# =============================================================================

# We create the positions
index = 1
for id, name in positions:
	POSITIONS[name] = index
	index += 1

# We only need to init the departments once
for id, name in departments:
	Department(name=name)

# We process travel expenses
for name,position,start,end,total,guidelines in travel_expenses:
	total = float(total)
	guidelines = float(guidelines or -1)
	department_add_expenses(name, position, "travel", start, total, guidelines)

# And hospitality expenses
for name,position,start,end,total,guidelines in hospitality_expenses:
	total = float(total)
	guidelines = float(guidelines or -1)
	department_add_expenses(name, position, "hospitality", start, total, guidelines)

# =============================================================================
# Data export
# =============================================================================

# We clean up departments with no total
deps = tuple(Department.ALL)
for i in range(0, len(deps)):
	d = deps[i]
	if d.total.all == 0:
		Department.ALL.remove(d)

# We save the expenses in a file
save("var EXPENSES=" + asJSON(Department.ALL),"dataset/expenses-by_dep.json")
save("var POSITIONS=" + asJSON(positions),"dataset/positions.json")
save("var DEPARTMENTS=" + asJSON(departments),"dataset/departments.json")

print Department.INDEX.keys(), len(Department.INDEX.keys())

# EOF
