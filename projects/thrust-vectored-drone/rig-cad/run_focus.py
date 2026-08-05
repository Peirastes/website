import os
import sys

# Stale .pyc bit us: Python's source-mtime check is 1-second granular, so an
# edit in the same second as the previous run reuses old bytecode.
sys.dont_write_bytecode = True

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import focus_view

focus_view.main()
